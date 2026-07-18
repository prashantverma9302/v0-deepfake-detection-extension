// app/api/detect/video/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { detectVideoDeepfake } from '@/lib/models/videoModel';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { frames } = body;
    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json({ error: 'No frames provided' }, { status: 400 });
    }

    const result = await detectVideoDeepfake(frames);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Video detection error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}