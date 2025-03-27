import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download } from 'lucide-react';
import { useTimeline } from '../../context/TimelineContext';

export default function ExportModal({ isOpen, onClose }) {
  const [exporting, setExporting] = useState(false);
  const [filename, setFilename] = useState('my-montage');
  const [progress, setProgress] = useState(0);
  const { state: { items, audio, duration } } = useTimeline();  // Get duration from timeline context

  const handleExport = async () => {
    try {
      setExporting(true);
      setProgress(0);

      // Convert blob URLs to base64 data URLs
      const convertBlobToBase64 = async (blobUrl) => {
        try {
          const response = await fetch(blobUrl);
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Error converting blob:', error);
          throw error;
        }
      };

      // Process items to convert their URLs
      const processedItems = await Promise.all(
        items.map(async (item) => ({
          ...item,
          url: item.url.startsWith('blob:') ? await convertBlobToBase64(item.url) : item.url
        }))
      );

      // Convert audio URL if it exists
      let processedAudio = audio;
      if (audio?.url && audio.url.startsWith('blob:')) {
        const audioBase64 = await convertBlobToBase64(audio.url);
        processedAudio = {
          ...audio,
          url: audioBase64
        };
      }

      // Calculate the actual duration in frames
      const actualDurationMs = Math.max(audio?.duration || 0, duration || 0);
      const actualDurationInFrames = Math.max(1, Math.ceil((actualDurationMs / 1000) * 30));

      console.log('Export configuration:', {
        audioDuration: audio?.duration,
        timelineDuration: duration,
        actualDurationMs,
        actualDurationInFrames,
      });

      // Prepare the input props for the render
      const renderProps = {
        filename,
        items: processedItems,
        audio: processedAudio,
        durationInFrames: actualDurationInFrames,
        fps: 30,
        duration: actualDurationMs,
      };

      console.log('Render props:', renderProps);

      // Start the server-side render with progress updates
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(renderProps),
      });

      if (!response.ok) {
        throw new Error(`Render failed: ${response.statusText}`);
      }

      // Get the rendered video URL
      const { videoUrl } = await response.json();

      // Download the video
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `${filename}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setExporting(false);
      setProgress(100);
      onClose();

    } catch (error) {
      console.error('Export failed:', error);
      setExporting(false);
      setProgress(0);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-100">Export Video</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="bg-gray-900 border-gray-700 text-gray-200"
              placeholder="Enter filename"
            />
          </div>

          {exporting && (
            <div className="space-y-2">
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-violet-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 text-center">
                Rendering video... {progress}%
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
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
              className="bg-violet-600 hover:bg-violet-700"
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rendering...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Video
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
