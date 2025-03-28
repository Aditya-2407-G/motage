import { motion, AnimatePresence } from "framer-motion"

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

export const MediaRenderer = ({ item, currentTimeMs }) => {
  const startTime = item.startTime || 0;
  const endTime = startTime + item.duration;
  const isVisible = currentTimeMs >= startTime && currentTimeMs < endTime;

  // Define animation variants
  const variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const renderMedia = () => {
    if (!isVisible) return null;

    if (item.type === "image") {
      return (
        <img 
          src={item.url || "/placeholder.svg"} 
          alt={item.name || ""}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain"
          }}
        />
      );
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
      );
    }
    return null;
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={item.id}
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
          backgroundColor: "black"
        }}
      >
        {renderMedia()}
      </motion.div>
    </AnimatePresence>
  );
}
