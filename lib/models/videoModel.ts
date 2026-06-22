// @xenova/transformers has NO video-classification pipeline.
// Strategy: extract frames from video → run image classifier on each frame → aggregate
import { pipeline, env } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

env.allowLocalModels = true;
env.cacheDir = path.join(process.cwd(), '.model-cache');

let frameClassifier: any = null;

export async function getVideoFrameClassifier() {
  if (!frameClassifier) {
    console.log('🎬 Loading video deepfake detection model (frame-based)...');
    try {
      // videoModel.ts — line 19-22, change the model:
frameClassifier = await pipeline(
  'image-classification',
  'onnx-community/Deep-Fake-Detector-v2-Model-ONNX',
  { quantized: false }  // ← forces model.onnx instead of model_quantized.onnx
);
      console.log('✅ Video frame classifier loaded.');
    } catch (error) {
      console.error('❌ Failed to load video model:', error);
      throw error;
    }
  }
  return frameClassifier;
}

const FRAMES_TO_SAMPLE = 8; // number of evenly-spaced frames to analyze

export async function detectVideoDeepfake(videoBuffer: Buffer) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-'));
  const tmpVideo = path.join(tmpDir, `input-${Date.now()}.mp4`);

  try {
    const classifier = await getVideoFrameClassifier();

    // Write video to tmp file
    fs.writeFileSync(tmpVideo, videoBuffer);

    // Extract frames using ffmpeg (must be installed: brew install ffmpeg)
    // Extracts FRAMES_TO_SAMPLE frames evenly spaced across the video
    const framePattern = path.join(tmpDir, 'frame-%03d.jpg');
    execSync(
      `ffmpeg -i "${tmpVideo}" -vf "select=not(mod(n\\,30))" -vframes ${FRAMES_TO_SAMPLE} -q:v 2 "${framePattern}" -y`,
      { stdio: 'pipe' }
    );

    const frameFiles = fs.readdirSync(tmpDir)
      .filter(f => f.startsWith('frame-') && f.endsWith('.jpg'))
      .map(f => path.join(tmpDir, f));

    if (frameFiles.length === 0) {
      throw new Error('No frames extracted from video — is ffmpeg installed?');
    }

    // Run classifier on each frame
    const frameResults = await Promise.all(
      frameFiles.map(async (framePath) => {
        const res = await classifier(framePath);
        return res[0]; // { label, score }
      })
    );

    // Aggregate: average fake scores across all frames
    const fakeScores = frameResults.map(r => {
      const isFake = r.label.toLowerCase() === 'deepfake';
      return isFake ? r.score : 1 - r.score;
    });

    const avgFakeScore = fakeScores.reduce((a, b) => a + b, 0) / fakeScores.length;

    return {
      aggregated: true,
      framesAnalyzed: frameResults.length,
      fakeScore: avgFakeScore,
      realScore: 1 - avgFakeScore,
      frameResults, // per-frame breakdown
    };
  } catch (error) {
    console.error('Error in video deepfake detection:', error);
    throw error;
  } finally {
    // Cleanup all tmp files
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}