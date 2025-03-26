import { useState, useEffect, useRef } from 'react';

export default function useAudioAnalysis(audioUrl) {
  const [peaks, setPeaks] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);

  useEffect(() => {
    if (!audioUrl) return;

    const analyzeAudio = async () => {
      try {
        setIsAnalyzing(true);
        
        // Create new audio context only if needed
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
            latencyHint: 'interactive',
            sampleRate: 44100
          });
        }

        // Suspend the context while loading
        await audioContextRef.current.suspend();
        
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioData = await audioContextRef.current.decodeAudioData(arrayBuffer);
        
        // Clean up previous source node if exists
        if (sourceNodeRef.current) {
          sourceNodeRef.current.disconnect();
        }

        // Create and store new source node
        sourceNodeRef.current = audioContextRef.current.createBufferSource();
        sourceNodeRef.current.buffer = audioData;
        
        // Get audio data from first channel
        const channelData = audioData.getChannelData(0);
        
        // Process audio data
        const bufferSize = 1024;
        const detectedBeats = [];
        let lastBeat = 0;
        
        for (let i = 0; i < channelData.length; i += bufferSize) {
          const chunk = channelData.subarray(i, i + bufferSize);
          const energy = chunk.reduce((sum, val) => sum + Math.abs(val), 0) / bufferSize;
          const threshold = 0.15;
          
          if (energy > threshold && i - lastBeat > audioData.sampleRate / 3) {
            detectedBeats.push({ 
              time: i / audioData.sampleRate,
              intensity: energy 
            });
            lastBeat = i;
          }
        }

        setPeaks(detectedBeats);
        setIsAnalyzing(false);
        
      } catch (err) {
        console.error('Audio analysis error:', err);
        setError(err.message);
        setIsAnalyzing(false);
      }
    };

    analyzeAudio();

    return () => {
      // Proper cleanup of audio resources
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [audioUrl]);

  return { peaks, isAnalyzing, error };
}
