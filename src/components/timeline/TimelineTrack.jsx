"use client"

import React, { useState, useRef, useEffect } from "react"
import { useTimeline } from "../../context/TimelineContext"
import { useTimelineSize } from "../../context/TimelinSizeProvider"
import interact from "interactjs"
import { Badge } from "@/components/ui/badge"

export default function TimelineTrack({ showRuler = true }) {
  const { state, dispatch } = useTimeline()
  const { items, beatMarkers = [], currentTime } = state
  const { timeToPixels, pixelsToTime } = useTimelineSize()
  const [selectedItem, setSelectedItem] = useState(null)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const trackRef = useRef(null)

  // Add keyboard shortcut for delete
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItem) {
        e.preventDefault()
        dispatch({ type: "DELETE_ITEM", payload: selectedItem.id })
        setSelectedItem(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedItem, dispatch])

  // Update the selected item in the timeline context
  useEffect(() => {
    dispatch({ type: "SET_SELECTED_ITEM", payload: selectedItem })
  }, [selectedItem, dispatch])

  // Add delete handler
  const handleDelete = (itemId) => {
    dispatch({ type: "DELETE_ITEM", payload: itemId })
    setSelectedItem(null)
  }

  useEffect(() => {
    if (!trackRef.current) return;

    // Initialize draggable
    interact('.timeline-item').draggable({
      inertia: false, // Remove inertia
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: 'parent',
          endOnly: true
        })
      ],
      listeners: {
        start(event) {
          const target = event.target;
          target.classList.add('dragging');
        },
        move(event) {
          const target = event.target;
          const itemId = target.getAttribute('data-id');
          const item = items.find((i) => i.id === itemId);

          if (!item) return;

          const currentX = parseFloat(target.getAttribute('data-x')) || 0;
          const newX = currentX + event.dx;
          
          target.style.transform = `translateX(${newX}px)`;
          target.setAttribute('data-x', newX);
        },
        end(event) {
          const target = event.target;
          const itemId = target.getAttribute('data-id');
          const item = items.find((i) => i.id === itemId);

          if (!item) return;

          const totalDx = parseFloat(target.getAttribute('data-x')) || 0;
          const newStartTime = Math.max(0, pixelsToTime(timeToPixels(item.startTime) + totalDx));

          // Update item position
          dispatch({
            type: 'UPDATE_ITEM',
            payload: {
              ...item,
              startTime: newStartTime
            }
          });

          // Clean up
          target.style.transform = '';
          target.setAttribute('data-x', 0);
          target.classList.remove('dragging');
        }
      }
    });

    // Initialize resizable
    interact('.timeline-item').resizable({
      edges: { left: true, right: true, bottom: false, top: false },
      restrictEdges: {
        outer: 'parent',
        endOnly: true
      },
      inertia: false, // Remove inertia
      modifiers: [
        interact.modifiers.restrictSize({
          min: { width: 50 }
        })
      ],
      listeners: {
        start(event) {
          event.target.classList.add('resizing');
        },
        move(event) {
          const target = event.target;
          const itemId = target.getAttribute('data-id');
          const item = items.find((i) => i.id === itemId);

          if (!item) return;

          let { x } = target.dataset;
          x = (parseFloat(x) || 0) + event.deltaRect.left;

          target.style.width = `${event.rect.width}px`;
          target.style.transform = `translateX(${x}px)`;
          Object.assign(target.dataset, { x });
        },
        end(event) {
          const target = event.target;
          const itemId = target.getAttribute('data-id');
          const item = items.find((i) => i.id === itemId);

          if (!item) return;

          const finalX = parseFloat(target.dataset.x) || 0;
          const finalWidth = event.rect.width;

          let newStartTime = item.startTime;
          let newDuration = item.duration;

          if (event.edges.left) {
            newStartTime = Math.max(0, item.startTime + pixelsToTime(finalX));
            newDuration = Math.max(100, pixelsToTime(finalWidth));
          } else if (event.edges.right) {
            newDuration = Math.max(100, pixelsToTime(finalWidth));
          }

          // Update item
          dispatch({
            type: 'UPDATE_ITEM',
            payload: {
              ...item,
              startTime: newStartTime,
              duration: newDuration
            }
          });

          // Clean up
          target.style.transform = '';
          target.style.width = '';
          target.setAttribute('data-x', 0);
          target.classList.remove('resizing');
        }
      }
    });

    return () => {
      interact('.timeline-item').unset();
    };
  }, [trackRef, items, dispatch, pixelsToTime, timeToPixels]);

  // Get effect badge color
  const getEffectBadgeColor = (effect) => {
    switch (effect) {
      case "fade":
        return "bg-blue-600 hover:bg-blue-700"
      case "slide-left":
        return "bg-green-600 hover:bg-green-700"
      case "slide-right":
        return "bg-green-600 hover:bg-green-700"
      case "zoom":
        return "bg-purple-600 hover:bg-purple-700"
      case "blur":
        return "bg-orange-600 hover:bg-orange-700"
      default:
        return "bg-gray-600 hover:bg-gray-700"
    }
  }

  return (
    <div ref={trackRef} className="relative h-full" onClick={() => setSelectedItem(null)}>
      {/* Time indicators */}
      {showRuler && (
        <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 border-b border-gray-700">
          {Array.from({ length: Math.ceil(state.duration / 1000) + 1 }).map((_, i) => (
            <React.Fragment key={i}>
              <div className="absolute text-xs text-gray-400" style={{ left: `${timeToPixels(i * 1000)}px` }}>
                {i}s
              </div>
              {/* Add minor tick marks every 100ms */}
              {i < Math.ceil(state.duration / 1000) &&
                Array.from({ length: 9 }).map((_, j) => (
                  <div
                    key={`${i}-${j}`}
                    className="absolute w-px h-2 bg-gray-700"
                    style={{
                      left: `${timeToPixels(i * 1000 + (j + 1) * 100)}px`,
                      bottom: 0,
                    }}
                  />
                ))}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Beat markers - Updated for more prominence */}
      {beatMarkers.map((marker, index) => (
        <div
          key={`beat-${index}`}
          className="beat-marker"
          style={{
            position: "absolute",
            left: `${timeToPixels(marker.time * 1000)}px`,
            top: showRuler ? "24px" : "0",
            bottom: 0,
            width: "1px",
            background: `linear-gradient(180deg, 
              rgba(139, 92, 246, 0.8) 0%, 
              rgba(139, 92, 246, 0.2) 100%)`,
            zIndex: 1,
          }}
        >
          {/* Beat marker dot */}
          <div
            className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full"
            style={{
              background: `radial-gradient(circle at center,
                rgba(139, 92, 246, 0.9) 0%,
                rgba(139, 92, 246, 0.4) 60%,
                transparent 100%)`,
              boxShadow: "0 0 4px rgba(139, 92, 246, 0.5)",
            }}
          />

          {/* Energy indicator */}
          <div
            className="absolute -left-0.5"
            style={{
              top: showRuler ? "24px" : "0",
              width: "2px",
              height: `${marker.energy * 40}px`,
              background: "rgba(139, 92, 246, 0.3)",
              borderRadius: "2px",
            }}
          />
        </div>
      ))}

      {/* Timeline items */}
      {items.map((item) => (
        <div
          key={item.id}
          data-id={item.id}
          className="timeline-item group"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedItem(item);
          }}
          style={{
            position: 'absolute',
            left: `${timeToPixels(item.startTime)}px`,
            top: showRuler ? '24px' : '0',
            width: `${timeToPixels(item.duration)}px`,
            height: '80px',
            backgroundColor: item.id === selectedItem?.id ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.05)',
            border: item.id === selectedItem?.id ? '2px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '4px',
            overflow: 'hidden',
            touchAction: 'none',
            cursor: 'move',
            zIndex: item.id === selectedItem?.id ? 10 : 2,
            userSelect: 'none'
          }}
        >
          {/* Add delete button */}
          {item.id === selectedItem?.id && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(item.id)
              }}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 z-20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}

          {/* Resize handles */}
          <div className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize bg-violet-800 opacity-50" />
          <div className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize bg-violet-800 opacity-50" />

          <div className="h-full w-full relative">
            {item.type === "image" && (
              <img
                src={item.url || "/placeholder.svg"}
                alt=""
                className="h-full w-full object-cover pointer-events-none"
              />
            )}
            {item.type === "video" && (
              <video
                src={item.url}
                className="h-full w-full object-cover pointer-events-none"
              />
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-black/90 py-1 px-2">
              <div className="text-white text-xs flex items-center justify-between">
                <span>{(item.duration / 1000).toFixed(1)}s</span>
                <div className="flex gap-1">
                  {item.inEffect && item.inEffect !== "none" && (
                    <Badge className={`text-[0.6rem] py-0 px-1.5 ${getEffectBadgeColor(item.inEffect)}`}>
                      {item.inEffect}
                    </Badge>
                  )}
                  {item.outEffect && item.outEffect !== "none" && (
                    <Badge className={`text-[0.6rem] py-0 px-1.5 ${getEffectBadgeColor(item.outEffect)}`}>
                      {item.outEffect}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Selection indicator */}
            {item.id === selectedItem?.id && (
              <div className="absolute inset-0 border-2 border-violet-500 pointer-events-none" />
            )}
          </div>
        </div>
      ))}

      {/* Current time seeker - Updated for better visibility */}
      <div
        className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-20"
        style={{
          left: `${timeToPixels(currentTime)}px`,
          height: "100%",
          background: "linear-gradient(180deg, #f43f5e 0%, rgba(244, 63, 94, 0.5) 100%)",
        }}
      >
        <div
          className="w-4 h-4 -ml-2 rounded-full"
          style={{
            background: "radial-gradient(circle at center, #f43f5e 30%, rgba(244, 63, 94, 0.5) 70%)",
            boxShadow: "0 0 6px rgba(244, 63, 94, 0.7)",
          }}
        />
      </div>
    </div>
  )
}