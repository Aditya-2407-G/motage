import React from 'react';
import { useCurrentFrame, useVideoConfig, Audio } from 'remotion';
import { useTimeline } from '../../context/TimelineContext';
import MediaRenderer from './MediaRenderer';

export default function VideoSequence() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { state: { items, audio } } = useTimeline();
  
  const currentTimeMs = (frame / fps) * 1000;

  // Find the current item based on frame timing
  const currentItem = items.find(item => 
    currentTimeMs >= item.startTime && 
    currentTimeMs < (item.startTime + item.duration)
  );

  return (
    <>
      {audio?.url && <Audio src={audio.url} />}
      {currentItem && <MediaRenderer item={currentItem} />}
    </>
  );
}
