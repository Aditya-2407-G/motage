import React from 'react';
import { useTimeline } from '../../context/TimelineContext';
import { useTimelineZoom } from '../../context/TimelineZoomContext';

export default function TimelineControls({ playerRef }) {
  const { state, dispatch } = useTimeline();
  const { zoom, zoomIn, zoomOut, zoomReset } = useTimelineZoom();
  const { isPlaying, wavesurfer } = state;

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
        wavesurfer?.pause();
      } else {
        playerRef.current.play();
        wavesurfer?.play();
      }
      dispatch({ type: 'TOGGLE_PLAY' });
    }
  };

  return (
    <div className="flex items-center justify-center space-x-4 p-4 border-t">
      <button
        onClick={zoomOut}
        className="p-2 rounded-full hover:bg-gray-100 flex items-center space-x-1 text-gray-700"
        title="Zoom Out"
      >
        <span>🔍</span>
        <span>-</span>
      </button>

      <button
        onClick={handlePlayPause}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        {isPlaying ? '⏸' : '▶️'}
      </button>

      <button
        onClick={zoomIn}
        className="p-2 rounded-full hover:bg-gray-100 flex items-center space-x-1 text-gray-700"
        title="Zoom In"
      >
        <span>🔍</span>
        <span>+</span>
      </button>

      {zoom !== 1 && (
        <button
          onClick={zoomReset}
          className="p-2 rounded-full hover:bg-gray-100 text-xs text-gray-600"
          title="Reset Zoom"
        >
          Reset
        </button>
      )}

      <div className="text-xs text-gray-500">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
