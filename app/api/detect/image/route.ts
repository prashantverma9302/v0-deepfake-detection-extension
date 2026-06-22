// app/api/detect/image/route.ts
import { NextResponse } from 'next/server';
import { detectImageDeepfake } from '@/lib/models/imageModel';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await detectImageDeepfake(buffer);

    // --- Updated label mapping logic ---
    const label = result[0]?.label || '';
    const score = result[0]?.score || 0;

    // Check if the label indicates a fake image
    const isFake = label.toLowerCase().includes('fake') || label === 'LABEL_1';
    const verdict = isFake ? 'deepfake' : 'authentic';
    const confidence = isFake ? score : 1 - score;

    return NextResponse.json({
      verdict,
      confidence,
      scores: {
        fake: isFake ? score : 1 - score,
        real: isFake ? 1 - score : score,
      },
      type: 'image',
    });
    // --- End of updated logic ---
  } catch (error) {
    console.error('Image detection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}