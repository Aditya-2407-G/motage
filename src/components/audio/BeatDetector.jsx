"use client"

import { useCallback, useState, useEffect } from "react"
import { useMedia } from "../../context/MediaContext"
import { useTimeline } from "../../context/TimelineContext"
import useAudioAnalysis from "../../hooks/useAudioAnalysis"
import useAudioController from "../../hooks/useAudioController"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { AudioWaveformIcon as Waveform, Zap } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

const formatTimeForInput = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const parseTimeInput = (timeString) => {
  const [mins, secs] = timeString.split(':').map(Number)
  return (mins * 60) + secs
}

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

export default function BeatDetector() {
  // Context hooks
  const { state: { audio, images } } = useMedia()
  const { state: timelineState, dispatch: timelineDispatch } = useTimeline()

  // State hooks - keep all useState calls at the top
  const [isStarted, setIsStarted] = useState(false)
  const [montageStyle, setMontageStyle] = useState("auto")
  const [suggestedStyle, setSuggestedStyle] = useState(null)
  const [defaultEffect, setDefaultEffect] = useState("fade")
  const [customBeatInterval, setCustomBeatInterval] = useState(2)
  const [customTransitionDuration, setCustomTransitionDuration] = useState(0.3)
  const [useTimeRange, setUseTimeRange] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)

  // Audio analysis hook
  const { peaks, isAnalyzing, error } = useAudioAnalysis(isStarted ? audio?.url : null)

  // Beat pattern analysis callback - MOVED UP
  const analyzeBeatPattern = useCallback((beats) => {
    if (!beats.length) return "every-beat"

    // Calculate average tempo and energy
    const tempos = []
    for (let i = 1; i < beats.length; i++) {
      tempos.push(beats[i].time - beats[i - 1].time)
    }
    const avgTempo = tempos.reduce((a, b) => a + b, 0) / tempos.length
    const avgEnergy = beats.reduce((sum, b) => sum + b.energy, 0) / beats.length

    // Analyze energy variation
    const energyVariation = Math.sqrt(
      beats.reduce((sum, b) => sum + Math.pow(b.energy - avgEnergy, 2), 0) / beats.length,
    )

    // Suggest style based on analysis
    if (avgTempo < 0.3) {
      // Fast tempo
      return energyVariation > 0.2 ? "energy-based" : "every-beat"
    } else if (avgTempo < 0.6) {
      // Medium tempo
      return energyVariation > 0.2 ? "progressive" : "every-other-beat"
    } else {
      // Slow tempo
      return "every-fifth-beat"
    }
  }, [])

  // Effect to set initial end time when audio loads
  useEffect(() => {
    if (audio?.duration) {
      setEndTime(audio.duration / 1000)
    }
  }, [audio?.duration])

  // Effect to update suggested style when beats are analyzed
  useEffect(() => {
    if (peaks.length > 0) {
      const suggested = analyzeBeatPattern(peaks)
      setSuggestedStyle(suggested)
      if (montageStyle === "auto") {
        setMontageStyle(suggested)
      }
    }
  }, [peaks, analyzeBeatPattern, montageStyle])

  // Callback for audio ready event
  const handleAudioReady = useCallback(
    (wavesurfer) => {
      if (!wavesurfer) return
      timelineDispatch({
        type: "SET_DURATION",
        payload: wavesurfer.getDuration() * 1000,
      })
    },
    [timelineDispatch]
  )

  // Audio controller hook
  const { containerRef } = useAudioController({
    audioUrl: audio?.url,
    onReady: handleAudioReady,
    visualizerOnly: true,
  })

  // Define different montage patterns with descriptions
  const montagePatterns = {
    "every-beat": {
      label: "Every Beat (Fast)",
      description: "Changes image on every beat. Perfect for energetic, upbeat songs.",
      filter: (beats) => beats,
      transitionDuration: 0.1, // Fast transitions for quick beats
    },
    "every-other-beat": {
      label: "Every Other Beat (Medium)",
      description: "Changes every second beat. Good for moderate tempo songs.",
      filter: (beats) => beats.filter((_, i) => i % 2 === 0),
      transitionDuration: 0.3, // Medium transitions
    },
    "every-fifth-beat": {
      label: "Every Fifth Beat (Slow)",
      description: "Changes every fifth beat. Ideal for slow, emotional songs.",
      filter: (beats) => beats.filter((_, i) => i % 5 === 0),
      transitionDuration: 1.0, // Slow, smooth transitions
    },
    "custom": {
      label: "Custom",
      description: "Choose your own beat interval and transition duration.",
      filter: (beats) => beats.filter((_, i) => i % customBeatInterval === 0),
      transitionDuration: customTransitionDuration,
    },
  }

  const transitionEffects = [
    { value: "fade", label: "Fade" },
    { value: "slide-left", label: "Slide Left" },
    { value: "slide-right", label: "Slide Right" },
    { value: "zoom-in", label: "Zoom In" },
    { value: "zoom-out", label: "Zoom Out" },
    { value: "none", label: "None" },
  ]

  // Sync to beats callback
  const handleSyncToBeats = useCallback(async () => {
    if (!peaks.length || !images.length) return

    const activeStyle = montageStyle === "auto" ? suggestedStyle : montageStyle
    const pattern = montagePatterns[activeStyle]

    // Convert audio blob URL to base64 if needed
    let processedAudio = { ...audio };
    if (audio?.url?.startsWith('blob:')) {
      try {
        const audioBase64 = await convertBlobToBase64(audio.url);
        processedAudio = {
          ...audio,
          url: audioBase64,
          originalUrl: audioBase64
        };
      } catch (error) {
        console.error('Failed to convert audio blob:', error);
        return;
      }
    }
    
    // Adjust beat markers for the timeline
    const adjustedBeatMarkers = useTimeRange 
      ? peaks
          .filter(peak => peak.time >= startTime && peak.time <= endTime)
          .map(peak => ({
            time: peak.time - startTime,
            energy: peak.energy,
          }))
      : peaks.map(peak => ({
          time: peak.time,
          energy: peak.energy,
        }))

    timelineDispatch({
      type: "SET_BEAT_MARKERS",
      payload: adjustedBeatMarkers,
    })

    // Filter and adjust beats for the montage
    let selectedBeats = pattern.filter(peaks)
    if (useTimeRange) {
      selectedBeats = selectedBeats
        .filter(beat => beat.time >= startTime && beat.time <= endTime)
        .map(beat => ({
          ...beat,
          time: beat.time - startTime
        }))
    }

    timelineDispatch({ type: "CLEAR_ITEMS" })

    // Adjust audio start time and duration
    const adjustedAudio = {
      ...processedAudio,
      startTime: useTimeRange ? startTime * 1000 : 0,
      offset: useTimeRange ? startTime * 1000 : 0,
      duration: useTimeRange ? (endTime - startTime) * 1000 : processedAudio.duration,
    }

    timelineDispatch({
      type: "SET_AUDIO",
      payload: adjustedAudio,
    })

    // Calculate adjusted duration
    const totalDuration = useTimeRange 
      ? (endTime - startTime) * 1000 + 3000 // Add 3 seconds buffer
      : peaks[peaks.length - 1].time * 1000 + 3000

    timelineDispatch({
      type: "SET_DURATION",
      payload: totalDuration,
    })

    // Reset timeline current time to 0
    timelineDispatch({
      type: "SET_CURRENT_TIME",
      payload: 0,
    })

    // Handle case when no beats are selected
    if (selectedBeats.length === 0 && images.length > 0) {
      timelineDispatch({
        type: "ADD_ITEM",
        payload: {
          id: `timeline-${Date.now()}-fallback`,
          mediaId: images[0].id,
          type: "image",
          startTime: 0,
          duration: totalDuration,
          url: images[0].url,
          inEffect: defaultEffect,
          outEffect: defaultEffect,
          transitionDuration: pattern.transitionDuration * 1000,
        },
      })
      return
    }

    // Create clips for each selected beat
    selectedBeats.forEach((beat, index) => {
      const nextBeat = selectedBeats[index + 1]
      const duration = nextBeat 
        ? (nextBeat.time - beat.time) * 1000 
        : totalDuration - beat.time * 1000

      const imageIndex = index % images.length

      const transitionDuration = activeStyle === "custom" 
        ? customTransitionDuration 
        : pattern.transitionDuration

      timelineDispatch({
        type: "ADD_ITEM",
        payload: {
          id: `timeline-${Date.now()}-${index}`,
          mediaId: images[imageIndex].id,
          type: "image",
          startTime: beat.time * 1000,
          duration: duration,
          url: images[imageIndex].url,
          inEffect: defaultEffect,
          outEffect: defaultEffect,
          transitionDuration: transitionDuration * 1000,
        },
      })
    })
  }, [peaks, images, timelineDispatch, audio, montageStyle, suggestedStyle, defaultEffect, 
      customBeatInterval, customTransitionDuration, useTimeRange, startTime, endTime])

  const handleStart = () => {
    setIsStarted(true)
  }

  if (!audio?.url) {
    return (
      <div className="text-center py-4 space-y-3">
        <Waveform className="w-10 h-10 mx-auto text-gray-500 opacity-50" />
        <p className="text-sm text-gray-400">Upload an audio track to detect beats</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {audio?.url && (
        <>
          <div ref={containerRef} className="w-full h-16 bg-gray-900 rounded-md overflow-hidden" />

          {!isStarted && (
            <Button onClick={handleStart} className="w-full bg-violet-600 hover:bg-violet-700" size="sm">
              <Zap className="w-4 h-4 mr-2" />
              Analyze Beats
            </Button>
          )}

          {isAnalyzing && (
            <div className="space-y-3 py-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 rounded-full animate-pulse bg-violet-600/20" />
                <p className="text-sm text-violet-400">Analyzing audio beats...</p>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-2 w-full rounded-full animate-pulse bg-violet-600/10" />
                <Skeleton className="h-2 w-3/4 rounded-full animate-pulse bg-violet-600/10" />
              </div>
            </div>
          )}

          {error && <div className="text-red-400 bg-red-900/20 p-3 rounded-md text-sm">{error}</div>}

          {!isAnalyzing && !error && peaks.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm text-violet-400 bg-violet-900/20 p-3 rounded-md">
                Successfully detected {peaks.length} beats!
              </div>

              {/* Montage Style Selector */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-200">Montage Style</h4>
                <RadioGroup value={montageStyle} onValueChange={setMontageStyle} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="auto" className="border-violet-600 text-violet-600" />
                    <Label htmlFor="auto" className="font-medium text-gray-300">
                      Auto (Recommended)
                    </Label>
                  </div>

                  {Object.entries(montagePatterns).map(([key, pattern]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem value={key} id={key} className="border-violet-600 text-violet-600" />
                      <Label htmlFor={key} className="text-gray-300">
                        {pattern.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {/* Custom Beat Settings */}
                {montageStyle === "custom" && (
                  <div className="mt-4 space-y-4 p-4 bg-gray-800 rounded-lg">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-200">Beat Interval</Label>
                      <Select 
                        value={customBeatInterval.toString()} 
                        onValueChange={(value) => setCustomBeatInterval(Number(value))}
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-gray-200">
                          <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                          {[1, 2, 3, 4, 5, 6, 8, 10].map((interval) => (
                            <SelectItem key={interval} value={interval.toString()}>
                              Every {interval}{interval === 1 ? 'st' : interval === 2 ? 'nd' : interval === 3 ? 'rd' : 'th'} beat
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-200">Transition Duration (seconds)</Label>
                      <Select 
                        value={customTransitionDuration.toString()} 
                        onValueChange={(value) => setCustomTransitionDuration(Number(value))}
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-gray-200">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                          {[0.1, 0.2, 0.3, 0.5, 0.8, 1.0, 1.5, 2.0].map((duration) => (
                            <SelectItem key={duration} value={duration.toString()}>
                              {duration} seconds
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Style Description */}
                <div className="bg-gray-900 p-3 rounded-md">
                  <div className="text-sm text-gray-400">
                    {montageStyle === "auto" ? (
                      <>
                        <span className="font-medium text-gray-300">Recommended Style: </span>
                        {suggestedStyle && montagePatterns[suggestedStyle].label}
                        <p className="mt-1">{suggestedStyle && montagePatterns[suggestedStyle].description}</p>
                      </>
                    ) : (
                      <p>{montagePatterns[montageStyle].description}</p>
                    )}
                  </div>
                </div>

                {/* Transition Effect Selector */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-200">Transition Effect</h4>
                  <Select value={defaultEffect} onValueChange={setDefaultEffect}>
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-gray-200">
                      <SelectValue placeholder="Select effect" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                      {transitionEffects.map((effect) => (
                        <SelectItem key={effect.value} value={effect.value}>
                          {effect.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">
                    This effect will be applied to all images. You can change individual effects later in the timeline.
                  </p>
                </div>

                {/* Time Range Selector */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useTimeRange"
                      checked={useTimeRange}
                      onCheckedChange={setUseTimeRange}
                      className="border-violet-600 text-violet-600"
                    />
                    <Label htmlFor="useTimeRange" className="text-sm font-medium text-gray-200">
                      Use Custom Time Range
                    </Label>
                  </div>

                  {useTimeRange && (
                    <div className="mt-4 space-y-4 p-4 bg-gray-800 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-200">Start Time</Label>
                          <Input
                            type="time"
                            step="1"
                            value={formatTimeForInput(startTime)}
                            onChange={(e) => setStartTime(parseTimeInput(e.target.value))}
                            className="bg-gray-900 border-gray-700 text-gray-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-200">End Time</Label>
                          <Input
                            type="time"
                            step="1"
                            value={formatTimeForInput(endTime)}
                            onChange={(e) => setEndTime(parseTimeInput(e.target.value))}
                            className="bg-gray-900 border-gray-700 text-gray-200"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">
                        Select the time range for your montage. Only beats within this range will be used.
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSyncToBeats}
                  disabled={!images?.length}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                >
                  Apply Montage Style
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

