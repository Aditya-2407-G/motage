import React, { useRef } from 'react';
import { Player } from '@remotion/player';
import { MediaProvider } from './context/MediaContext';
import { TimelineProvider } from './context/TimelineContext';
import { TimelineZoomProvider } from './context/TimelineZoomContext';
import { TimelineSizeProvider } from './context/TimelinSizeProvider';
import MediaUploader from './components/media/MediaUploader';
import MediaLibrary from './components/media/MediaLibrary';
import AudioUploader from './components/audio/AudioUploader';
import BeatDetector from './components/audio/BeatDetector';
import Timeline from './components/timeline/Timeline';
import VideoSequence from './components/player/VideoSequence';
import PlayerControls from './components/player/PlayerControls';
import { useElementSize } from './hooks/useElementSize';
import { useTimeline } from './context/TimelineContext';

export default function App() {
  const playerRef = useRef(null);
  const timelineContainerRef = useRef(null);
  const timelineContainerSize = useElementSize(timelineContainerRef);
  const timelineContainerWidth = timelineContainerSize?.width;

  return (
    <MediaProvider>
      <TimelineProvider>
        <TimelineZoomProvider initialZoom={1}>
          {/* Now we can use useTimeline inside a component here */}
          <AppContent 
            playerRef={playerRef} 
            timelineContainerRef={timelineContainerRef}
            timelineContainerWidth={timelineContainerWidth}
          />
        </TimelineZoomProvider>
      </TimelineProvider>
    </MediaProvider>
  );
}

// Create a new component to use the timeline context
function AppContent({ playerRef, timelineContainerRef, timelineContainerWidth }) {
  const { state: { duration } } = useTimeline();
  // Ensure we have a valid duration and convert to frames
  const durationInFrames = Math.max(1, Math.ceil((duration / 1000) * 30));

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Media Upload Section */}
        <div className="grid grid-cols-2 gap-8">
          <MediaUploader type="image" />
          <MediaUploader type="video" />
        </div>

        {/* Media Library */}
        <MediaLibrary />

        {/* Audio Section */}
        <div className="grid grid-cols-2 gap-8">
          <AudioUploader />
          <BeatDetector />
        </div>

        {/* Video Preview */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <Player
            ref={playerRef}
            component={VideoSequence}
            durationInFrames={durationInFrames}
            fps={30} // Make sure this matches the FPS constant in TimelineTrack
            compositionWidth={1920}
            compositionHeight={1080}
            style={{
              width: '100%',
              height: '100%',
            }}
            errorFallback={() => <div>Something went wrong</div>}
            loop={false}
            showControls={false}
          />
          <PlayerControls playerRef={playerRef} />
        </div>

        {/* Timeline */}
        <div ref={timelineContainerRef}>
          {timelineContainerWidth && (
            <TimelineSizeProvider containerWidth={timelineContainerWidth}>
              <Timeline playerRef={playerRef} />
            </TimelineSizeProvider>
          )}
        </div>
      </div>
    </div>
  );
}




