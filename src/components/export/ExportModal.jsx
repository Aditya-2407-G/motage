import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download } from 'lucide-react';
import { useTimeline } from '../../context/TimelineContext';
import ClientSideRenderer from './ClientSideRenderer';
import { isMp4RecordingSupported } from '../../utils/videoConverter';

export default function ExportModal({ isOpen, onClose }) {
  const [exporting, setExporting] = useState(false);
  const [filename, setFilename] = useState('my-montage');
  const [progress, setProgress] = useState(0);
  const [quality, setQuality] = useState('medium'); // Add quality state
  const [mp4Supported, setMp4Supported] = useState(false);
  const [converting, setConverting] = useState(false);
  const { state: { items, audio, duration } } = useTimeline();
  const [processedItems, setProcessedItems] = useState([]);
  const [processedAudio, setProcessedAudio] = useState(null);
  const [downloadStarted, setDownloadStarted] = useState(false);

  // Check if MP4 recording is supported
  useEffect(() => {
    setMp4Supported(isMp4RecordingSupported());
  }, []);

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

  // Process media items and audio
  const processMedia = async () => {
    const processedItems = await Promise.all(
      items.map(async (item) => ({
        ...item,
        url: item.url.startsWith('blob:') ? await convertBlobToBase64(item.url) : item.url
      }))
    );

    let processedAudio = audio;
    if (audio?.url?.startsWith('blob:')) {
      const audioBase64 = await convertBlobToBase64(audio.url);
      processedAudio = {
        ...audio,
        url: audioBase64,
        originalUrl: audioBase64
      };
    }

    return { processedItems, processedAudio };
  };

  // Handle export button click
  const handleExport = async () => {
    try {
      setExporting(true);
      setProgress(0);
      setDownloadStarted(false);

      const { processedItems, processedAudio } = await processMedia();
      setProcessedItems(processedItems);
      setProcessedAudio(processedAudio);
    } catch (error) {
      console.error('Export failed:', error);
      setExporting(false);
      setProgress(0);
      setDownloadStarted(false);
      alert('Export failed. Please try again.');
    }
  };

  // Handle rendering completion
  const handleComplete = async (videoUrl, mimeType) => {
    try {
      if (downloadStarted) {
        console.log('Download already started, ignoring duplicate completion');
        return;
      }
      setDownloadStarted(true);

      const isWebm = mimeType.includes('webm');
      let fileExtension = isWebm ? '.webm' : '.mp4';

      const response = await fetch(videoUrl);
      const videoBlob = await response.blob();
      const properBlob = new Blob([videoBlob], {
        type: isWebm ? 'video/webm' : 'video/mp4'
      });

      URL.revokeObjectURL(videoUrl);
      const downloadUrl = URL.createObjectURL(properBlob);

      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `${filename}${fileExtension}`;
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();

      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadUrl);
      }, 1000);

      setExporting(false);
      setProgress(100);
      onClose();
    } catch (error) {
      console.error('Error in video completion handler:', error);
      setExporting(false);
      setProgress(0);
      setConverting(false);
      setDownloadStarted(false);
      alert('Error processing the video. Please try again.');
    }
  };

  // Handle rendering error
  const handleError = (error) => {
    console.error('Rendering error:', error);
    setExporting(false);
    setProgress(0);
    alert('Export failed. Please try again.');
  };

  // Define quality presets
  const qualityPresets = {
    low: {
      bitrate: 1000000, // 1 Mbps
      label: 'Low (480p)',
      width: 854,
      height: 480
    },
    medium: {
      bitrate: 3000000, // 3 Mbps
      label: 'Medium (720p)',
      width: 1280,
      height: 720
    },
    high: {
      bitrate: 8000000, // 8 Mbps
      label: 'High (1080p)',
      width: 1920,
      height: 1080
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
              disabled={exporting}
            />
          </div>

          <div className="space-y-2">
            <Label>Quality</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(qualityPresets).map(([key, preset]) => (
                <Button
                  key={key}
                  variant={quality === key ? "default" : "outline"}
                  className={`${quality === key ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-500`}
                  onClick={() => setQuality(key)}
                  disabled={exporting}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={exporting}
              className="bg-gray-700 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="bg-blue-600 hover:bg-blue-500"
            >
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting ({progress}%)
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>

          {exporting && (
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          {exporting && (
            <ClientSideRenderer
              items={processedItems.length > 0 ? processedItems : items}
              audio={processedAudio || audio}
              duration={duration}
              fps={30}
              filename={filename}
              quality={qualityPresets[quality]}
              onProgress={setProgress}
              onComplete={handleComplete}
              onError={handleError}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
