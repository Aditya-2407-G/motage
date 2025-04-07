import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Download } from 'lucide-react';
import { useTimeline } from '../../context/TimelineContext';
import ClientSideRenderer from './ClientSideRenderer';
import { isMp4RecordingSupported } from '../../utils/videoConverter';

export default function ExportModal({ isOpen, onClose }) {
  const [exporting, setExporting] = useState(false);
  const [filename, setFilename] = useState('my-montage');
  const [progress, setProgress] = useState(0);
  const [useClientSide, setUseClientSide] = useState(true);
  const [renderingClientSide, setRenderingClientSide] = useState(false);
  const [mp4Supported, setMp4Supported] = useState(false);
  const [converting, setConverting] = useState(false);
  const { state: { items, audio, duration } } = useTimeline();  // Get duration from timeline context
  const [processedItems, setProcessedItems] = useState([]);
  const [processedAudio, setProcessedAudio] = useState(null);

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
    // Process items to convert their URLs
    const processedItems = await Promise.all(
      items.map(async (item) => ({
        ...item,
        url: item.url.startsWith('blob:') ? await convertBlobToBase64(item.url) : item.url
      }))
    );

    // Process audio if it's a blob URL
    let processedAudio = audio;
    if (audio?.url?.startsWith('blob:')) {
      const audioBase64 = await convertBlobToBase64(audio.url);
      processedAudio = {
        ...audio,
        url: audioBase64,
        originalUrl: audioBase64
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

    return {
      processedItems,
      processedAudio,
      actualDurationMs,
      actualDurationInFrames
    };
  };

  // Handle client-side rendering
  const handleClientSideRender = async () => {
    try {
      setExporting(true);
      setProgress(0);
      setRenderingClientSide(true);
      setDownloadStarted(false); // Reset download flag

      // Process media to convert blob URLs to data URLs
      const { processedItems, processedAudio } = await processMedia();

      // Store the processed items and audio in state for the ClientSideRenderer
      setProcessedItems(processedItems);
      setProcessedAudio(processedAudio);

      // Client-side rendering will be handled by the ClientSideRenderer component
      // The component will call the onProgress and onComplete callbacks

    } catch (error) {
      console.error('Client-side export failed:', error);
      setExporting(false);
      setProgress(0);
      setRenderingClientSide(false);
      setDownloadStarted(false);
      alert('Export failed. Please try again.');
    }
  };

  // Handle server-side rendering
  const handleServerSideRender = async () => {
    try {
      setExporting(true);
      setProgress(0);

      const { processedItems, processedAudio, actualDurationMs, actualDurationInFrames } = await processMedia();

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
      console.error('Server-side export failed:', error);
      setExporting(false);
      setProgress(0);
      alert('Export failed. Please try again.');
    }
  };

  // Handle export button click
  const handleExport = async () => {
    if (useClientSide) {
      await handleClientSideRender();
    } else {
      await handleServerSideRender();
    }
  };

  // Flag to prevent multiple downloads
  const [downloadStarted, setDownloadStarted] = useState(false);

  // Handle client-side rendering completion
  const handleClientSideComplete = async (videoUrl, mimeType) => {
    try {
      // Prevent multiple downloads
      if (downloadStarted) {
        console.log('Download already started, ignoring duplicate completion');
        return;
      }
      setDownloadStarted(true);

      // Determine the file extension based on MIME type
      const isWebm = mimeType.includes('webm');
      let fileExtension = isWebm ? '.webm' : '.mp4';

      console.log('Download video with MIME type:', mimeType, 'and extension:', fileExtension);

      // Fetch the blob from the URL
      const response = await fetch(videoUrl);
      const videoBlob = await response.blob();

      // Create a new blob with the correct type to ensure proper download
      const properBlob = new Blob([videoBlob], {
        type: isWebm ? 'video/webm' : 'video/mp4'
      });

      // Create a new URL for the properly typed blob
      URL.revokeObjectURL(videoUrl); // Free up the old URL
      const downloadUrl = URL.createObjectURL(properBlob);

      // Create a download link
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `${filename}${fileExtension}`;
      downloadLink.style.display = 'none';

      // Add to DOM, click, and remove
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadUrl);
      }, 1000);

      setExporting(false);
      setProgress(100);
      setRenderingClientSide(false);
      onClose();
    } catch (error) {
      console.error('Error in video completion handler:', error);
      setExporting(false);
      setProgress(0);
      setRenderingClientSide(false);
      setConverting(false);
      setDownloadStarted(false);
      alert('Error processing the video. Please try again.');
    }
  };

  // Handle client-side rendering error
  const handleClientSideError = (error) => {
    console.error('Client-side rendering error:', error);
    setExporting(false);
    setProgress(0);
    setRenderingClientSide(false);
    alert('Export failed. Please try again.');
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

          <div className="flex items-center space-x-2">
            <Switch
              id="render-mode"
              checked={useClientSide}
              onCheckedChange={setUseClientSide}
              disabled={exporting}
            />
            <Label htmlFor="render-mode" className="cursor-pointer">
              Use client-side rendering (faster, runs in browser)
            </Label>
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
                {converting ? 'Converting video...' : 'Rendering video...'} {progress}%
              </p>
            </div>
          )}

          {useClientSide && !mp4Supported && (
            <p className="text-xs text-amber-400 mt-1">
              Note: Your browser doesn't support direct MP4 recording. Videos will be in WebM format.
            </p>
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

          {/* Hidden client-side renderer component */}
          {renderingClientSide && (
            <ClientSideRenderer
              items={processedItems.length > 0 ? processedItems : items}
              audio={processedAudio || audio}
              duration={duration}
              fps={30}
              filename={filename}
              onProgress={setProgress}
              onComplete={handleClientSideComplete}
              onError={handleClientSideError}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
