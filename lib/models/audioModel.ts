const HF_API = 'https://api-inference.huggingface.co/models';
const TOKEN = process.env.HF_API_TOKEN;
const AUDIO_MODEL = 'MelyssaMT/deepfake-audio-detection';

export async function detectAudioDeepfake(buffer: Buffer) {
  const res = await fetch(`${HF_API}/${AUDIO_MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  });

  if (!res.ok) throw new Error(`HF API error: ${await res.text()}`);

  const results: Array<{ label: string; score: number }> = await res.json();

  const fakeEntry = results.find(r => r.label.toLowerCase().includes('fake') || r.label === 'spoof');
  const realEntry = results.find(r => r.label.toLowerCase().includes('real') || r.label === 'bonafide');
  const fakeScore = fakeEntry?.score ?? 1 - (realEntry?.score ?? 0.5);
  const realScore = 1 - fakeScore;

  let verdict: 'deepfake' | 'uncertain' | 'authentic';
  if (fakeScore >= 0.65) verdict = 'deepfake';
  else if (fakeScore <= 0.35) verdict = 'authentic';
  else verdict = 'uncertain';

  return {
    verdict,
    fakeScore: parseFloat(fakeScore.toFixed(4)),
    realScore: parseFloat(realScore.toFixed(4)),
    rawResults: results,
  };
}