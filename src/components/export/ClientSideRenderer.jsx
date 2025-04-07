import React, { useRef, useEffect, useState } from 'react';

/**
 * ClientSideRenderer - Renders video client-side using Canvas and MediaRecorder
 * Designed to exactly match Remotion's rendering output
 *
 * @param {Object} props
 * @param {Array} props.items - Media items to render
 * @param {Object} props.audio - Audio track to include
 * @param {number} props.duration - Duration in milliseconds
 * @param {number} props.fps - Frames per second (default: 30)
 * @param {string} props.filename - Output filename
 * @param {Function} props.onProgress - Progress callback (0-100)
 * @param {Function} props.onComplete - Called when rendering is complete with video blob URL
 * @param {Function} props.onError - Error callback
 */
export default function ClientSideRenderer({
  items = [],
  audio = null,
  duration = 0,
  fps = 30,
  filename = 'my-montage',
  onProgress = () => {},
  onComplete = () => {},
  onError = () => {}
}) {
  const canvasRef = useRef(null);
  const [debug, setDebug] = useState('');

  // Start rendering when component mounts
  useEffect(() => {
    startRendering();

    return () => {
      // Clean up resources
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  // Remotion-compatible interpolate function
  const interpolate = (input, inputRange, outputRange, options = {}) => {
    const { extrapolateLeft = 'clamp', extrapolateRight = 'clamp' } = options;

    if (inputRange.length !== outputRange.length) {
      throw new Error('inputRange and outputRange must have the same length');
    }

    // Handle input outside of range
    if (input < inputRange[0]) {
      if (extrapolateLeft === 'clamp') {
        return outputRange[0];
      }
      // Identity extrapolation
      return input;
    }

    if (input > inputRange[inputRange.length - 1]) {
      if (extrapolateRight === 'clamp') {
        return outputRange[outputRange.length - 1];
      }
      // Identity extrapolation
      return input;
    }

    // Find the segment that contains the input
    for (let i = 0; i < inputRange.length - 1; i++) {
      if (input >= inputRange[i] && input <= inputRange[i + 1]) {
        const ratio = (input - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
        return outputRange[i] + ratio * (outputRange[i + 1] - outputRange[i]);
      }
    }

    // Fallback
    return outputRange[0];
  };

  // Get transition duration based on item's transitionDuration property (match Remotion)
  const getTransitionDuration = (item) => {
    return (item.transitionDuration || 500) / 1000; // Convert ms to seconds
  };

  // Start rendering process
  const startRendering = async () => {
    try {
      // Set up canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = 1920;
      canvas.height = 1080;

      // Calculate total frames
      const durationInSeconds = duration / 1000;
      const totalFrames = Math.ceil(durationInSeconds * fps);
      setDebug(`Total frames: ${totalFrames}, Duration: ${durationInSeconds}s`);

      // Set up media recorder with canvas stream
      const stream = canvas.captureStream(fps);

      // Set up audio if available
      let audioElement = null;
      if (audio?.url) {
        try {
          // Create audio element
          audioElement = new Audio();
          audioElement.src = audio.url;
          await new Promise((resolve) => {
            audioElement.onloadeddata = resolve;
            audioElement.load();
          });

          // Create audio context and connect to stream
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioCtx.createMediaElementSource(audioElement);
          const dest = audioCtx.createMediaStreamDestination();
          source.connect(dest);

          // Add audio tracks to video stream
          dest.stream.getAudioTracks().forEach(track => {
            stream.addTrack(track);
          });
        } catch (error) {
          console.error('Audio setup error:', error);
        }
      }

      // Find supported MIME type - try to use WebM with VP8 codec for best compatibility
      const mimeTypes = [
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
      ];

      let mimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      if (!mimeType) {
        throw new Error('No supported video format found');
      }

      console.log('Using MIME type:', mimeType);

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 3000000
      });

      // Collect video data
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      // Flag to prevent multiple completions
      let completed = false;

      // Handle recording completion
      mediaRecorder.onstop = () => {
        // Prevent multiple completions
        if (completed) return;
        completed = true;

        // Get the base MIME type (without codecs)
        const baseType = mimeType.split(';')[0];
        console.log('Creating blob with type:', baseType);

        // Create a blob with the correct MIME type
        const videoBlob = new Blob(chunks, { type: baseType });

        // Create a URL for the blob
        const videoUrl = URL.createObjectURL(videoBlob);

        // Pass the URL and MIME type to the completion handler
        onComplete(videoUrl, baseType);
      };

      // Start recording
      mediaRecorder.start(100);

      // Start audio if available
      if (audioElement) {
        audioElement.currentTime = (audio.offset || 0) / 1000;
        await audioElement.play().catch(err => console.error('Audio play error:', err));
      }

      // Preload all images to avoid flickering
      const imageCache = new Map();
      const preloadImages = async () => {
        console.log('Preloading images...');
        const imageItems = items.filter(item => item.type === 'image' && item.url);

        for (const item of imageItems) {
          try {
            if (!imageCache.has(item.url)) {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = item.url;
              });
              imageCache.set(item.url, img);
              console.log(`Preloaded image: ${item.url}`);
            }
          } catch (error) {
            console.error(`Failed to preload image: ${item.url}`, error);
          }
        }
        console.log(`Preloaded ${imageCache.size} images`);
      };

      // Preload images before starting rendering
      await preloadImages();

      // Render each frame
      let frameCount = 0;
      let lastFrameTime = performance.now();
      const frameDuration = 1000 / fps; // Duration of each frame in ms

      const renderNextFrame = async () => {
        const now = performance.now();
        const elapsed = now - lastFrameTime;

        if (frameCount >= totalFrames) {
          // Finished rendering all frames
          console.log('Rendering complete');

          // Wait a moment before stopping to ensure all frames are captured
          setTimeout(() => {
            mediaRecorder.stop();

            // Stop audio
            if (audioElement) {
              audioElement.pause();
            }
          }, 1000);

          return;
        }

        // Calculate current time
        const currentTimeMs = (frameCount / fps) * 1000;

        // Clear canvas
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw frame number for debugging (smaller and less intrusive)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '16px Arial';
        ctx.fillText(`Frame: ${frameCount}, Time: ${Math.round(currentTimeMs)}ms`, 10, 20);

        // Find visible items with transition information - exactly matching Remotion's VideoSequence.jsx
        const visibleItems = items.filter(item => {
          const itemStart = item.startTime || 0;
          const itemEnd = itemStart + (item.duration || 0);
          // Add a buffer to ensure we catch items that need transitions
          return currentTimeMs >= itemStart - 1000 && currentTimeMs <= itemEnd + 1000;
        }).map(item => {
          // Get transition settings
          const startTime = item.startTime || 0;
          const endTime = startTime + (item.duration || 0);
          const transitionDuration = getTransitionDuration(item);

          // Calculate progress for entrance and exit animations - exactly as in MediaRenderer.jsx
          const entranceProgress = Math.min(1, (currentTimeMs - startTime) / (transitionDuration * 1000));
          const exitProgress = Math.max(0, 1 - (endTime - currentTimeMs) / (transitionDuration * 1000));

          // Get effect types from the same properties used in MediaRenderer.jsx
          const inEffect = item.inEffect || "fade";
          const outEffect = item.outEffect || "fade";

          // Determine if item is in transition
          const isEntering = entranceProgress < 1;
          const isExiting = exitProgress > 0;

          // Return item with transition information
          return {
            ...item,
            entranceProgress,
            exitProgress,
            isEntering,
            isExiting,
            inEffect,
            outEffect,
            transitionDuration
          };
        });

        // Draw each visible item
        for (const item of visibleItems) {
          await drawItem(ctx, item, currentTimeMs, imageCache);
        }

        // Update progress
        frameCount++;
        const progress = Math.floor((frameCount / totalFrames) * 100);
        onProgress(progress);

        // Calculate how long to wait for next frame to maintain consistent FPS
        lastFrameTime = now;
        const renderTime = performance.now() - now;
        const delay = Math.max(0, frameDuration - renderTime);

        // Schedule next frame with precise timing
        setTimeout(renderNextFrame, delay);
      };

      // Start rendering frames
      renderNextFrame();

    } catch (error) {
      console.error('Rendering error:', error);
      onError(error);
    }
  };

  // Draw a single item on the canvas - matching Remotion's MediaRenderer.jsx
  const drawItem = async (ctx, item, currentTimeMs, imageCache = new Map()) => {
    try {
      // Extract item properties with defaults
      const { id, type, url, rotation = 0, opacity = 1 } = item;

      // Use canvas dimensions if width/height are missing or zero
      let x = item.x || 0;
      let y = item.y || 0;
      let width = item.width || 0;
      let height = item.height || 0;

      // If dimensions are missing, use defaults based on canvas size
      if (width <= 0 || height <= 0) {
        if (type === 'image' || type === 'video') {
          // Use 80% of canvas size for images/videos with missing dimensions
          const canvas = canvasRef.current;
          width = width <= 0 ? Math.round(canvas.width * 0.8) : width;
          height = height <= 0 ? Math.round(canvas.height * 0.8) : height;

          // Center the item if position is (0,0)
          if (x === 0 && y === 0) {
            x = Math.round((canvas.width - width) / 2);
            y = Math.round((canvas.height - height) / 2);
          }

          console.log(`Applied default dimensions: (${x}, ${y}), size: ${width}x${height}`);
        }
      }

      console.log(`Drawing item: ${id || 'unknown'}, type: ${type}, at position: (${x}, ${y}), size: ${width}x${height}`);

      // Skip if no URL for media items
      if ((type === 'image' || type === 'video') && !url) {
        console.warn(`Missing URL for ${type} item:`, item);
        return;
      }

      // Get transition information - using the same property names as in MediaRenderer.jsx
      const entranceProgress = item.entranceProgress || 1;
      const exitProgress = item.exitProgress || 0;
      const isEntering = item.isEntering || false;
      const isExiting = item.isExiting || false;
      const inEffect = item.inEffect || 'fade';
      const outEffect = item.outEffect || 'fade';

      // Initialize transition parameters
      let transitionOpacity = opacity;
      let transitionScale = 1;
      let transitionX = x;
      let transitionY = y;
      let transitionRotation = rotation;
      let transitionFilter = '';

      // Get animation style - exactly matching MediaRenderer.jsx
      const getAnimationStyle = () => {
        let style = {};

        // Handle entrance animations
        if (entranceProgress < 1) {
          switch (inEffect) {
            case "fade":
              style.opacity = interpolate(entranceProgress, [0, 1], [0, 1]);
              break;
            case "slide-left":
              style.transform = `translateX(${interpolate(entranceProgress, [0, 1], [100, 0])}%)`;
              break;
            case "slide-right":
              style.transform = `translateX(${interpolate(entranceProgress, [0, 1], [-100, 0])}%)`;
              break;
            case "zoom-in":
              style.transform = `scale(${interpolate(entranceProgress, [0, 1], [0.8, 1])})`;
              style.opacity = interpolate(entranceProgress, [0, 1], [0, 1]);
              break;
            case "zoom-out":
              style.transform = `scale(${interpolate(entranceProgress, [0, 1], [1.2, 1])})`;
              style.opacity = interpolate(entranceProgress, [0, 1], [0, 1]);
              break;
            case "blur":
              style.filter = `blur(${interpolate(entranceProgress, [0, 1], [10, 0])}px)`;
              style.opacity = interpolate(entranceProgress, [0, 1], [0, 1]);
              break;
          }
        }

        // Handle exit animations
        if (exitProgress > 0) {
          switch (outEffect) {
            case "fade":
              style.opacity = interpolate(exitProgress, [0, 1], [1, 0]);
              break;
            case "slide-left":
              style.transform = `translateX(${interpolate(exitProgress, [0, 1], [0, -100])}%)`;
              break;
            case "slide-right":
              style.transform = `translateX(${interpolate(exitProgress, [0, 1], [0, 100])}%)`;
              break;
            case "zoom-in":
              style.transform = `scale(${interpolate(exitProgress, [0, 1], [1, 1.2])})`;
              style.opacity = interpolate(exitProgress, [0, 1], [1, 0]);
              break;
            case "zoom-out":
              style.transform = `scale(${interpolate(exitProgress, [0, 1], [1, 0.8])})`;
              style.opacity = interpolate(exitProgress, [0, 1], [1, 0]);
              break;
            case "blur":
              style.filter = `blur(${interpolate(exitProgress, [0, 1], [0, 10])}px)`;
              style.opacity = interpolate(exitProgress, [0, 1], [1, 0]);
              break;
          }
        }

        return style;
      };

      // Get animation style
      const animationStyle = getAnimationStyle();

      // Apply style to canvas transformations
      if (animationStyle.opacity !== undefined) {
        transitionOpacity = animationStyle.opacity;
      }

      // Apply transform styles
      if (animationStyle.transform) {
        // Handle scale transform
        const scaleMatch = animationStyle.transform.match(/scale\(([\d.]+)\)/);
        if (scaleMatch && scaleMatch[1]) {
          transitionScale = parseFloat(scaleMatch[1]);
        }

        // Handle translateX transform
        const translateXMatch = animationStyle.transform.match(/translateX\(([\d.-]+)%\)/);
        if (translateXMatch && translateXMatch[1]) {
          const translateXPercent = parseFloat(translateXMatch[1]);
          transitionX = x + (width * translateXPercent / 100);
        }
      }

      // Apply filter styles
      if (animationStyle.filter) {
        transitionFilter = animationStyle.filter;
      }

      // Apply transformations
      ctx.save();
      ctx.globalAlpha = transitionOpacity;

      // Apply all transformations
      // First, move to the item's position
      ctx.translate(transitionX, transitionY);

      // For scale and rotation, we need to work from the center
      const centerX = width / 2;
      const centerY = height / 2;

      // Move to center, apply scale and rotation, then move back
      ctx.translate(centerX, centerY);
      ctx.scale(transitionScale, transitionScale);
      ctx.rotate((transitionRotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);

      // Apply blur filter if needed
      if (transitionFilter && transitionFilter.includes('blur')) {
        const blurMatch = transitionFilter.match(/blur\(([\d.]+)px\)/);
        if (blurMatch && blurMatch[1]) {
          const blurAmount = parseFloat(blurMatch[1]);
          if (blurAmount > 0) {
            try {
              ctx.filter = transitionFilter;
            } catch (e) {
              console.warn('Filter not supported in this browser:', e);
            }
          }
        }
      }

      // Draw based on item type
      if (type === 'image') {
        try {
          // Use cached image if available
          let img;
          if (imageCache.has(url)) {
            img = imageCache.get(url);
          } else {
            // Load image if not in cache
            console.log(`Loading image from URL: ${url}`);
            img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
              img.onload = () => {
                console.log(`Image loaded successfully: ${url}, natural size: ${img.naturalWidth}x${img.naturalHeight}`);
                resolve();
              };
              img.onerror = (e) => {
                console.error(`Failed to load image: ${url}`, e);
                reject(new Error(`Failed to load image: ${url}`));
              };
              img.src = url;
            });

            // Add to cache
            imageCache.set(url, img);
          }


          ctx.drawImage(img, 0, 0, width, height);
        } catch (error) {
          console.error('Error rendering image:', error);

          // Draw error placeholder
          ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = 'white';
          ctx.font = '16px Arial';
          ctx.fillText('Image Error', 10, height / 2);
          ctx.fillText(url.substring(0, 30) + '...', 10, height / 2 + 20);
        }
      }
      else if (type === 'video') {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;

        await new Promise((resolve) => {
          video.onloadeddata = resolve;
          video.src = url;
          video.load();
        });

        // Calculate video position
        const videoStartTime = item.startTime || 0;
        const videoOffset = currentTimeMs - videoStartTime;
        const videoTime = (item.trimStart || 0) + videoOffset;

        // Set video time and draw frame
        video.currentTime = videoTime / 1000;

        ctx.drawImage(video, 0, 0, width, height);
      }
      else if (type === 'text') {
        const text = item.text || '';
        const fontSize = item.fontSize || 24;
        const fontFamily = item.fontFamily || 'Arial';
        const color = item.color || 'white';

        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';

        ctx.fillText(text, 0, 0);
      }

      // Only draw minimal debug info if needed
      if (transitionOpacity > 0.1 && false) { // Disabled for production
        // Draw a border around the item for debugging - color based on transition state
        if (isEntering) {
          ctx.strokeStyle = 'rgba(0, 255, 0, ' + entranceProgress + ')';
        } else if (isExiting) {
          ctx.strokeStyle = 'rgba(255, 0, 0, ' + (1 - exitProgress) + ')';
        } else {
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        }

        // Draw border at the original position (not the transformed position)
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformations
        ctx.lineWidth = 1;
        ctx.strokeRect(transitionX, transitionY, width, height);
        ctx.restore();

        // Draw item ID and transition info for debugging
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformations
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px Arial';

        let statusText = '';
        if (isEntering) {
          statusText = `In: ${inEffect} (${Math.round(entranceProgress * 100)}%)`;
        } else if (isExiting) {
          statusText = `Out: ${outEffect} (${Math.round(exitProgress * 100)}%)`;
        } else {
          statusText = 'Visible';
        }

        ctx.fillText(`ID: ${id || 'unknown'}, ${statusText}`, transitionX, transitionY - 2);
        ctx.restore();
      }

      // Restore context
      ctx.restore();
    } catch (error) {
      console.error('Error drawing item:', error);
      // Draw error indicator - use 0,0 since we've already translated the context
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = 'white';
      ctx.fillText(`Error: ${error.message}`, 10, 50);
      // Continue with other items if one fails
    }
  };



  return (
    <div style={{ display: 'none' }}>
      <canvas ref={canvasRef} width="1920" height="1080" />
      <div>{debug}</div>
    </div>
  );
}
