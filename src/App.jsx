
import React, { useRef, useState } from 'react';
import { Player } from '@remotion/player';
import { MediaProvider } from './context/MediaContext';
import { TimelineProvider, useTimeline } from './context/TimelineContext';
import { TimelineZoomProvider } from './context/TimelineZoomContext';
import { TimelineSizeProvider } from './context/TimelinSizeProvider';
import MediaUploader from './components/media/MediaUploader';
import MediaLibrary from './components/media/MediaLibrary';
import AudioUploader from './components/audio/AudioUploader';
import BeatDetector from './components/audio/BeatDetector';
import Timeline from './components/timeline/Timeline';
import VideoSequence from './components/player/VideoSequence';

import ExportModal from './components/export/ExportModal';
import { useElementSize } from './hooks/useElementSize';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Film, Music, Wand2, Download, Settings } from 'lucide-react';

export default function App() {
  return (
    <MediaProvider>
      <TimelineProvider>
        <TimelineZoomProvider initialZoom={1}>
          <AppContent />
        </TimelineZoomProvider>
      </TimelineProvider>
    </MediaProvider>
  );
}

function AppContent() {
  const playerRef = useRef(null);
  const timelineContainerRef = useRef(null);
  const timelineContainerSize = useElementSize(timelineContainerRef);
  const timelineContainerWidth = timelineContainerSize?.width;
  const [showExportModal, setShowExportModal] = useState(false);
  const { state: { duration } } = useTimeline();

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-gray-950">
      {/* Header Area */}
      <div className="flex-shrink-0 border-b border-gray-800 p-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              Motion Editor Pro
            </h1>
            <p className="text-gray-400 mt-1">Create stunning video sequences with professional effects</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button 
              variant="outline" 
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200"
              onClick={() => setShowExportModal(true)}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </header>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <div className="w-80 border-r border-gray-800 p-4">
          <Tabs defaultValue="media" className="h-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger value="media">
                <Film className="w-4 h-4 mr-2" />
                Media
              </TabsTrigger>
              <TabsTrigger value="audio">
                <Music className="w-4 h-4 mr-2" />
                Audio
              </TabsTrigger>

            </TabsList>
            <TabsContent value="media" className="mt-4 h-full overflow-auto">
              <MediaUploader />
              <MediaLibrary />
            </TabsContent>
            <TabsContent value="audio" className="mt-4 h-full overflow-auto">
              <AudioUploader />
              <BeatDetector />
            </TabsContent>

          </Tabs>
        </div>

        {/* Main Preview and Timeline Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Preview Area - Removed PlayerControls */}
          <div className="p-4 flex-none">
            <div className="aspect-video bg-black rounded-lg w-full overflow-hidden" style={{ maxHeight: '60vh' }}>
              <Player
                ref={playerRef}
                component={VideoSequence}
                durationInFrames={Math.max(1, Math.ceil((duration / 1000) * 30))}
                fps={30}
                compositionWidth={1920}
                compositionHeight={1080}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                errorFallback={() => <div className="flex items-center justify-center h-full text-white">Something went wrong</div>}
                loop={false}
                showControls={false}
              />
            </div>
          </div>

          {/* Timeline Area - Keeps the controls */}
          <div className="flex-1 p-4 pt-0 min-h-0">
            <div ref={timelineContainerRef} className="h-full">
              {timelineContainerWidth && (
                <TimelineSizeProvider containerWidth={timelineContainerWidth}>
                  <Timeline playerRef={playerRef} />
                </TimelineSizeProvider>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)}
        playerRef={playerRef}
        durationInFrames={Math.max(1, Math.ceil((duration / 1000) * 30))}
      />
    </div>
  );
}




