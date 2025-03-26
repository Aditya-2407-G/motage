
import React, { useState, useRef, useEffect } from 'react';
import { useTimeline } from '../../context/TimelineContext';
import { useTimelineSize } from '../../context/TimelinSizeProvider';
import interact from 'interactjs';

export default function TimelineTrack() {
  const { state, dispatch } = useTimeline();
  const { items, beatMarkers = [], currentTime } = state;
  const { timeToPixels, pixelsToTime } = useTimelineSize();
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    // Draggable
    interact('.timeline-item').draggable({
      inertia: false,
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: 'parent',
          endOnly: true
        })
      ],
      listeners: {
        move(event) {
          const target = event.target;
          const itemId = target.getAttribute('data-id');
          const item = items.find(i => i.id === itemId);
          
          if (!item) return;
          
          const newStartTime = pixelsToTime(timeToPixels(item.startTime) + event.dx);
          
          dispatch({
            type: 'UPDATE_ITEM',
            payload: {
              ...item,
              startTime: Math.max(0, newStartTime)
            }
          });
        }
      }
    });

    // Resizable
    interact('.timeline-item').resizable({
      edges: { left: true, right: true, bottom: false, top: false },
      restrictEdges: {
        outer: 'parent',
        endOnly: true,
      },
      listeners: {
        move(event) {
          const target = event.target;
          const itemId = target.getAttribute('data-id');
          const item = items.find(i => i.id === itemId);
          
          if (!item) return;

          let newStartTime = item.startTime;
          let newDuration = item.duration;

          if (event.edges.left) {
            const deltaTime = pixelsToTime(event.deltaRect.left);
            newStartTime = Math.max(0, item.startTime + deltaTime);
            newDuration = Math.max(100, item.duration - deltaTime);
          } else if (event.edges.right) {
            newDuration = Math.max(100, pixelsToTime(event.rect.width));
          }

          dispatch({
            type: 'UPDATE_ITEM',
            payload: {
              ...item,
              startTime: newStartTime,
              duration: newDuration
            }
          });
        }
      }
    });
  }, [items, dispatch, pixelsToTime, timeToPixels]);

  return (
    <div className="relative h-full" onClick={() => setSelectedItem(null)}>
      {/* Time indicators */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-gray-100 border-b">
        {Array.from({ length: Math.ceil(state.duration / 1000) }).map((_, i) => (
          <div
            key={i}
            className="absolute text-xs text-gray-500"
            style={{ left: `${timeToPixels(i * 1000)}px` }}
          >
            {i}s
          </div>
        ))}
      </div>

      {/* Beat markers - Updated for more prominence */}
      {beatMarkers.map((marker, index) => (
        <div
          key={`beat-${index}`}
          className="beat-marker"
          style={{
            position: 'absolute',
            left: `${timeToPixels(marker.time * 1000)}px`,
            top: '24px',
            bottom: 0,
            width: '2px',
            background: `linear-gradient(180deg, 
              rgba(59, 130, 246, 0.8) 0%, 
              rgba(59, 130, 246, 0.2) 100%)`,
            zIndex: 1,
          }}
        >
          {/* Beat marker dot */}
          <div 
            className="absolute -top-1 -left-1.5 w-4 h-4 rounded-full"
            style={{
              background: `radial-gradient(circle at center,
                rgba(59, 130, 246, 0.9) 0%,
                rgba(59, 130, 246, 0.4) 60%,
                transparent 100%)`,
              boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)',
            }}
          />
          
          {/* Energy indicator */}
          <div 
            className="absolute -left-0.5"
            style={{
              top: '24px',
              width: '3px',
              height: `${marker.energy * 40}px`,
              background: 'rgba(59, 130, 246, 0.3)',
              borderRadius: '2px',
            }}
          />
        </div>
      ))}

      {/* Timeline items */}
      {items.map((item) => (
        <div
          key={item.id}
          data-id={item.id}
          className="timeline-item"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedItem(item);
          }}
          style={{
            position: 'absolute',
            left: `${timeToPixels(item.startTime)}px`,
            top: '24px',
            width: `${timeToPixels(item.duration)}px`,
            height: '80px',
            backgroundColor: item.id === selectedItem?.id 
              ? 'rgba(59, 130, 246, 0.2)' 
              : 'rgba(59, 130, 246, 0.1)',
            border: item.id === selectedItem?.id 
              ? '2px solid rgba(59, 130, 246, 0.5)' 
              : '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '4px',
            overflow: 'hidden',
            touchAction: 'none',
            cursor: 'move',
            zIndex: 2,
          }}
        >
          {/* Resize handles */}
          <div className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize hover:bg-blue-200 opacity-50" />
          <div className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize hover:bg-blue-200 opacity-50" />
          
          <div className="h-full w-full relative">
            {item.type === 'image' && (
              <img
                src={item.url}
                alt=""
                className="h-full w-full object-cover pointer-events-none"
                style={{ minWidth: '50px' }}
              />
            )}
            {item.type === 'video' && (
              <video
                src={item.url}
                className="h-full w-full object-cover pointer-events-none"
                style={{ minWidth: '50px' }}
              />
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5">
              {(item.duration / 1000).toFixed(2)}s
            </div>
          </div>
        </div>
      ))}

      {/* Current time seeker - Updated for better visibility */}
      <div
        className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-20"
        style={{
          left: `${timeToPixels(currentTime)}px`,
          height: '100%',
          background: 'linear-gradient(180deg, #EF4444 0%, rgba(239, 68, 68, 0.5) 100%)',
        }}
      >
        <div 
          className="w-4 h-4 -ml-2 rounded-full"
          style={{
            background: 'radial-gradient(circle at center, #EF4444 30%, rgba(239, 68, 68, 0.5) 70%)',
            boxShadow: '0 0 6px rgba(239, 68, 68, 0.7)',
          }}
        />
      </div>
    </div>
  );
}
