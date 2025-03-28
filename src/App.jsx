"use client"

import React, { useRef, useState } from 'react'
import { Player } from '@remotion/player'
import { MediaProvider } from './context/MediaContext'
import { TimelineProvider, useTimeline } from './context/TimelineContext'
import { TimelineZoomProvider } from './context/TimelineZoomContext'
import { TimelineSizeProvider } from './context/TimelinSizeProvider'
import MediaUploader from './components/media/MediaUploader'
import MediaLibrary from './components/media/MediaLibrary'
import AudioUploader from './components/audio/AudioUploader'
import BeatDetector from './components/audio/BeatDetector'
import Timeline from './components/timeline/Timeline'
import { VideoSequence } from './components/player/VideoSequence'
import ExportModal from './components/export/ExportModal'
import { useElementSize } from './hooks/useElementSize'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Film, Music, Wand2, Download, Settings, Sparkles } from 'lucide-react'

export default function App() {
  return (
    <MediaProvider>
      <TimelineProvider>
        <TimelineZoomProvider initialZoom={1}>
          <AppContent />
        </TimelineZoomProvider>
      </TimelineProvider>
    </MediaProvider>
  )
}

function AppContent() {
  const playerRef = useRef(null)
  const timelineContainerRef = useRef(null)
  const timelineContainerSize = useElementSize(timelineContainerRef)
  const timelineContainerWidth = timelineContainerSize?.width
  const [showExportModal, setShowExportModal] = useState(false)
  const { state: { duration, items, audio } } = useTimeline()

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-gradient-to-br from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header Area */}
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-gray-800 p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Motion Editor Pro
            </h1>
            <p className="text-slate-600 dark:text-gray-400 mt-1">Create stunning video sequences with professional effects</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="border-slate-200 hover:border-slate-300 hover:bg-slate-100 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800 text-slate-700 dark:text-gray-300"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button 
              onClick={() => setShowExportModal(true)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 dark:from-violet-500 dark:to-indigo-500 dark:hover:from-violet-600 dark:hover:to-indigo-600 text-white border-0"
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
        <div className="w-80 border-r border-slate-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4">
          <Tabs defaultValue="media" className="h-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-gray-800">
              <TabsTrigger value="media" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                <Film className="w-4 h-4 mr-2" />
                Media
              </TabsTrigger>
              <TabsTrigger value="audio" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
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
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
          {/* Preview Area */}
          <div className="p-4 flex-none">
            <div className="aspect-video bg-black rounded-lg w-full overflow-hidden shadow-lg" style={{ maxHeight: '60vh' }}>
              <Player
                ref={playerRef}
                id="remotion-player"
                component={VideoSequence}
                durationInFrames={Math.max(1, Math.ceil((duration / 1000) * 30))}
                fps={30}
                compositionWidth={1920}
                compositionHeight={1080}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                inputProps={{
                  items,
                  audio,
                  durationInFrames: Math.max(1, Math.ceil((duration / 1000) * 30))
                }}
                errorFallback={() => (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 text-violet-400 opacity-50" />
                      <p>Something went wrong</p>
                    </div>
                  </div>
                )}
                loop={false}
                showControls={false}
              />
            </div>
          </div>

          {/* Timeline Area */}
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
  )
}
