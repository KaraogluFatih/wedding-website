import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;
    const ok = password === process.env.ADMIN_UPLOAD_PASSWORD;
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
