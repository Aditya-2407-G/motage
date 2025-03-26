"use client"
import { useMedia } from "../../context/MediaContext"
import { useTimeline } from "../../context/TimelineContext"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Plus, ImageIcon, VideoIcon } from "lucide-react"

export default function MediaLibrary() {
  const { state: mediaState } = useMedia()
  const { dispatch: timelineDispatch } = useTimeline()

  const handleMediaClick = (media) => {
    timelineDispatch({
      type: "ADD_ITEM",
      payload: {
        id: `timeline-${Date.now()}`,
        mediaId: media.id,
        type: media.type.startsWith("image") ? "image" : "video",
        startTime: 0,
        duration: media.duration || 3000,
        url: media.url,
        inEffect: "fade",
        outEffect: "fade",
      },
    })
  }

  const hasImages = mediaState.images.length > 0
  const hasVideos = mediaState.videos.length > 0
  const hasNoMedia = !hasImages && !hasVideos

  return (
    <div>
      {hasNoMedia ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-gray-200">No media added yet</h3>
          <p className="text-gray-400 text-sm max-w-md">
            Upload images and videos using the upload panel to start creating your sequence
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-6">
            {hasImages && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-200 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-2 text-gray-400" />
                    Images
                  </h3>
                  <Badge variant="outline" className="bg-gray-700 text-gray-300 border-gray-600">
                    {mediaState.images.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {mediaState.images.map((image) => (
                    <div
                      key={image.id}
                      onClick={() => handleMediaClick(image)}
                      className="group cursor-pointer relative aspect-video bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-violet-500 transition-all duration-200"
                    >
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={image.name}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-6 pb-2 px-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                        <p className="text-white text-xs truncate">{image.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasVideos && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-200 flex items-center">
                    <VideoIcon className="w-4 h-4 mr-2 text-gray-400" />
                    Videos
                  </h3>
                  <Badge variant="outline" className="bg-gray-700 text-gray-300 border-gray-600">
                    {mediaState.videos.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {mediaState.videos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => handleMediaClick(video)}
                      className="group cursor-pointer relative aspect-video bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-violet-500 transition-all duration-200"
                    >
                      <video src={video.url} className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-6 pb-2 px-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                        <p className="text-white text-xs truncate">{video.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

