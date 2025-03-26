import React, { useEffect, useCallback } from 'react';
import { useTimeline } from '../../context/TimelineContext';
import { useTimelineSize } from '../../context/TimelinSizeProvider';
import TimelineTrack from './TimelineTrack';
import TimelineControls from './TimelineControls';

export default function Timeline({ playerRef }) {
  const { state, dispatch } = useTimeline();
  const { currentTime, duration, isPlaying } = state;
  const { timelineWidth, containerWidth, timeToPixels, pixelsToTime } = useTimelineSize();
  
  const updateTime = useCallback(() => {
    if (playerRef.current && isPlaying) {
      const frame = playerRef.current.getCurrentFrame();
      const timeMs = (frame / 30) * 1000;
      
      if (Math.abs(timeMs - currentTime) > 1) {
        dispatch({ type: 'SET_CURRENT_TIME', payload: timeMs });
      }
    }
  }, [playerRef, isPlaying, currentTime, dispatch]);

  useEffect(() => {
    let frameId;
    
    if (isPlaying) {
      const animate = () => {
        updateTime();
        frameId = requestAnimationFrame(animate);
      };
      
      frameId = requestAnimationFrame(animate);
    }

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isPlaying, updateTime]);

  const handleTimelineClick = (e) => {
    const scrollContainer = e.currentTarget;
    const bounds = scrollContainer.getBoundingClientRect();
    const scrollLeft = scrollContainer.scrollLeft;
    const clickX = e.clientX - bounds.left + scrollLeft;
    const clickedTime = pixelsToTime(clickX);
    
    dispatch({ type: 'SET_CURRENT_TIME', payload: clickedTime });
    
    if (playerRef.current) {
      const frame = Math.floor((clickedTime / 1000) * 30);
      playerRef.current.seekTo(frame);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow">
      <div className="p-2 border-b flex items-center justify-between">
        <h2 className="text-sm font-semibold">Timeline</h2>
        <TimelineControls playerRef={playerRef} />
      </div>
      
      <div 
        className="relative h-[120px] overflow-x-auto bg-gray-50"
        onClick={handleTimelineClick}
        style={{
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
        <div style={{ 
          position: 'relative',
          width: `${timelineWidth}px`,
          height: '100%',
          padding: '20px 0',
        }}>
          <TimelineTrack />
          
          {/* Current time indicator */}
          <div
            style={{
              position: 'absolute',
              left: `${timeToPixels(currentTime)}px`,
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: 'red',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}
