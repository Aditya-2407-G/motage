"use client"

import { useCallback, useEffect } from "react"
import { useTimeline } from "../../context/TimelineContext"
import { Button } from "@/components/ui/button"
import { FastForward, Pause, Play, Rewind } from "lucide-react"

export default function PlayerControls({ playerRef }) {
  const { state, dispatch } = useTimeline()
  const { isPlaying, audioControls, duration, currentTime } = state

  useEffect(() => {
    if (currentTime >= duration && isPlaying) {
      dispatch({ type: "SET_PLAYING", payload: false })
      if (playerRef.current) {
        playerRef.current.pause()
      }
      if (audioControls) {
        audioControls.pause()
      }
    }
  }, [currentTime, duration, isPlaying, dispatch, playerRef, audioControls])

  const handlePlayPause = useCallback(() => {
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
  }, [isPlaying, audioControls, dispatch, playerRef, currentTime, duration])

  const handleSeek = useCallback(
    (direction) => {
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
    },
    [audioControls, dispatch, playerRef],
  )

  return (
    <div className="flex items-center justify-center space-x-2">
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
        className="h-10 w-10 rounded-full bg-violet-600 hover:bg-violet-700"
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
  )
}

