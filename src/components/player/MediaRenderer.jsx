import { memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { interpolate } from "remotion"

// Move EFFECTS outside component to prevent recreation
const EFFECTS = {
  FADE: "fade",
  SLIDE_LEFT: "slide-left",
  SLIDE_RIGHT: "slide-right",
  ZOOM_IN: "zoom-in",
  ZOOM_OUT: "zoom-out",
  BLUR: "blur",
  NONE: "none",
}

// Get transition duration based on item's transitionDuration property
const getTransitionDuration = (item) => {
  return (item.transitionDuration || 500) / 1000; // Convert ms to seconds
};

// Memoize the media component
export const MediaRenderer = memo(({ item, currentTimeMs }) => {
  const startTime = item.startTime || 0;
  const endTime = startTime + item.duration;
  const isVisible = currentTimeMs >= startTime && currentTimeMs < endTime;

  if (!isVisible) return null;

  const transitionDuration = getTransitionDuration(item);
  
  // Calculate progress for entrance and exit animations
  const entranceProgress = Math.min(1, (currentTimeMs - startTime) / (transitionDuration * 1000));
  const exitProgress = Math.max(0, 1 - (endTime - currentTimeMs) / (transitionDuration * 1000));

  // Get animation values based on effect type
  const getAnimationStyle = () => {
    const inEffect = item.inEffect || "fade";
    const outEffect = item.outEffect || "fade";
    
    let style = {};

    // Handle entrance animations
    if (entranceProgress < 1) {
      switch (inEffect) {
        case "fade":
          style.opacity = interpolate(entranceProgress, [0, 1], [0, 1]);
          break;
        case "slide-left":
          style.transform = `translateX(${interpolate(entranceProgress, [0, 1], [100, 0])}%)`;
          break;
        case "slide-right":
          style.transform = `translateX(${interpolate(entranceProgress, [0, 1], [-100, 0])}%)`;
          break;
        case "zoom-in":
          style.transform = `scale(${interpolate(entranceProgress, [0, 1], [0.8, 1])})`;
          style.opacity = interpolate(entranceProgress, [0, 1], [0, 1]);
          break;
        case "zoom-out":
          style.transform = `scale(${interpolate(entranceProgress, [0, 1], [1.2, 1])})`;
          style.opacity = interpolate(entranceProgress, [0, 1], [0, 1]);
          break;
        case "blur":
          style.filter = `blur(${interpolate(entranceProgress, [0, 1], [10, 0])}px)`;
          style.opacity = interpolate(entranceProgress, [0, 1], [0, 1]);
          break;
      }
    }

    // Handle exit animations
    if (exitProgress > 0) {
      switch (outEffect) {
        case "fade":
          style.opacity = interpolate(exitProgress, [0, 1], [1, 0]);
          break;
        case "slide-left":
          style.transform = `translateX(${interpolate(exitProgress, [0, 1], [0, -100])}%)`;
          break;
        case "slide-right":
          style.transform = `translateX(${interpolate(exitProgress, [0, 1], [0, 100])}%)`;
          break;
        case "zoom-in":
          style.transform = `scale(${interpolate(exitProgress, [0, 1], [1, 1.2])})`;
          style.opacity = interpolate(exitProgress, [0, 1], [1, 0]);
          break;
        case "zoom-out":
          style.transform = `scale(${interpolate(exitProgress, [0, 1], [1, 0.8])})`;
          style.opacity = interpolate(exitProgress, [0, 1], [1, 0]);
          break;
        case "blur":
          style.filter = `blur(${interpolate(exitProgress, [0, 1], [0, 10])}px)`;
          style.opacity = interpolate(exitProgress, [0, 1], [1, 0]);
          break;
      }
    }

    return style;
  };

  const animationStyle = getAnimationStyle();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "black",
        ...animationStyle
      }}
    >
      {item.type === "image" ? (
        <img 
          src={item.url || "/placeholder.svg"} 
          alt={item.name || ""}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain"
          }}
          loading="eager"
        />
      ) : item.type === "video" ? (
        <video 
          src={item.url}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain"
          }}
        />
      ) : null}
    </div>
  );
});

MediaRenderer.displayName = 'MediaRenderer';
