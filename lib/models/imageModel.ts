const HF_API = 'https://api-inference.huggingface.co/models';
const TOKEN = process.env.HF_API_TOKEN;
const IMAGE_MODEL = 'dima806/deepfake_vs_real_image_detection';

export async function detectImageDeepfake(buffer: Buffer) {
  const res = await fetch(`${HF_API}/${IMAGE_MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HF API error: ${err}`);
  }

  const results: Array<{ label: string; score: number }> = await res.json();

  const fakeEntry = results.find(r => r.label.toLowerCase().includes('fake'));
  const realEntry = results.find(r => r.label.toLowerCase().includes('real'));
  const fakeScore = fakeEntry?.score ?? 1 - (realEntry?.score ?? 0.5);
  const realScore = 1 - fakeScore;

  let verdict: 'deepfake' | 'uncertain' | 'authentic';
  if (fakeScore >= 0.65) verdict = 'deepfake';
  else if (fakeScore <= 0.35) verdict = 'authentic';
  else verdict = 'uncertain';

  return {
    verdict,
    confidence: verdict === 'deepfake' ? fakeScore : realScore,
    scores: { fake: parseFloat(fakeScore.toFixed(4)), real: parseFloat(realScore.toFixed(4)) },
    type: 'image',
  };
}