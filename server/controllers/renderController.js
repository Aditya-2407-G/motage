import path from 'path';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import fs from 'fs/promises';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add image processing utility
const processImage = async (imageUrl) => {
  if (!imageUrl) return null;
  
  try {
    // Handle base64 images
    if (imageUrl.startsWith('data:image')) {
      const base64Data = imageUrl.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      return await sharp(imageBuffer)
        .resize({
          width: 1920,
          height: 1080,
          fit: 'inside',
          withoutEnlargement: true,
          kernel: sharp.kernel.lanczos3, // Better quality scaling
        })
        .png({ quality: 100, compressionLevel: 0 }) // Use PNG for maximum quality
        .toBuffer()
        .then(buffer => `data:image/png;base64,${buffer.toString('base64')}`);
    }
    
    // Handle regular URLs
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return await sharp(buffer)
      .resize({
        width: 1920,
        height: 1080,
        fit: 'inside',
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .png({ quality: 100, compressionLevel: 0 })
      .toBuffer()
      .then(buffer => `data:image/png;base64,${buffer.toString('base64')}`);
  } catch (error) {
    console.error('Image processing error:', error);
    return imageUrl; // Return original URL if processing fails
  }
};

const chromiumOptions = {
  chromiumOptions: {
    ignoreDefaultArgs: ['--disable-dev-shm-usage'],
    args: [
      '--disable-gpu', 
      '--no-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-dev-tools',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--disable-logging',
      '--disable-remote-fonts',
      '--disable-web-security',
      '--js-flags="--max-old-space-size=8192"'
    ],
  },
  timeoutInMilliseconds: 300000,
  concurrency: 8, // Increase parallel renders (adjust based on your CPU)
  serialization: "json",
};

export const renderVideo = async (req, res) => {
  let cleanup = null;

  try {
    const { filename, items, audio, durationInFrames, fps = 30, duration } = req.body;
    
    // Process all images before rendering
    const processedItems = await Promise.all(
      items.map(async (item) => {
        if (item.type === 'image') {
          const processedUrl = await processImage(item.url);
          return { ...item, url: processedUrl };
        }
        return item;
      })
    );

    // Ensure we use the maximum duration between audio and timeline
    const totalDurationMs = Math.max(
      audio?.duration || 0,
      duration || 0
    );
    
    // Calculate the actual duration in frames, ensuring it's at least 1 frame
    const actualDurationInFrames = Math.max(
      1,
      Math.ceil((totalDurationMs / 1000) * fps)
    );

    console.log('Render request received:', {
      requestedDurationInFrames: durationInFrames,
      actualDurationInFrames,
      fps,
      totalDurationMs,
      itemsCount: items?.length,
      hasAudio: !!audio
    });

    // Create the output directory if it doesn't exist
    const renderedDir = path.join(__dirname, '..', 'rendered');
    await fs.mkdir(renderedDir, { recursive: true });

    // Output path for the rendered video
    const outputPath = path.join(renderedDir, `${filename}.mp4`);

    // Check if output path already exists and remove it
    try {
      await fs.access(outputPath);
      await fs.unlink(outputPath);
    } catch (err) {
      // File doesn't exist, which is fine
    }

    // Bundle the video
    const bundled = await bundle({
      entryPoint: path.join(__dirname, '../../src/components/player/RenderEntry.jsx'),
      webpackOverride: (config) => config,
    });

    const inputProps = {
      items: processedItems, // Use processed items instead of original
      audio,
      durationInFrames: actualDurationInFrames,
      fps,
      duration: totalDurationMs
    };

    // Select the composition
    const composition = await selectComposition({
      serveUrl: bundled,
      id: 'remotion-player',
      inputProps,
    });

    // Ensure the composition duration is set
    composition.durationInFrames = actualDurationInFrames;

    console.log('Detailed render configuration:', {
      inputProps,
      composition: {
        width: composition.width,
        height: composition.height,
        fps: composition.fps,
        durationInFrames: composition.durationInFrames,
      },
      outputPath,
    });

    // Render the video with more compatible settings
    const renderResult = await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      fps,
      durationInFrames: actualDurationInFrames,
      inputProps,
      ...chromiumOptions,
      imageFormat: "jpeg", // Changed from PNG to JPEG for better compatibility
      scale: 1,
      encodingPreset: "veryfast", // Changed from veryslow to medium for better compatibility
      crf: 23, // Changed from 17 to 23 - better balance between quality and compatibility
      pixelFormat: "yuv420p", // Changed from yuv444p to yuv420p for better compatibility
      x264: {
        preset: "medium", // Changed from veryslow to medium
        profile: "high", // Changed from high444 to high
        tune: "film",
        params: {
          "aq-mode": "1",
          "aq-strength": "1.0",
          "deblock": "0:0",
          "me": "hex",
          "subme": "7",
          "trellis": "1",
          "ref": "4",
          "b-adapt": "1",
          "rc-lookahead": "40"
        }
      },
      onProgress: (progress) => {
        console.log('Detailed render progress:', {
          ...progress,
          currentFrame: progress.renderedFrames,
          totalFrames: actualDurationInFrames,
          percentComplete: ((progress.renderedFrames / actualDurationInFrames) * 100).toFixed(2) + '%'
        });
      },
    });

    cleanup = renderResult.cleanup;

    console.log('Render completed successfully');

    // Return success response
    res.json({
      success: true,
      videoUrl: `/rendered/${filename}.mp4`,
    });

  } catch (error) {
    console.error('Render error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    // Cleanup resources
    if (cleanup) {
      try {
        await cleanup();
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
  }
};












