"use client"

import { useCallback } from "react"
import { useMedia } from "../../context/MediaContext"
import { Button } from "@/components/ui/button"
import { FileAudio } from "lucide-react"

export default function AudioUploader() {
  const { dispatch } = useMedia()

  const handleAudioUpload = useCallback(
    async (e) => {
      const file = e.target.files[0]
      if (!file) return

      // Create object URL
      const url = URL.createObjectURL(file)

      const audio = {
        id: `audio-${Date.now()}`,
        file,
        url,
        name: file.name,
      }

      const handleAudioLoad = async (audio) => {
        return new Promise((resolve, reject) => {
          const audioEl = new Audio()

          // Set up audio element
          audioEl.preload = "auto"
          audioEl.crossOrigin = "anonymous"

          audioEl.addEventListener(
            "loadedmetadata",
            () => {
              const durationMs = Math.floor(audioEl.duration * 1000)
              audio.duration = durationMs

              // Stop the audio element after getting metadata
              audioEl.pause()
              audioEl.currentTime = 0

              dispatch({ type: "SET_AUDIO", payload: audio })
              resolve(audio)
            },
            { once: true },
          )

          audioEl.addEventListener(
            "error",
            (error) => {
              URL.revokeObjectURL(audio.url)
              reject(new Error("Failed to load audio file"))
            },
            { once: true },
          )

          audioEl.src = audio.url
        })
      }

      try {
        await handleAudioLoad(audio)
      } catch (error) {
        console.error("Error loading audio:", error)
        URL.revokeObjectURL(audio.url)
      }
    },
    [dispatch],
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-200">Upload Audio Track</h3>
      </div>

      <div className="relative">
        <input
          type="file"
          accept="audio/*"
          onChange={handleAudioUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <Button
          variant="outline"
          className="w-full h-20 flex flex-col items-center justify-center gap-2 border-dashed bg-gray-900 border-gray-700 hover:bg-gray-800 text-gray-300"
        >
          <FileAudio className="h-5 w-5 text-gray-400" />
          <span className="text-xs text-gray-400">Drop audio file or click to browse</span>
        </Button>
      </div>
    </div>
  )
}

