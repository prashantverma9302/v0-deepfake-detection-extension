// app/api/detect/video/route.ts
import { NextResponse } from 'next/server';
import { detectVideoDeepfake } from '@/lib/models/videoModel';

export async function POST(request: Request) {
  try {
    const { frames } = await request.json();
    if (!frames?.length) {
      return NextResponse.json({ error: 'No frames provided' }, { status: 400 });
    }
    const result = await detectVideoDeepfake(frames);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Video detection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}