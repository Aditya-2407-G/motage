import React, { createContext, useContext, useState, useCallback } from 'react';

const TimelineZoomContext = createContext(null);

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

export function TimelineZoomProvider({ children, initialZoom = 1 }) {
  const [zoom, setZoom] = useState(initialZoom);

  const handleZoomIn = useCallback(() => {
    setZoom(prevZoom => Math.min(prevZoom * 1.2, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prevZoom => Math.max(prevZoom / 1.2, MIN_ZOOM));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
  }, []);

  const handleZoomTo = useCallback((newZoom) => {
    setZoom(Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM));
  }, []);

  const value = {
    zoom,
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    zoomReset: handleZoomReset,
    zoomTo: handleZoomTo,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
  };

  return (
    <TimelineZoomContext.Provider value={value}>
      {children}
    </TimelineZoomContext.Provider>
  );
}

export function useTimelineZoom() {
  const context = useContext(TimelineZoomContext);
  if (!context) {
    throw new Error('useTimelineZoom must be used within a TimelineZoomProvider');
  }
  return context;
}