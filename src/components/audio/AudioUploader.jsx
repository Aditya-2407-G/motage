import React, { useCallback } from 'react';
import { useMedia } from '../../context/MediaContext';
export default function AudioUploader() {  const { dispatch } = useMedia();
  const handleAudioUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create object URL
    const url = URL.createObjectURL(file);

    const audio = {
      id: `audio-${Date.now()}`,
      file,
      url,
      name: file.name,
    };

    const handleAudioLoad = async (audio) => {
      return new Promise((resolve, reject) => {
        const audioEl = new Audio();
        
        // Set up audio element
        audioEl.preload = 'auto';
        audioEl.crossOrigin = 'anonymous';
        
        audioEl.addEventListener('loadedmetadata', () => {
          const durationMs = Math.floor(audioEl.duration * 1000);
          audio.duration = durationMs;
          
          // Stop the audio element after getting metadata
          audioEl.pause();
          audioEl.currentTime = 0;
          
          dispatch({ type: 'SET_AUDIO', payload: audio });
          resolve(audio);
        }, { once: true });

        audioEl.addEventListener('error', (error) => {
          URL.revokeObjectURL(audio.url);
          reject(new Error('Failed to load audio file'));
        }, { once: true });

        audioEl.src = audio.url;
      });
    };

    try {
      await handleAudioLoad(audio);
    } catch (error) {
      console.error('Error loading audio:', error);
      URL.revokeObjectURL(audio.url);
    }
  }, [dispatch]);
  return (    <div className="p-4 border rounded-lg bg-white">
      <label className="block mb-2 text-sm font-medium text-gray-700">        Upload Audio Track
      </label>      <input
        type="file"        accept="audio/*"
        onChange={handleAudioUpload}        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4          file:rounded-full file:border-0
          file:text-sm file:font-semibold          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"      />
    </div>
  );
}
























