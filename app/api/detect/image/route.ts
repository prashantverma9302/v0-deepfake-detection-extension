// app/api/detect/image/route.ts
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