import React, { useCallback } from 'react';
import { useTimeline } from '../../context/TimelineContext';

export default function PlayerControls({ playerRef }) {
  const { state, dispatch } = useTimeline();
  const { isPlaying, audioControls } = state;

  const handlePlayPause = useCallback(() => {
    const newPlayState = !isPlaying;
    
    if (playerRef.current) {
      if (newPlayState) {
        playerRef.current.play();
        audioControls?.play();
      } else {
        playerRef.current.pause();
        audioControls?.pause();
      }
    }

    dispatch({ type: 'SET_PLAYING', payload: newPlayState });
  }, [isPlaying, audioControls, dispatch, playerRef]);

  const handleSeek = useCallback((timeMs) => {
    if (playerRef.current) {
      const frame = Math.floor((timeMs / 1000) * 30);
      playerRef.current.seekTo(frame);
    }

    if (audioControls) {
      audioControls.seek(timeMs / 1000);
    }

    dispatch({ type: 'SET_CURRENT_TIME', payload: timeMs });
  }, [audioControls, dispatch, playerRef]);

  return (
    <div className="flex items-center justify-center space-x-4 mt-4">
      <button
        onClick={() => handleSeek('backward')}
        className="p-2 rounded-full hover:bg-gray-200"
      >
        ⏪
      </button>
      <button
        onClick={handlePlayPause}
        className="p-2 rounded-full hover:bg-gray-200"
      >
        {isPlaying ? '⏸' : '▶️'}
      </button>
      <button
        onClick={() => handleSeek('forward')}
        className="p-2 rounded-full hover:bg-gray-200"
      >
        ⏩
      </button>
    </div>
  );
}
