import { pipeline, env } from '@xenova/transformers';
import { WaveFile } from 'wavefile';  // ✅ named import

env.allowLocalModels = true;
env.allowRemoteModels = true;
env.cacheDir = require('path').join(process.cwd(), '.model-cache');

let audioClassifier: any = null;

export async function getAudioClassifier() {
  if (!audioClassifier) {
    console.log('🎵 Loading audio model...');
    try {
      audioClassifier = await pipeline(
        'audio-classification',
        'Xenova/wav2vec2-base-superb-ks',
        { quantized: true }
      );
      console.log('✅ Audio model loaded.');
    } catch (error) {
      console.error('❌ Failed to load audio model:', error);
      throw error;
    }
  }
  return audioClassifier;
}

function decodeWavToFloat32(buffer: Buffer): Float32Array {
  const wav = new WaveFile(buffer);
  wav.toBitDepth('32f');
  wav.toSampleRate(16000);

  let samples: any = wav.getSamples();

  if (Array.isArray(samples)) {
    if (samples.length > 1) {
      // Stereo → mono
      const SCALING_FACTOR = Math.sqrt(2);
      for (let i = 0; i < samples[0].length; i++) {
        samples[0][i] = SCALING_FACTOR * (samples[0][i] + samples[1][i]) / 2;
      }
    }
    samples = samples[0];
  }

  return samples as Float32Array;
}

export async function detectAudioDeepfake(audioBuffer: Buffer): Promise<{
  verdict: 'deepfake' | 'authentic';
  fakeScore: number;
  realScore: number;
  rawResults: any[];
}> {
  try {
    const classifier = await getAudioClassifier();

    // ✅ Decode to Float32Array — no file path, no AudioContext needed
    const audioData = decodeWavToFloat32(audioBuffer);

    const results = await classifier(audioData, {
      sampling_rate: 16000,
      top_k: null,
    });

    const scores: number[] = results.map((r: any) => r.score);
    const entropy = -scores.reduce((sum: number, p: number) =>
      p > 0 ? sum + p * Math.log(p) : sum, 0
    );
    const normalizedEntropy = entropy / Math.log(scores.length);
    const fakeScore = Math.min(normalizedEntropy * 1.5, 1.0);

    return {
      verdict: fakeScore > 0.5 ? 'deepfake' : 'authentic',
      fakeScore,
      realScore: 1 - fakeScore,
      rawResults: results,
    };
  } catch (error) {
    console.error('Error in audio deepfake detection:', error);
    throw error;
  }
}