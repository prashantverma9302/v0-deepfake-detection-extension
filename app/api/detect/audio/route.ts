import { NextResponse } from 'next/server';
import { detectAudioDeepfake } from '@/lib/models/audioModel';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate it's audio
    const fileName = (file as File).name || '';
    const validExtensions = ['.wav', '.mp3', '.ogg', '.flac', '.m4a'];
    const hasValidExt = validExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    if (!hasValidExt && file.type && !file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'File must be an audio file' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
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
}// app/api/detect/image/route.ts
import { NextResponse } from 'next/server';
import { detectImageDeepfake } from '@/lib/models/imageModel';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64, imageUrl } = body;

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json(
        { error: 'No image provided. Send imageBase64 or imageUrl.' },
        { status: 400 }
      );
    }

    let buffer: Buffer;

    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
      buffer = Buffer.from(await res.arrayBuffer());
    }

    const result = await detectImageDeepfake(buffer);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Image detection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}