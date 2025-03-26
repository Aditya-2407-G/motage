import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

export default function useAudioController({ audioUrl, onReady, visualizerOnly = false }) {
  const wavesurferRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!audioUrl || !containerRef.current) return;

    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4a90e2',
      progressColor: '#2c5282',
      cursorColor: '#f56565',
      height: 80,
      normalize: true,
      responsive: true,
      interact: true,
      autoplay: false,
      backend: 'WebAudio',
      // Disable audio output if we're only using it for visualization
      volume: visualizerOnly ? 0 : 1,
    });

    wavesurferRef.current.load(audioUrl);

    wavesurferRef.current.on('ready', () => {
      onReady?.(wavesurferRef.current);
    });

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [audioUrl, onReady, visualizerOnly]);

  return {
    containerRef,
    wavesurfer: wavesurferRef.current,
  };
}


