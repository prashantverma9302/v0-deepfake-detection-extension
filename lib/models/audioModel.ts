// lib/models/audioModel.ts
import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;

let audioClassifier: any = null;

export async function getAudioClassifier() {
  if (!audioClassifier) {
    console.log('Loading audio deepfake detection model...');
    audioClassifier = await pipeline(
      'audio-classification',
      'garystafford/wav2vec2-deepfake-voice-detector'
    );
    console.log('Audio model loaded successfully.');
  }
  return audioClassifier;
}

export async function detectAudioDeepfake(audioBuffer: Buffer) {
  try {
    const classifier = await getAudioClassifier();
    const result = await classifier(audioBuffer);
    return result; // e.g., [{ label: 'fake', score: 0.95 }]
  } catch (error) {
    console.error('Error in audio deepfake detection:', error);
    throw error;
  }
}