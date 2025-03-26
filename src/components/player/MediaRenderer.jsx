import { motion, AnimatePresence } from "framer-motion"
import { useCurrentFrame } from "remotion"

// Define transition effects
const EFFECTS = {
  FADE: "fade",
  SLIDE_LEFT: "slide-left",
  SLIDE_RIGHT: "slide-right",
  ZOOM_IN: "zoom-in",
  ZOOM_OUT: "zoom-out",
  BLUR: "blur",
  NONE: "none",
}

export default function MediaRenderer({ item }) {
  const frame = useCurrentFrame()
  const durationInFrames = (item.duration / 1000) * 30
  const progress = Math.min(frame / durationInFrames, 1)
  
  const inEffect = item.inEffect || EFFECTS.FADE
  const outEffect = item.outEffect || EFFECTS.FADE
  const transitionDuration = Math.min(item.duration / 4000, 0.5)

  const getInitialState = (effect) => {
    switch (effect) {
      case EFFECTS.FADE:
        return { opacity: 0 }
      case EFFECTS.SLIDE_LEFT:
        return { x: 100, opacity: 0 }
      case EFFECTS.SLIDE_RIGHT:
        return { x: -100, opacity: 0 }
      case EFFECTS.ZOOM_IN:
        return { scale: 0.5, opacity: 0 }
      case EFFECTS.ZOOM_OUT:
        return { scale: 1.5, opacity: 0 }
      case EFFECTS.BLUR:
        return { filter: "blur(10px)", opacity: 0 }
      default:
        return { opacity: 1 }
    }
  }

  const getExitState = (effect) => {
    switch (effect) {
      case EFFECTS.FADE:
        return { opacity: 0 }
      case EFFECTS.SLIDE_LEFT:
        return { x: -100, opacity: 0 }
      case EFFECTS.SLIDE_RIGHT:
        return { x: 100, opacity: 0 }
      case EFFECTS.ZOOM_IN:
        return { scale: 1.5, opacity: 0 }
      case EFFECTS.ZOOM_OUT:
        return { scale: 0.5, opacity: 0 }
      case EFFECTS.BLUR:
        return { filter: "blur(10px)", opacity: 0 }
      default:
        return { opacity: 1 }
    }
  }

  const variants = {
    initial: getInitialState(inEffect),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: transitionDuration,
        ease: "easeOut"
      }
    },
    exit: getExitState(outEffect)
  }

  const renderMedia = () => {
    if (item.type === "image") {
      return (
        <img 
          src={item.url} 
          alt={item.name || ""}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain"
          }}
        />
      )
    } else if (item.type === "video") {
      return (
        <video 
          src={item.url}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain"
          }}
        />
      )
    }
    return null
  }

  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={item.id} // Important for AnimatePresence to work correctly
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "black" // Add this to ensure proper background
        }}
      >
        {renderMedia()}
      </motion.div>
    </AnimatePresence>
  )
}

