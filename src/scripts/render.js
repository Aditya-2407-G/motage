import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";

const compose = async (inputProps) => {
  // Create a webpack bundle of the video.
  const bundled = await bundle({
    entryPoint: path.resolve("src/components/player/VideoSequence.jsx"),
    // If you have a webpack override, make sure to add it here
    webpackOverride: (config) => config,
  });

  // Select the composition you want to render
  const composition = await selectComposition({
    serveUrl: bundled,
    id: "remotion-player",
  });

  // Render the video
  await renderMedia({
    codec: "h264",
    composition,
    serveUrl: bundled,
    outputLocation: `out/${inputProps.filename}.mp4`,
    inputProps,
  });

  return true;
};

export const startRender = async (props) => {
  try {
    await compose(props);
    return {
      success: true,
      outputFile: `out/${props.filename}.mp4`,
    };
  } catch (err) {
    console.error("Render error:", err);
    return {
      success: false,
      error: err.message,
    };
  }
};