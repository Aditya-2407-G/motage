"use client"

import React, { useRef, useState } from 'react';
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
import ExportModal from './components/export/ExportModal';
import { useElementSize } from './hooks/useElementSize';
import { useTimeline } from './context/TimelineContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Film, Image, Music, Wand2, Download, Settings } from 'lucide-react';

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
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Ensure we have a valid duration and convert to frames
  const durationInFrames = Math.max(1, Math.ceil((duration / 1000) * 30));

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200">
      <div className="container mx-auto py-6 px-4 space-y-6">
        <header className="flex items-center justify-between mb-8">
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
              onClick={() => setShowExportModal(true)}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="outline" 
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Media Management */}
          <div className="space-y-6">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4 bg-gray-800">
                <TabsTrigger value="upload" className="flex items-center gap-2 data-[state=active]:bg-gray-700">
                  <Image className="w-4 h-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="audio" className="flex items-center gap-2 data-[state=active]:bg-gray-700">
                  <Music className="w-4 h-4" />
                  Audio
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3 border-b border-gray-700">
                    <CardTitle className="text-sm font-medium text-gray-200">Media Upload</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <MediaUploader type="image" />
                    <Separator className="bg-gray-700" />
                    <MediaUploader type="video" />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="audio" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3 border-b border-gray-700">
                    <CardTitle className="text-sm font-medium text-gray-200">Audio Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <AudioUploader />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3 border-b border-gray-700">
                <CardTitle className="flex items-center gap-2 text-gray-200">
                  <Wand2 className="w-4 h-4" />
                  Beat Detection
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <BeatDetector />
              </CardContent>
            </Card>
          </div>

          {/* Center/Right Columns - Preview and Library */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Preview */}
            <Card className="overflow-hidden border-2 border-gray-700 bg-gray-800">
              <CardHeader className="pb-3 border-b border-gray-700">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-200">
                  <Film className="w-4 h-4" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-video bg-black">
                  <Player
                    ref={playerRef}
                    component={VideoSequence}
                    durationInFrames={durationInFrames}
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
                <div className="p-3 bg-gray-900 border-t border-gray-700">
                  <PlayerControls playerRef={playerRef} />
                </div>
              </CardContent>
            </Card>

            {/* Media Library */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3 border-b border-gray-700">
                <CardTitle className="text-sm font-medium text-gray-200">Media Library</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <MediaLibrary />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Timeline - Full Width */}
        <div ref={timelineContainerRef} className="mt-6">
          {timelineContainerWidth && (
            <TimelineSizeProvider containerWidth={timelineContainerWidth}>
              <Timeline playerRef={playerRef} />
            </TimelineSizeProvider>
          )}
        </div>
      </div>
      
      {/* Export Modal */}
      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)}
        playerRef={playerRef}
        durationInFrames={durationInFrames}
      />
    </div>
  );
}
