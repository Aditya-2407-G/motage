import { useCurrentFrame, useVideoConfig, Audio, AbsoluteFill } from "remotion";
import { MediaRenderer } from "./MediaRenderer";
import { useCallback, useMemo } from "react";

export const VideoSequence = ({ items = [], audio = null, durationInFrames }) => {
  const frame = useCurrentFrame();
  const fps = useVideoConfig().fps;
  const currentTimeMs = (frame / fps) * 1000;

  // Filter visible items based on current time
  const visibleItems = items.filter((item) => {
    const itemStart = item.startTime;
    const itemEnd = item.startTime + item.duration;
    return currentTimeMs >= itemStart && currentTimeMs <= itemEnd;
  });

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
          src={audio.originalUrl || audio.url}
          startFrom={Math.floor((audio.offset || 0) / 1000 * fps)}
          endAt={Math.floor(((audio.offset || 0) + audio.duration) / 1000 * fps)}
          volume={1}
        />
      )}
    </AbsoluteFill>
  );
};
