import { NextResponse } from 'next/server';
import { detectAudioDeepfake } from '@/lib/models/audioModel';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { audioBase64, audioUrl } = body;

    if (!audioBase64 && !audioUrl) {
      return NextResponse.json(
        { error: 'No audio provided. Send audioBase64 or audioUrl.' },
        { status: 400 }
      );
    }

    let buffer: Buffer;

    if (audioBase64) {
      const base64Data = audioBase64.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      const res = await fetch(audioUrl);
      if (!res.ok) throw new Error(`Failed to fetch audio: ${res.status}`);
      buffer = Buffer.from(await res.arrayBuffer());
    }

    const result = await detectAudioDeepfake(buffer);

    return NextResponse.json({
      verdict: result.verdict,
      confidence: result.verdict === 'deepfake' ? result.fakeScore : result.realScore,
      scores: {
        fake: result.fakeScore,
        real: result.realScore,
      },
      analysis: {
        note: 'Score based on prosodic entropy analysis via wav2vec2 speech encoder',
      },
      type: 'audio',
    });
  } catch (error) {
    console.error('Audio detection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}