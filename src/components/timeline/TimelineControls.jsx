"use client"
import { useTimeline } from "../../context/TimelineContext"
import { useTimelineZoom } from "../../context/TimelineZoomContext"
import { Button } from "@/components/ui/button"
import { Pause, Play, ZoomIn, ZoomOut, Scissors, Trash2, Rewind, FastForward } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function TimelineControls({ playerRef }) {
  const { state, dispatch } = useTimeline()
  const { zoom, zoomIn, zoomOut, zoomReset } = useTimelineZoom()
  const { selectedItem, isPlaying, audioControls, duration, currentTime } = state

  const handlePlayPause = () => {
    const newPlayState = !isPlaying

    if (playerRef.current) {
      if (newPlayState) {
        if (currentTime >= duration) {
          playerRef.current.seekTo(0)
          if (audioControls) {
            audioControls.seek(0)
          }
          dispatch({ type: "SET_CURRENT_TIME", payload: 0 })
        }
        playerRef.current.play()
        audioControls?.play()
      } else {
        playerRef.current.pause()
        audioControls?.pause()
      }
    }

    dispatch({ type: "SET_PLAYING", payload: newPlayState })
  }

  const handleSeek = (direction) => {
    if (playerRef.current) {
      const currentFrame = playerRef.current.getCurrentFrame()
      const seekAmount = direction === "forward" ? 30 : -30 // Seek 1 second (at 30fps)
      const newFrame = Math.max(0, currentFrame + seekAmount)
      playerRef.current.seekTo(newFrame)

      const timeMs = (newFrame / 30) * 1000

      if (audioControls) {
        audioControls.seek(timeMs / 1000)
      }

      dispatch({ type: "SET_CURRENT_TIME", payload: timeMs })
    }
  }

  const handleDeleteSelected = () => {
    if (selectedItem) {
      dispatch({ type: "DELETE_ITEM", payload: selectedItem.id })
    }
  }

  const handleSplitAtPlayhead = () => {
    if (selectedItem && playerRef.current) {
      const currentTime = (playerRef.current.getCurrentFrame() / 30) * 1000

      if (currentTime > selectedItem.startTime && currentTime < selectedItem.startTime + selectedItem.duration) {
        const firstPartDuration = currentTime - selectedItem.startTime
        const secondPartDuration = selectedItem.duration - firstPartDuration

        dispatch({
          type: "UPDATE_ITEM",
          payload: {
            ...selectedItem,
            duration: firstPartDuration,
          },
        })

        dispatch({
          type: "ADD_ITEM",
          payload: {
            id: `timeline-${Date.now()}`,
            mediaId: selectedItem.mediaId,
            type: selectedItem.type,
            startTime: currentTime,
            duration: secondPartDuration,
            url: selectedItem.url,
            inEffect: "none",
            outEffect: selectedItem.outEffect,
          },
        })
      }
    }
  }

  return (
    <div className="flex justify-between items-center p-2 border-t border-gray-800">
      {/* Left section with playback controls */}
      <div className="flex items-center">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSeek("backward")}
            className="h-9 w-9 rounded-full text-gray-400 hover:text-gray-200 hover:bg-gray-700"
          >
            <Rewind className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={handlePlayPause}
            className="h-10 w-10 rounded-full bg-violet-600 hover:bg-violet-700 mx-2"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSeek("forward")}
            className="h-9 w-9 rounded-full text-gray-400 hover:text-gray-200 hover:bg-gray-700"
          >
            <FastForward className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right section with editing controls and zoom */}
      <div className="flex items-center gap-2">
        {selectedItem && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSplitAtPlayhead}
                    className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                  >
                    <Scissors className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-gray-900 border-gray-700 text-gray-200">
                  Split at Playhead
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteSelected}
                    className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-gray-900 border-gray-700 text-gray-200">
                  Delete Selected
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}

        {/* Zoom controls */}
        <div className="flex items-center gap-1 ml-4 border-l border-gray-700 pl-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={zoomOut}
                  className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-gray-900 border-gray-700 text-gray-200">
                Zoom Out
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            size="sm"
            onClick={zoomReset}
            className="px-2 h-8 text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-700"
          >
            {Math.round(zoom * 100)}%
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={zoomIn}
                  className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-gray-900 border-gray-700 text-gray-200">
                Zoom In
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}

