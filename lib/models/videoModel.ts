// lib/models/videoModel.ts
import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;

let videoClassifier: any = null;

export async function getVideoClassifier() {
  if (!videoClassifier) {
    console.log('Loading video deepfake detection model...');
    // Note: The video classification pipeline may require additional configuration.
    videoClassifier = await pipeline(
      'video-classification',
      'tayyabimam/Deepfake'
    );
    console.log('Video model loaded successfully.');
  }
  return videoClassifier;
}

export async function detectVideoDeepfake(videoBuffer: Buffer) {
  try {
    const classifier = await getVideoClassifier();
    // The pipeline may need the video saved to a temporary file.
    const result = await classifier(videoBuffer);
    return result; // e.g., [{ label: 'REAL', score: 0.92 }]
  } catch (error) {
    console.error('Error in video deepfake detection:', error);
    throw error;
  }
}