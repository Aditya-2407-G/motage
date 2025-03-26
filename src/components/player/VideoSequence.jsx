import { useCurrentFrame, useVideoConfig, Audio } from "remotion"
import { useTimeline } from "../../context/TimelineContext"
import MediaRenderer from "./MediaRenderer"

export default function VideoSequence() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const {
    state: { items, audio },
  } = useTimeline()

  const currentTimeMs = (frame / fps) * 1000

  // Find the current item based on frame timing with a small buffer to avoid gaps
  const currentItem = items.find(
    (item) => currentTimeMs >= item.startTime && currentTimeMs < item.startTime + item.duration,
  )

  // If no item is found at the exact time, use the closest previous item as fallback
  // This ensures we always show something rather than a black screen
  const fallbackItem =
    !currentItem && items.length > 0
      ? items.reduce((closest, item) => {
          if (item.startTime <= currentTimeMs && (closest === null || item.startTime > closest.startTime)) {
            return item
          }
          return closest
        }, null)
      : null

  return (
    <>
      {audio?.url && <Audio src={audio.url} />}
      {(currentItem || fallbackItem) && <MediaRenderer item={currentItem || fallbackItem} />}
    </>
  )
}

