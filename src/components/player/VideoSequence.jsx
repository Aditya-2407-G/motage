import { useCurrentFrame, useVideoConfig, Audio, AbsoluteFill } from "remotion";
import { MediaRenderer } from "./MediaRenderer";  // Changed to named import

export const VideoSequence = ({ items = [], audio = null, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  // Filter items that should be visible at the current time
  const visibleItems = items.filter((item) => {
    const startTime = item.startTime || 0;
    const endTime = startTime + item.duration;
    return currentTimeMs >= startTime && currentTimeMs < endTime;
  });

  console.log('VideoSequence render:', {
    frame,
    currentTimeMs,
    itemsCount: items?.length,
    visibleItemsCount: visibleItems.length,
    durationInFrames,
    hasAudio: !!audio
  });

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {visibleItems.map((item) => {
        console.log(`Rendering item:`, {
          id: item.id,
          startTime: item.startTime,
          duration: item.duration,
          type: item.type,
          currentTimeMs
        });
        
        return (
          <MediaRenderer
            key={item.id}
            item={item}
            currentTimeMs={currentTimeMs}
          />
        );
      })}
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


