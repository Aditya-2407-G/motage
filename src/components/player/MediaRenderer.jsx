import { motion, AnimatePresence } from "framer-motion"
import { useCurrentFrame } from "remotion"

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
  const durationInFrames = (item.duration / 1000) * 30
  const progress = Math.min(frame / durationInFrames, 1)
  
  const inEffect = item.inEffect || EFFECTS.FADE
  const outEffect = item.outEffect || EFFECTS.FADE

  // Calculate transition duration based on clip duration
  // If clip is shorter than 1 second, make transition faster
  const transitionDuration = Math.min(item.duration / 4000, 0.5)

  // Define transition variants
  const variants = {
    initial: {
      opacity: inEffect === EFFECTS.FADE ? 0 : 1,
      x: inEffect === EFFECTS.SLIDE_LEFT ? 100 : 
         inEffect === EFFECTS.SLIDE_RIGHT ? -100 : 0,
      scale: inEffect === EFFECTS.ZOOM ? 0.5 : 1,
      filter: inEffect === EFFECTS.BLUR ? "blur(10px)" : "blur(0px)",
    },
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
    exit: {
      opacity: outEffect === EFFECTS.FADE ? 0 : 1,
      x: outEffect === EFFECTS.SLIDE_LEFT ? -100 : 
         outEffect === EFFECTS.SLIDE_RIGHT ? 100 : 0,
      scale: outEffect === EFFECTS.ZOOM ? 1.5 : 1,
      filter: outEffect === EFFECTS.BLUR ? "blur(10px)" : "blur(0px)",
      transition: {
        duration: transitionDuration,
        ease: "easeIn"
      }
    }
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

