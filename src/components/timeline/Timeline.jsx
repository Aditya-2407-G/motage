"use client"

import { useEffect, useCallback, useState } from "react"
import { useTimeline } from "../../context/TimelineContext"
import { useTimelineSize } from "../../context/TimelinSizeProvider"
import TimelineTrack from "./TimelineTrack"
import TimelineControls from "./TimelineControls"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function Timeline({ playerRef }) {
  const { state, dispatch } = useTimeline()
  const { currentTime, duration, isPlaying } = state
  const { timelineWidth, containerWidth, timeToPixels, pixelsToTime } = useTimelineSize()
  const [showRuler, setShowRuler] = useState(true)

  const updateTime = useCallback(() => {
    if (playerRef.current && isPlaying) {
      const frame = playerRef.current.getCurrentFrame()
      const timeMs = (frame / 30) * 1000

      if (Math.abs(timeMs - currentTime) > 1) {
        dispatch({ type: "SET_CURRENT_TIME", payload: timeMs })
      }
    }
  }, [playerRef, isPlaying, currentTime, dispatch])

  useEffect(() => {
    let frameId

    if (isPlaying) {
      const animate = () => {
        updateTime()
        frameId = requestAnimationFrame(animate)
      }

      frameId = requestAnimationFrame(animate)
    }

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [isPlaying, updateTime])

  // Add this effect to handle end of playback
  useEffect(() => {
    if (currentTime >= duration && isPlaying) {
      dispatch({ type: "SET_PLAYING", payload: false })
      if (playerRef.current) {
        playerRef.current.pause()
      }
      if (state.audioControls) {
        state.audioControls.pause()
      }
    }
  }, [currentTime, duration, isPlaying, dispatch, playerRef, state.audioControls])

  const handleTimelineClick = (e) => {
    const scrollContainer = e.currentTarget
    const bounds = scrollContainer.getBoundingClientRect()
    const scrollLeft = scrollContainer.scrollLeft
    const clickX = e.clientX - bounds.left + scrollLeft
    const clickedTime = pixelsToTime(clickX)

    dispatch({ type: "SET_CURRENT_TIME", payload: clickedTime })

    if (playerRef.current) {
      const frame = Math.floor((clickedTime / 1000) * 30)
      playerRef.current.seekTo(frame)
    }
  }

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <Card className="border-2 border-gray-700 bg-gray-800">
      <CardHeader className="pb-3 border-b border-gray-700 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-200">
          <Clock className="w-4 h-4" />
          Timeline
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                  onClick={() => setShowRuler(!showRuler)}
                >
                  {showRuler ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-gray-900 border-gray-700 text-gray-200">
                {showRuler ? "Hide ruler" : "Show ruler"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          className="relative h-[180px] overflow-x-auto bg-gray-900 border-b border-gray-700"
          onClick={handleTimelineClick}
          style={{
            width: "100%",
            overflowX: "auto",
            overflowY: "hidden",
          }}
        >
          <div
            style={{
              position: "relative",
              width: `${timelineWidth}px`,
              height: "100%",
              padding: showRuler ? "20px 0" : "0",
            }}
          >
            <TimelineTrack showRuler={showRuler} />

            {/* Current time indicator */}
            <div
              style={{
                position: "absolute",
                left: `${timeToPixels(currentTime)}px`,
                top: 0,
                bottom: 0,
                width: "2px",
                backgroundColor: "#f43f5e",
                pointerEvents: "none",
                zIndex: 30,
              }}
            />

            {/* Playhead */}
            <div
              style={{
                position: "absolute",
                left: `${timeToPixels(currentTime) - 8}px`,
                top: 0,
                width: "16px",
                height: "16px",
                backgroundColor: "#f43f5e",
                borderRadius: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                zIndex: 40,
                boxShadow: "0 0 0 2px rgba(244, 63, 94, 0.3), 0 0 0 4px rgba(244, 63, 94, 0.2)",
              }}
            />
          </div>
        </div>

        <TimelineControls playerRef={playerRef} />
      </CardContent>
    </Card>
  )
}
