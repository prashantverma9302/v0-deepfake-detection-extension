import { pipeline, env } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Allow local caching so model isn't re-downloaded every restart
env.allowLocalModels = true;
env.cacheDir = path.join(process.cwd(), '.model-cache'); // cache in project dir

let classifier: any = null;

export async function getImageClassifier() {
  if (!classifier) {
    console.log('🖼️ Loading deepfake detection model...');
    try {
      
classifier = await pipeline(
  'image-classification',
  'onnx-community/Deep-Fake-Detector-v2-Model-ONNX',
  { quantized: false }  // ← forces model.onnx instead of model_quantized.onnx
);
      console.log('✅ Image model loaded.');
    } catch (error) {
      console.error('❌ Failed to load model:', error);
      throw error;
    }
  }
  return classifier;
}

export async function detectImageDeepfake(imageBuffer: Buffer) {
  const tmpFile = path.join(os.tmpdir(), `deepfake-${Date.now()}.jpg`);
  try {
    const model = await getImageClassifier();
    fs.writeFileSync(tmpFile, imageBuffer);
    const result = await model(tmpFile);
    return result;
  } catch (error) {
    console.error('Error in detectImageDeepfake:', error);
    throw error;
  } finally {
    // Always clean up tmp file even if model throws
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}