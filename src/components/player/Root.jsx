import { registerRoot, Composition } from 'remotion';
import { VideoSequence } from './VideoSequence';

const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="remotion-player"
        component={VideoSequence}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          items: [],
          audio: null,
          durationInFrames: 300
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);


