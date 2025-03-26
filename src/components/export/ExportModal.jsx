import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Film, Settings2 } from 'lucide-react';
import { useTimeline } from '../../context/TimelineContext';

export default function ExportModal({ isOpen, onClose, playerRef, durationInFrames }) {
  const { state } = useTimeline();
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSettings, setExportSettings] = useState({
    format: 'mp4',
    quality: 'high',
    resolution: '1080p',
    fps: 30,
    filename: 'my-video-export'
  });

  const handleExport = async () => {
    setExporting(true);
    setExportProgress(0);
    
    // Simulate export progress
    const interval = setInterval(() => {
      setExportProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setExporting(false);
            // In a real implementation, we would trigger the download here
            simulateDownload();
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };
  
  const simulateDownload = () => {
    // In a real implementation, this would be where we'd provide the exported video file
    // For now, we'll just show a message
    alert('Export completed! In a real implementation, the video would download now.');
    onClose();
  };
  
  const handleSettingChange = (key, value) => {
    setExportSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const formatDuration = (frames) => {
    const seconds = frames / exportSettings.fps;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gray-800 border-gray-700 text-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-100">Export Video</DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure your export settings and create your video file.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="bg-gray-900 border border-gray-700">
            <TabsTrigger value="basic" className="data-[state=active]:bg-gray-700">
              Basic
            </TabsTrigger>
            <TabsTrigger value="advanced" className="data-[state=active]:bg-gray-700">
              Advanced
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="filename" className="text-gray-300">Filename</Label>
              <Input 
                id="filename" 
                value={exportSettings.filename} 
                onChange={(e) => handleSettingChange('filename', e.target.value)}
                className="bg-gray-900 border-gray-700 text-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="format" className="text-gray-300">Format</Label>
              <Select 
                value={exportSettings.format} 
                onValueChange={(value) => handleSettingChange('format', value)}
              >
                <SelectTrigger id="format" className="bg-gray-900 border-gray-700 text-gray-200">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                  <SelectItem value="mp4">MP4</SelectItem>
                  <SelectItem value="webm">WebM</SelectItem>
                  <SelectItem value="gif">GIF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quality" className="text-gray-300">Quality</Label>
              <Select 
                value={exportSettings.quality} 
                onValueChange={(value) => handleSettingChange('quality', value)}
              >
                <SelectTrigger id="quality" className="bg-gray-900 border-gray-700 text-gray-200">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                  <SelectItem value="low">Low (Faster)</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High (Slower)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="resolution" className="text-gray-300">Resolution</Label>
              <Select 
                value={exportSettings.resolution} 
                onValueChange={(value) => handleSettingChange('resolution', value)}
              >
                <SelectTrigger id="resolution" className="bg-gray-900 border-gray-700 text-gray-200">
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                  <SelectItem value="720p">720p (1280x720)</SelectItem>
                  <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
                  <SelectItem value="4k">4K (3840x2160)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="fps" className="text-gray-300">Frame Rate (FPS)</Label>
                <span className="text-gray-400">{exportSettings.fps} fps</span>
              </div>
              <Slider
                id="fps"
                min={24}
                max={60}
                step={1}
                value={[exportSettings.fps]}
                onValueChange={(value) => handleSettingChange('fps', value[0])}
                className="[&>span]:bg-violet-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300">Video Information</Label>
              <div className="bg-gray-900 p-3 rounded-md border border-gray-700 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-gray-200">{formatDuration(durationInFrames)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Total Frames:</span>
                  <span className="text-gray-200">{durationInFrames}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Estimated Size:</span>
                  <span className="text-gray-200">~{Math.round(durationInFrames * 0.1)} MB</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {exporting && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Exporting video...</span>
              <span className="text-sm text-gray-300">{Math.round(exportProgress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-2.5 rounded-full" 
                style={{ width: `${exportProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200"
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
            disabled={exporting}
          >
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Video
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
