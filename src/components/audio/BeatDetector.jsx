import React, { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMedia } from '../../context/MediaContext';
import { useTimeline } from '../../context/TimelineContext';
import useAudioAnalysis from '../../hooks/useAudioAnalysis';
import useAudioController from '../../hooks/useAudioController';

export default function BeatDetector() {
  const { state: { audio, images } } = useMedia();
  const { state: timelineState, dispatch: timelineDispatch } = useTimeline();
  const [isStarted, setIsStarted] = useState(false);
  const [montageStyle, setMontageStyle] = useState('auto'); // Default to auto
  const [suggestedStyle, setSuggestedStyle] = useState(null);
  
  const { peaks, isAnalyzing, error } = useAudioAnalysis(isStarted ? audio?.url : null);

  // Define different montage patterns with descriptions
  const montagePatterns = {
    'every-beat': {
      label: 'Every Beat (Fast)',
      description: 'Changes image on every beat. Perfect for energetic, upbeat songs.',
      filter: (beats) => beats,
    },
    'every-other-beat': {
      label: 'Every Other Beat (Medium)',
      description: 'Changes every second beat. Good for moderate tempo songs.',
      filter: (beats) => beats.filter((_, i) => i % 2 === 0),
    },
    'every-fifth-beat': {
      label: 'Every Fifth Beat (Slow)',
      description: 'Changes every fifth beat. Ideal for slow, emotional songs.',
      filter: (beats) => beats.filter((_, i) => i % 5 === 0),
    },
    'energy-based': {
      label: 'Energy Based (Dynamic)',
      description: 'Changes on high-energy beats only. Adapts to song intensity.',
      filter: (beats) => {
        const averageEnergy = beats.reduce((sum, b) => sum + b.energy, 0) / beats.length;
        return beats.filter(beat => beat.energy > averageEnergy);
      },
    },
    'progressive': {
      label: 'Progressive (Slow to Fast)',
      description: 'Starts slow and gradually increases pace. Great for building intensity.',
      filter: (beats) => {
        return beats.filter((_, i) => {
          const progress = i / beats.length;
          const threshold = Math.pow(progress, 2);
          return Math.random() < threshold;
        });
      },
    }
  };

  // Analyze beats and suggest a style
  const analyzeBeatPattern = useCallback((beats) => {
    if (!beats.length) return 'every-beat';

    // Calculate average tempo and energy
    const tempos = [];
    for (let i = 1; i < beats.length; i++) {
      tempos.push(beats[i].time - beats[i-1].time);
    }
    const avgTempo = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    const avgEnergy = beats.reduce((sum, b) => sum + b.energy, 0) / beats.length;
    
    // Analyze energy variation
    const energyVariation = Math.sqrt(
      beats.reduce((sum, b) => sum + Math.pow(b.energy - avgEnergy, 2), 0) / beats.length
    );

    // Suggest style based on analysis
    if (avgTempo < 0.3) { // Fast tempo
      return energyVariation > 0.2 ? 'energy-based' : 'every-beat';
    } else if (avgTempo < 0.6) { // Medium tempo
      return energyVariation > 0.2 ? 'progressive' : 'every-other-beat';
    } else { // Slow tempo
      return 'every-fifth-beat';
    }
  }, []);

  // Update suggested style when beats are analyzed
  useEffect(() => {
    if (peaks.length > 0) {
      const suggested = analyzeBeatPattern(peaks);
      setSuggestedStyle(suggested);
      if (montageStyle === 'auto') {
        setMontageStyle(suggested);
      }
    }
  }, [peaks, analyzeBeatPattern]);

  const handleAudioReady = useCallback((wavesurfer) => {
    if (!wavesurfer) return;
    
    timelineDispatch({
      type: 'SET_DURATION',
      payload: wavesurfer.getDuration() * 1000
    });
  }, [timelineDispatch]);

  // We'll only use wavesurfer for visualization
  const { containerRef } = useAudioController({
    audioUrl: audio?.url,
    onReady: handleAudioReady,
    visualizerOnly: true, // Add this flag
  });

  const handleStart = () => {
    setIsStarted(true);
  };

  const handleSyncToBeats = useCallback(() => {
    if (!peaks.length || !images.length) return;

    const activeStyle = montageStyle === 'auto' ? suggestedStyle : montageStyle;
    const selectedBeats = montagePatterns[activeStyle].filter(peaks);

    timelineDispatch({
      type: 'SET_BEAT_MARKERS',
      payload: peaks.map(peak => ({
        time: peak.time,
        energy: peak.energy
      }))
    });

    timelineDispatch({ type: 'CLEAR_ITEMS' });
    timelineDispatch({
      type: 'SET_AUDIO',
      payload: audio
    });

    const totalDuration = peaks[peaks.length - 1].time * 1000 + 1000;
    timelineDispatch({
      type: 'SET_DURATION',
      payload: totalDuration
    });

    selectedBeats.forEach((beat, index) => {
      const nextBeat = selectedBeats[index + 1];
      const duration = nextBeat 
        ? (nextBeat.time - beat.time) * 1000 
        : 1000;

      const imageIndex = index % images.length;
      
      timelineDispatch({
        type: 'ADD_ITEM',
        payload: {
          id: `timeline-${Date.now()}-${index}`,
          mediaId: images[imageIndex].id,
          type: 'image',
          startTime: beat.time * 1000,
          duration: duration,
          url: images[imageIndex].url,
        }
      });
    });
  }, [peaks, images, timelineDispatch, audio, montageStyle]);

  return (
    <motion.div 
      className="border rounded-lg bg-white p-4 space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-lg font-semibold">Beat Detection</h2>
      
      {audio?.url && (
        <div className="space-y-4">
          <div ref={containerRef} className="w-full h-20 bg-gray-50 rounded" />
          
          {!isStarted && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStart}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-medium"
            >
              Analyze Beats
            </motion.button>
          )}

          {isAnalyzing && (
            <div className="text-center text-blue-500">
              Analyzing audio beats...
            </div>
          )}

          {error && (
            <div className="text-red-500 bg-red-50 p-4 rounded-lg text-center">
              {error}
            </div>
          )}

          {!isAnalyzing && !error && peaks.length > 0 && (
            <div className="space-y-4">
              <div className="text-green-600 bg-green-50 p-4 rounded-lg text-center">
                Successfully detected {peaks.length} beats!
              </div>

              {/* Montage Style Selector */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Montage Style
                  </label>
                  <select
                    value={montageStyle}
                    onChange={(e) => setMontageStyle(e.target.value)}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="auto">Auto (Recommended)</option>
                    {Object.entries(montagePatterns).map(([key, pattern]) => (
                      <option key={key} value={key}>{pattern.label}</option>
                    ))}
                  </select>
                </div>

                {/* Style Description */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">
                    {montageStyle === 'auto' ? (
                      <>
                        <span className="font-medium">Recommended Style: </span>
                        {suggestedStyle && montagePatterns[suggestedStyle].label}
                        <p className="mt-1">{suggestedStyle && montagePatterns[suggestedStyle].description}</p>
                      </>
                    ) : (
                      <p>{montagePatterns[montageStyle].description}</p>
                    )}
                  </div>
                </div>

                {/* Style Preview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {Object.entries(montagePatterns).map(([key, pattern]) => (
                    <div 
                      key={key}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${montageStyle === key || (montageStyle === 'auto' && suggestedStyle === key)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-200'}`}
                      onClick={() => setMontageStyle(key)}
                    >
                      <h3 className="font-medium">{pattern.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">{pattern.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSyncToBeats}
                disabled={!images?.length}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 
                         rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Montage Style
              </motion.button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
