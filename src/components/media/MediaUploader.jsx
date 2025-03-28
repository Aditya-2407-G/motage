"use client"

import { useCallback } from "react"
import { useMedia } from "../../context/MediaContext"
import { Button } from "@/components/ui/button"
import { ImagePlus, Video } from 'lucide-react'

export default function MediaUploader({ type = "image" }) {
  const { dispatch } = useMedia()

  const handleFileUpload = useCallback(
    (e) => {
      const files = Array.from(e.target.files)
      const mediaFiles = files.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        duration: type === "video" ? 0 : 3000, // Default duration for images: 3s
      }))

      if (type === "image") {
        dispatch({ type: "ADD_IMAGES", payload: mediaFiles })
      } else if (type === "video") {
        // For videos, we need to get their duration
        mediaFiles.forEach((mediaFile) => {
          const video = document.createElement("video")
          video.src = mediaFile.url
          video.onloadedmetadata = () => {
            dispatch({
              type: "ADD_VIDEOS",
              payload: [
                {
                  ...mediaFile,
                  duration: video.duration * 1000, // Convert to milliseconds
                },
              ],
            })
          }
        })
      }
    },
    [dispatch, type],
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-800 dark:text-gray-200">
          {type === "image" ? "Upload Images" : "Upload Videos"}
        </h3>
      </div>

      <div className="relative">
        <input
          type="file"
          accept={type === "image" ? "image/*" : "video/*"}
          multiple
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <Button
          variant="outline"
          className="w-full h-20 flex flex-col items-center justify-center gap-2 border-dashed 
                   border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 
                   dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800 dark:hover:border-gray-600 
                   text-slate-600 dark:text-gray-300"
        >
          {type === "image" ? (
            <ImagePlus className="h-5 w-5 text-slate-500 dark:text-gray-400" />
          ) : (
            <Video className="h-5 w-5 text-slate-500 dark:text-gray-400" />
          )}
          <span className="text-xs text-slate-500 dark:text-gray-400">
            {type === "image" ? "Drop images or click to browse" : "Drop videos or click to browse"}
          </span>
        </Button>
      </div>
    </div>
  )
}
