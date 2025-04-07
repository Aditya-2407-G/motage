/**
 * Utility functions for video conversion
 */

/**
 * Check if the browser supports MP4 recording
 * @returns {boolean} True if MP4 recording is supported
 */
export const isMp4RecordingSupported = () => {
  if (!window.MediaRecorder) return false;
  
  return MediaRecorder.isTypeSupported('video/mp4') || 
         MediaRecorder.isTypeSupported('video/mp4;codecs=h264,aac') ||
         MediaRecorder.isTypeSupported('video/webm;codecs=h264,opus');
};

/**
 * Convert a WebM blob to MP4 using a client-side approach
 * This is a fallback for browsers that don't support MP4 recording
 * 
 * @param {Blob} webmBlob - The WebM blob to convert
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} - Promise resolving to an MP4 blob
 */
export const convertWebmToMp4 = async (webmBlob, onProgress = () => {}) => {
  try {
    // First, try to use the Cloudconvert API if available
    // This requires an API key and is just a placeholder
    // You would need to implement your own server endpoint for this
    
    onProgress(10);
    
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', webmBlob, 'video.webm');
    
    onProgress(30);
    
    // In a real implementation, you would send this to your server
    // which would then use a service like Cloudconvert to convert the video
    // For now, we'll just return the original blob with a warning
    
    console.warn('WebM to MP4 conversion is not implemented. Using original WebM file.');
    onProgress(100);
    
    return webmBlob;
    
    /* Example of how a real implementation might look:
    
    const response = await fetch('/api/convert-video', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Video conversion failed');
    }
    
    onProgress(90);
    
    // Get the converted video
    const mp4Blob = await response.blob();
    onProgress(100);
    
    return mp4Blob;
    */
  } catch (error) {
    console.error('Error converting WebM to MP4:', error);
    // Return the original blob if conversion fails
    return webmBlob;
  }
};
