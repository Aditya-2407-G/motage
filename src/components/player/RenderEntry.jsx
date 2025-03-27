import { registerRoot, Composition } from 'remotion';
import { VideoSequence } from './VideoSequence';

export const RemotionPlayer = ({ durationInFrames = 1, fps = 30, items = [], audio = null }) => {
  // Ensure durationInFrames is at least 1
  const actualDurationInFrames = Math.max(1, durationInFrames);

  return (
    <Composition
      id="remotion-player"
      component={VideoSequence}
      durationInFrames={actualDurationInFrames}
      fps={fps}
      width={1920}
      height={1080}
      defaultProps={{
        items,
        audio,
        durationInFrames: actualDurationInFrames,
        fps
      }}
    />
  );
};

registerRoot(RemotionPlayer);








