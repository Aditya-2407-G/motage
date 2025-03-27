import path from 'path';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chromiumOptions = {
  chromiumOptions: {
    ignoreDefaultArgs: ['--disable-dev-shm-usage'],
    args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
  },
  timeoutInMilliseconds: 300000, // 5 minutes timeout
};

export const renderVideo = async (req, res) => {
  let cleanup = null;

  try {
    const { filename, items, audio, durationInFrames, fps = 30, duration } = req.body;
    
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
      items,
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

    // Render the video
    const renderResult = await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      fps,
      durationInFrames: actualDurationInFrames,
      inputProps,
      ...chromiumOptions,
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






