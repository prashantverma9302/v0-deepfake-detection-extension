// app/api/detect/video/route.ts
import { NextResponse } from 'next/server';
import { detectVideoDeepfake } from '@/lib/models/videoModel';

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

    const result = await detectVideoDeepfake(buffer);

    // Map result to your response format
    const label = result[0]?.label || 'UNKNOWN';
    const score = result[0]?.score || 0;

    const verdict = label === 'REAL' ? 'authentic' : 'deepfake';
    const confidence = label === 'REAL' ? score : 1 - score;

    return NextResponse.json({
      verdict,
      confidence,
      scores: {
        fake: label === 'FAKE' ? score : 1 - score,
        real: label === 'REAL' ? score : 1 - score,
      },
      analysis: {
        // Add more analysis if available
      },
      type: 'video',
    });
  } catch (error) {
    console.error('Video detection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}