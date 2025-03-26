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

export default function BeatDetector() {
  const {
    state: { audio, images },
  } = useMedia()
  const { state: timelineState, dispatch: timelineDispatch } = useTimeline()
  const [isStarted, setIsStarted] = useState(false)
  const [montageStyle, setMontageStyle] = useState("auto") // Default to auto
  const [suggestedStyle, setSuggestedStyle] = useState(null)
  const [defaultEffect, setDefaultEffect] = useState("fade")

  const { peaks, isAnalyzing, error } = useAudioAnalysis(isStarted ? audio?.url : null)

  // Define different montage patterns with descriptions
  const montagePatterns = {
    "every-beat": {
      label: "Every Beat (Fast)",
      description: "Changes image on every beat. Perfect for energetic, upbeat songs.",
      filter: (beats) => beats,
    },
    "every-other-beat": {
      label: "Every Other Beat (Medium)",
      description: "Changes every second beat. Good for moderate tempo songs.",
      filter: (beats) => beats.filter((_, i) => i % 2 === 0),
    },
    "every-fifth-beat": {
      label: "Every Fifth Beat (Slow)",
      description: "Changes every fifth beat. Ideal for slow, emotional songs.",
      filter: (beats) => beats.filter((_, i) => i % 5 === 0),
    },
    "energy-based": {
      label: "Energy Based (Dynamic)",
      description: "Changes on high-energy beats only. Adapts to song intensity.",
      filter: (beats) => {
        const averageEnergy = beats.reduce((sum, b) => sum + b.energy, 0) / beats.length
        return beats.filter((beat) => beat.energy > averageEnergy)
      },
    },
    progressive: {
      label: "Progressive (Slow to Fast)",
      description: "Starts slow and gradually increases pace. Great for building intensity.",
      filter: (beats) => {
        return beats.filter((_, i) => {
          const progress = i / beats.length
          const threshold = Math.pow(progress, 2)
          return Math.random() < threshold
        })
      },
    },
  }

  // Analyze beats and suggest a style
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

  // Update suggested style when beats are analyzed
  useEffect(() => {
    if (peaks.length > 0) {
      const suggested = analyzeBeatPattern(peaks)
      setSuggestedStyle(suggested)
      if (montageStyle === "auto") {
        setMontageStyle(suggested)
      }
    }
  }, [peaks, analyzeBeatPattern])

  const handleAudioReady = useCallback(
    (wavesurfer) => {
      if (!wavesurfer) return

      timelineDispatch({
        type: "SET_DURATION",
        payload: wavesurfer.getDuration() * 1000,
      })
    },
    [timelineDispatch],
  )

  // We'll only use wavesurfer for visualization
  const { containerRef } = useAudioController({
    audioUrl: audio?.url,
    onReady: handleAudioReady,
    visualizerOnly: true,
  })

  const handleStart = () => {
    setIsStarted(true)
  }

  // Update the handleSyncToBeats function to ensure there are no gaps between clips
  const handleSyncToBeats = useCallback(() => {
    if (!peaks.length || !images.length) return

    const activeStyle = montageStyle === "auto" ? suggestedStyle : montageStyle
    const selectedBeats = montagePatterns[activeStyle].filter(peaks)

    timelineDispatch({
      type: "SET_BEAT_MARKERS",
      payload: peaks.map((peak) => ({
        time: peak.time,
        energy: peak.energy,
      })),
    })

    timelineDispatch({ type: "CLEAR_ITEMS" })
    timelineDispatch({
      type: "SET_AUDIO",
      payload: audio,
    })

    const totalDuration = peaks[peaks.length - 1].time * 1000 + 3000 // Add 3 seconds buffer at the end
    timelineDispatch({
      type: "SET_DURATION",
      payload: totalDuration,
    })

    // Ensure we have at least one image even if no beats were detected
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
        },
      })
      return
    }

    selectedBeats.forEach((beat, index) => {
      const nextBeat = selectedBeats[index + 1]
      // If this is the last beat, make the duration extend to the end of the audio
      const duration = nextBeat ? (nextBeat.time - beat.time) * 1000 : totalDuration - beat.time * 1000

      const imageIndex = index % images.length

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
        },
      })
    })
  }, [peaks, images, timelineDispatch, audio, montageStyle, suggestedStyle, defaultEffect])

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
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="slide-left">Slide Left</SelectItem>
                      <SelectItem value="slide-right">Slide Right</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="blur">Blur</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">
                    This effect will be applied to all images. You can change individual effects later in the timeline.
                  </p>
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

