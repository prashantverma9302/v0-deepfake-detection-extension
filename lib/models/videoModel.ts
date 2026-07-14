// Video = run image model on each frame via HF API
const HF_API = 'https://api-inference.huggingface.co/models';
const TOKEN = process.env.HF_API_TOKEN;
const IMAGE_MODEL = 'dima806/deepfake_vs_real_image_detection';

async function classifyFrame(frameBase64: string): Promise<number> {
  const base64Data = frameBase64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const res = await fetch(`${HF_API}/${IMAGE_MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  });

  if (!res.ok) throw new Error(`HF API error: ${await res.text()}`);

  const results: Array<{ label: string; score: number }> = await res.json();
  const fakeEntry = results.find(r => r.label.toLowerCase().includes('fake'));
  return fakeEntry?.score ?? 0.5;
}

export async function detectVideoDeepfake(frames: string[]) {
  // Run all frames in parallel
  const fakeScores = await Promise.all(frames.map(classifyFrame));

  // 75th percentile aggregation
  const sorted = [...fakeScores].sort((a, b) => a - b);
  const p75 = sorted[Math.floor(sorted.length * 0.75)];

  // Temporal inconsistency penalty
  const mean = fakeScores.reduce((a, b) => a + b, 0) / fakeScores.length;
  const variance = fakeScores.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / fakeScores.length;
  const temporalConsistency = Math.max(0, 1 - Math.sqrt(variance) / 0.5);
  const finalFakeScore = Math.min(p75 + (1 - temporalConsistency) * 0.15, 1.0);
  const finalRealScore = 1 - finalFakeScore;

  let verdict: 'deepfake' | 'uncertain' | 'authentic';
  if (finalFakeScore >= 0.65) verdict = 'deepfake';
  else if (finalFakeScore <= 0.35) verdict = 'authentic';
  else verdict = 'uncertain';

  return {
    verdict,
    confidence: verdict === 'deepfake' ? finalFakeScore : finalRealScore,
    scores: {
      fake: parseFloat(finalFakeScore.toFixed(4)),
      real: parseFloat(finalRealScore.toFixed(4)),
    },
    analysis: {
      framesAnalyzed: frames.length,
      temporalConsistency: parseFloat(temporalConsistency.toFixed(4)),
      frameScores: fakeScores.map(s => parseFloat(s.toFixed(4))),
    },
    type: 'video',
  };
}