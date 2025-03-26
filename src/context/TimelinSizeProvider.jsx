import React, { createContext, useContext, useMemo } from 'react';
import { useTimeline } from './TimelineContext';
import { useTimelineZoom } from './TimelineZoomContext';

const TimelineSizeContext = createContext(null);

const PIXELS_PER_SECOND = 100; // Base pixels per second
const MINIMUM_TIMELINE_WIDTH = 800; // Minimum width in pixels

export function TimelineSizeProvider({ children, containerWidth }) {
  const { state: { duration } } = useTimeline();
  const { zoom } = useTimelineZoom();
  
  const value = useMemo(() => {
    // Calculate timeline dimensions
    const durationInSeconds = duration / 1000;
    const baseWidth = durationInSeconds * PIXELS_PER_SECOND;
    const scaledWidth = baseWidth * zoom;
    const finalWidth = Math.max(scaledWidth, MINIMUM_TIMELINE_WIDTH);

    // Calculate time-to-pixel conversion factors
    const pixelsPerMillisecond = finalWidth / duration;
    const millisecondsPerPixel = duration / finalWidth;

    return {
      containerWidth,
      timelineWidth: finalWidth,
      pixelsPerMillisecond,
      millisecondsPerPixel,
      pixelsPerSecond: PIXELS_PER_SECOND * zoom,
      
      // Utility functions
      timeToPixels: (timeMs) => timeMs * pixelsPerMillisecond,
      pixelsToTime: (pixels) => pixels * millisecondsPerPixel,
      
      // Viewport calculations
      viewportStart: 0,
      viewportEnd: containerWidth,
      isInViewport: (timeMs) => {
        const pixelPosition = timeMs * pixelsPerMillisecond;
        return pixelPosition >= 0 && pixelPosition <= containerWidth;
      },
    };
  }, [containerWidth, duration, zoom]);

  return (
    <TimelineSizeContext.Provider value={value}>
      {children}
    </TimelineSizeContext.Provider>
  );
}

export function useTimelineSize() {
  const context = useContext(TimelineSizeContext);
  if (!context) {
    throw new Error('useTimelineSize must be used within a TimelineSizeProvider');
  }
  return context;
}
