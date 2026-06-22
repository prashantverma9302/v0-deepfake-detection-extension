import { pipeline, env } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';
import os from 'os';

env.allowLocalModels = false;

let classifier: any = null;

export async function getImageClassifier() {
  if (!classifier) {
    console.log('🖼️ Loading CommunityForensics Deepfake Detection model...');
    try {
      // Use the new model here
      classifier = await pipeline(
        'image-classification',
        'buildborderless/CommunityForensics-DeepfakeDet-ViT'
      );
      console.log('✅ Image model loaded.');
    } catch (error) {
      console.error('❌ Failed to load model:', error);
      throw error;
    }
  }
  return classifier;
}

// The detectImageDeepfake function remains unchanged
export async function detectImageDeepfake(imageBuffer: Buffer) {
  try {
    const model = await getImageClassifier();
    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `img-${Date.now()}.jpg`);
    fs.writeFileSync(tmpFile, imageBuffer);
    const result = await model(tmpFile);
    fs.unlinkSync(tmpFile);
    return result;
  } catch (error) {
    console.error('Error in detectImageDeepfake:', error);
    throw error;
  }
}