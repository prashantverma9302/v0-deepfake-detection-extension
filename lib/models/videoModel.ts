// lib/models/videoModel.ts

const HF_API = 'https://router.huggingface.co/hf-inference/models';
const IMAGE_MODEL = 'dima806/deepfake_vs_real_image_detection'; // or use a better image model
const TOKEN = process.env.HF_API_TOKEN;

export async function classifyFrame(base64Data: string) {
  if (!TOKEN) throw new Error('HF_API_TOKEN is not set');

  // Remove the data URL prefix (if present)
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');

  const res = await fetch(`${HF_API}/${IMAGE_MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/octet-stream', // image bytes, not JSON
    },
    body: buffer,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HF API error: ${err}`);
  }

  const results: Array<{ label: string; score: number }> = await res.json();
  return results;
}

export async function detectVideoDeepfake(frames: string[]) {
  const frameResults = await Promise.all(frames.map(frame => classifyFrame(frame)));
  // Aggregate results (e.g., average scores)
  const fakeScores = frameResults.map(r => {
    const fake = r.find(item => item.label.toLowerCase().includes('fake'));
    return fake ? fake.score : 0;
  });
  const avgFake = fakeScores.reduce((a, b) => a + b, 0) / fakeScores.length;
  const real = 1 - avgFake;

  return {
    verdict: avgFake > 0.5 ? 'deepfake' : 'authentic',
    confidence: avgFake > 0.5 ? avgFake : real,
    scores: { fake: avgFake, real },
    type: 'video',
    logId: `vid_${Date.now()}`,
  };
}