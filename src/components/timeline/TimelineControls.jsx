"use client"
import { useTimeline } from "../../context/TimelineContext"
import { useTimelineZoom } from "../../context/TimelineZoomContext"
import { Button } from "@/components/ui/button"
import { Pause, Play, ZoomIn, ZoomOut, Scissors, Trash2, Rewind, FastForward } from 'lucide-react'
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
    <div className="flex justify-between items-center p-2 border-t border-slate-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      {/* Left section with playback controls */}
      <div className="flex items-center">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSeek("backward")}
            className="h-9 w-9 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
          >
            <Rewind className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={handlePlayPause}
            className="h-10 w-10 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 dark:from-violet-500 dark:to-indigo-500 dark:hover:from-violet-600 dark:hover:to-indigo-600 text-white border-0 mx-2"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSeek("forward")}
            className="h-9 w-9 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
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
                    className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Scissors className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-800 dark:text-gray-200">
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
                    className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-800 dark:text-gray-200">
                  Delete Selected
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}

        {/* Zoom controls */}
        <div className="flex items-center gap-1 ml-4 border-l border-slate-200 dark:border-gray-700 pl-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={zoomOut}
                  className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-800 dark:text-gray-200">
                Zoom Out
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            size="sm"
            onClick={zoomReset}
            className="px-2 h-8 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
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
                  className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-800 dark:text-gray-200">
                Zoom In
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
