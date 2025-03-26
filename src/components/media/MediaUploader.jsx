import React, { useCallback } from 'react';
import { useMedia } from '../../context/MediaContext';

export default function MediaUploader({ type = 'image' }) {
  const { dispatch } = useMedia();

  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    const mediaFiles = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
      duration: type === 'video' ? 0 : 3000, // Default duration for images: 3s
    }));

    if (type === 'image') {
      dispatch({ type: 'ADD_IMAGES', payload: mediaFiles });
    } else if (type === 'video') {
      // For videos, we need to get their duration
      mediaFiles.forEach(mediaFile => {
        const video = document.createElement('video');
        video.src = mediaFile.url;
        video.onloadedmetadata = () => {
          dispatch({
            type: 'ADD_VIDEOS',
            payload: [{
              ...mediaFile,
              duration: video.duration * 1000 // Convert to milliseconds
            }]
          });
        };
      });
    }
  }, [dispatch, type]);

  return (
    <div className="p-4 border rounded-lg bg-white">
      <label className="block mb-2 text-sm font-medium text-gray-700">
        Upload {type === 'image' ? 'Images' : 'Videos'}
      </label>
      <input
        type="file"
        accept={type === 'image' ? "image/*" : "video/*"}
        multiple
        onChange={handleFileUpload}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
    </div>
  );
}