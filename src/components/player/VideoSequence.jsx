import { useCurrentFrame, useVideoConfig, Audio, AbsoluteFill } from "remotion";
import { MediaRenderer } from "./MediaRenderer";
import { useCallback, useMemo } from "react";

export const VideoSequence = ({ items = [], audio = null, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  // Memoize visible items calculation
  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const startTime = item.startTime || 0;
      const endTime = startTime + item.duration;
      return currentTimeMs >= startTime && currentTimeMs < endTime;
    });
  }, [items, currentTimeMs]);

  // Remove console.logs in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('VideoSequence render:', {
      frame,
      currentTimeMs,
      itemsCount: items?.length,
      visibleItemsCount: visibleItems.length,
      durationInFrames,
      hasAudio: !!audio
    });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {visibleItems.map((item) => (
        <MediaRenderer
          key={item.id}
          item={item}
          currentTimeMs={currentTimeMs}
        />
      ))}
      {audio?.url && (
        <Audio
          src={audio.url}
          startFrom={0}
          endAt={durationInFrames}
          volume={1}
        />
      )}
    </AbsoluteFill>
  );
};
