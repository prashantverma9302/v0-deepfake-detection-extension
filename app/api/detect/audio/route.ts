// app/api/detect/audio/route.ts
import { NextResponse } from 'next/server';
import { detectAudioDeepfake } from '@/lib/models/audioModel';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await detectAudioDeepfake(buffer);

    // Map result to your response format
    const label = result[0]?.label || 'UNKNOWN';
    const score = result[0]?.score || 0;

    const verdict = label === 'real' ? 'authentic' : 'deepfake';
    const confidence = label === 'real' ? score : 1 - score;

    return NextResponse.json({
      verdict,
      confidence,
      scores: {
        fake: label === 'fake' ? score : 1 - score,
        real: label === 'real' ? score : 1 - score,
      },
      analysis: {
        // Add more analysis if available
      },
      type: 'audio',
    });
  } catch (error) {
    console.error('Audio detection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}