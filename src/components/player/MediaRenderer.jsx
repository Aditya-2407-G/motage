import { interpolate, useCurrentFrame } from "remotion"

// Define transition effects
const EFFECTS = {
  FADE: "fade",
  SLIDE_LEFT: "slide-left",
  SLIDE_RIGHT: "slide-right",
  ZOOM: "zoom",
  BLUR: "blur",
  NONE: "none",
}

export default function MediaRenderer({ item }) {
  const frame = useCurrentFrame()

  // Calculate how far we are into this item's duration (0 to 1)
  const durationInFrames = (item.duration / 1000) * 30 // Convert ms to frames at 30fps
  const progress = Math.min(frame / durationInFrames, 1) // Ensure progress doesn't exceed 1

  // Default to fade effect if not specified
  const inEffect = item.inEffect || EFFECTS.FADE
  const outEffect = item.outEffect || EFFECTS.FADE

  // Calculate transition durations (in frames)
  const transitionFrames = Math.min(15, durationInFrames / 4) // 0.5 second or 1/4 of duration, whichever is shorter

  // Calculate opacity for fade effect - ensure it's never fully transparent
  const opacity = interpolate(
    frame,
    // Input range: start fade in, fully visible, start fade out, end
    [0, transitionFrames, Math.max(durationInFrames - transitionFrames, transitionFrames + 1), durationInFrames],
    // Output range: transparent to opaque to transparent
    [inEffect === EFFECTS.FADE ? 0.2 : 1, 1, 1, outEffect === EFFECTS.FADE ? 0.2 : 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  )

  // Calculate transform effects
  let transform = ""

  // In effects
  if (progress < transitionFrames / durationInFrames) {
    const inProgress = Math.min(frame / transitionFrames, 1)

    if (inEffect === EFFECTS.SLIDE_LEFT) {
      const translateX = interpolate(inProgress, [0, 1], [100, 0])
      transform += `translateX(${translateX}%) `
    } else if (inEffect === EFFECTS.SLIDE_RIGHT) {
      const translateX = interpolate(inProgress, [0, 1], [-100, 0])
      transform += `translateX(${translateX}%) `
    } else if (inEffect === EFFECTS.ZOOM) {
      const scale = interpolate(inProgress, [0, 1], [0.5, 1])
      transform += `scale(${scale}) `
    }
  }

  // Out effects
  if (progress > (durationInFrames - transitionFrames) / durationInFrames && progress < 1) {
    const outProgress = (frame - (durationInFrames - transitionFrames)) / transitionFrames

    if (outEffect === EFFECTS.SLIDE_LEFT) {
      const translateX = interpolate(outProgress, [0, 1], [0, -100])
      transform += `translateX(${translateX}%) `
    } else if (outEffect === EFFECTS.SLIDE_RIGHT) {
      const translateX = interpolate(outProgress, [0, 1], [0, 100])
      transform += `translateX(${translateX}%) `
    } else if (outEffect === EFFECTS.ZOOM) {
      const scale = interpolate(outProgress, [0, 1], [1, 1.5])
      transform += `scale(${scale}) `
    }
  }

  // Calculate blur for blur effect
  let filter = ""
  if (
    (inEffect === EFFECTS.BLUR && progress < transitionFrames / durationInFrames) ||
    (outEffect === EFFECTS.BLUR && progress > (durationInFrames - transitionFrames) / durationInFrames && progress < 1)
  ) {
    const blurAmount = interpolate(
      frame,
      [0, transitionFrames, durationInFrames - transitionFrames, durationInFrames],
      [10, 0, 0, 10],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    )

    filter = `blur(${blurAmount}px)`
  }

  if (item.type === "image") {
    return (
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
          opacity,
        }}
      >
        <img
          src={item.url || "/placeholder.svg"}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            transform,
            filter,
          }}
          alt=""
        />
      </div>
    )
  }

  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
        opacity,
      }}
    >
      <video
        src={item.url}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          transform,
          filter,
        }}
        muted
      />
    </div>
  )
}

