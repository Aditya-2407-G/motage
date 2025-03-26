import React from 'react';
import { useMedia } from '../../context/MediaContext';
import { useTimeline } from '../../context/TimelineContext';

export default function MediaLibrary() {
  const { state: mediaState } = useMedia();
  const { dispatch: timelineDispatch } = useTimeline();

  const handleMediaClick = (media) => {
    timelineDispatch({
      type: 'ADD_ITEM',
      payload: {
        id: `timeline-${Date.now()}`,
        mediaId: media.id,
        type: media.type.startsWith('image') ? 'image' : 'video',
        startTime: 0,
        duration: media.duration || 3000,
        url: media.url,
      }
    });
  };

  return (
    <div className="border rounded-lg bg-white p-4">
      <h2 className="text-lg font-semibold mb-4">Media Library</h2>
      
      <div className="grid grid-cols-4 gap-4">
        {mediaState.images.map(image => (
          <div
            key={image.id}
            onClick={() => handleMediaClick(image)}
            className="group cursor-pointer relative aspect-video bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500"
          >
            <img
              src={image.url}
              alt={image.name}
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
            <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
              {image.name}
            </p>
          </div>
        ))}
        
        {mediaState.videos.map(video => (
          <div
            key={video.id}
            onClick={() => handleMediaClick(video)}
            className="group cursor-pointer relative aspect-video bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500"
          >
            <video
              src={video.url}
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
            <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
              {video.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}