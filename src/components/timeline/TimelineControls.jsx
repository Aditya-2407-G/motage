"use client"
import { useTimeline } from "../../context/TimelineContext"
import { useTimelineZoom } from "../../context/TimelineZoomContext"
import { Button } from "@/components/ui/button"
import { Pause, Play, ZoomIn, ZoomOut, SkipBack, SkipForward, Scissors, Trash2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TimelineControls({ playerRef }) {
  const { state, dispatch } = useTimeline()
  const { zoom, zoomIn, zoomOut, zoomReset } = useTimelineZoom()
  const { isPlaying, wavesurfer, selectedItem } = state

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause()
        wavesurfer?.pause()
      } else {
        playerRef.current.play()
        wavesurfer?.play()
      }
      dispatch({ type: "TOGGLE_PLAY" })
    }
  }

  const handleSeek = (direction) => {
    if (playerRef.current) {
      const currentFrame = playerRef.current.getCurrentFrame()
      const seekAmount = direction === "forward" ? 30 : -30 // 1 second at 30fps
      const newFrame = Math.max(0, currentFrame + seekAmount)
      playerRef.current.seekTo(newFrame)

      const timeMs = (newFrame / 30) * 1000

      if (wavesurfer) {
        wavesurfer.seekTo(timeMs / 1000 / wavesurfer.getDuration())
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

      // Only split if playhead is within the selected item
      if (currentTime > selectedItem.startTime && currentTime < selectedItem.startTime + selectedItem.duration) {
        // Calculate durations for both parts
        const firstPartDuration = currentTime - selectedItem.startTime
        const secondPartDuration = selectedItem.duration - firstPartDuration

        // Update the original item to be the first part
        dispatch({
          type: "UPDATE_ITEM",
          payload: {
            ...selectedItem,
            duration: firstPartDuration,
          },
        })

        // Create a new item for the second part
        dispatch({
          type: "ADD_ITEM",
          payload: {
            id: `timeline-${Date.now()}`,
            mediaId: selectedItem.mediaId,
            type: selectedItem.type,
            startTime: currentTime,
            duration: secondPartDuration,
            url: selectedItem.url,
            inEffect: "none", // No transition for the split part
            outEffect: selectedItem.outEffect,
          },
        })
      }
    }
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-800">
      <div className="flex items-center gap-2">
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

        <div className="w-24">
          <Slider
            value={[zoom * 100]}
            min={25}
            max={200}
            step={25}
            onValueChange={(value) => {
              // Implement a custom zoom function that takes a percentage
              const newZoom = value[0] / 100
              if (newZoom !== zoom) {
                if (newZoom === 1) {
                  zoomReset()
                } else {
                  // This is a simplified approach - you'd need to implement this in your zoom context
                  if (newZoom > zoom) {
                    zoomIn()
                  } else {
                    zoomOut()
                  }
                }
              }
            }}
            className="[&>span]:bg-violet-600"
          />
        </div>

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

        <div className="text-xs text-gray-400 ml-1">{Math.round(zoom * 100)}%</div>
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSeek("backward")}
                className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-200 hover:bg-gray-700"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-gray-900 border-gray-700 text-gray-200">
              Previous Frame
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          variant="default"
          size="icon"
          onClick={handlePlayPause}
          className="h-10 w-10 rounded-full bg-violet-600 hover:bg-violet-700"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSeek("forward")}
                className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-200 hover:bg-gray-700"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-gray-900 border-gray-700 text-gray-200">
              Next Frame
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

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

            <Select
              value={selectedItem.inEffect || "fade"}
              onValueChange={(value) => {
                dispatch({
                  type: "UPDATE_ITEM",
                  payload: {
                    ...selectedItem,
                    inEffect: value,
                  },
                })
              }}
            >
              <SelectTrigger className="h-8 w-32 bg-gray-900 border-gray-700 text-gray-200 text-xs">
                <SelectValue placeholder="In Effect" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                <SelectItem value="none">No Effect</SelectItem>
                <SelectItem value="fade">Fade In</SelectItem>
                <SelectItem value="slide-left">Slide Left</SelectItem>
                <SelectItem value="slide-right">Slide Right</SelectItem>
                <SelectItem value="zoom">Zoom In</SelectItem>
                <SelectItem value="blur">Blur In</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedItem.outEffect || "fade"}
              onValueChange={(value) => {
                dispatch({
                  type: "UPDATE_ITEM",
                  payload: {
                    ...selectedItem,
                    outEffect: value,
                  },
                })
              }}
            >
              <SelectTrigger className="h-8 w-32 bg-gray-900 border-gray-700 text-gray-200 text-xs">
                <SelectValue placeholder="Out Effect" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                <SelectItem value="none">No Effect</SelectItem>
                <SelectItem value="fade">Fade Out</SelectItem>
                <SelectItem value="slide-left">Slide Left</SelectItem>
                <SelectItem value="slide-right">Slide Right</SelectItem>
                <SelectItem value="zoom">Zoom Out</SelectItem>
                <SelectItem value="blur">Blur Out</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>
    </div>
  )
}

