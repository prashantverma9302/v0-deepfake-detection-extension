import { pipeline } from '@xenova/transformers';

async function test() {
  console.log('🖼️ Testing model load...');
  try {
    const classifier = await pipeline('image-classification', 'prithivMLmods/Deepfake-Detect-Siglip2');
    console.log('✅ Model loaded successfully!');
  } catch (error) {
    console.error('❌ Model load failed:', error);
  }
}
test();