import { startRender } from '../scripts/render';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const renderProps = req.body;
    const result = await startRender(renderProps);

    if (!result.success) {
      throw new Error(result.error);
    }

    // Return the video URL
    res.status(200).json({
      videoUrl: `/rendered/${result.outputFile}`,
    });
  } catch (error) {
    console.error('Render error:', error);
    res.status(500).json({ message: 'Render failed', error: error.message });
  }
}