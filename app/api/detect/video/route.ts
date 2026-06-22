import { NextResponse } from 'next/server';
import { detectVideoDeepfake } from '@/lib/models/videoModel';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await detectVideoDeepfake(buffer);

    return NextResponse.json({
      verdict: result.fakeScore > 0.5 ? 'deepfake' : 'authentic',
      confidence: result.fakeScore > 0.5 ? result.fakeScore : result.realScore,
      scores: {
        fake: result.fakeScore,
        real: result.realScore,
      },
      analysis: {
        framesAnalyzed: result.framesAnalyzed,
        frameResults: result.frameResults,
      },
      type: 'video',
    });
  } catch (error) {
    console.error('Video detection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}