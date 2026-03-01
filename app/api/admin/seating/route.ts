import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Seating } from '../../../lib/mongodb';

function authCheck(req: NextRequest): boolean {
  return req.headers.get('x-admin-password') === process.env.ADMIN_UPLOAD_PASSWORD;
}

export async function GET() {
  try {
    const db = await getDatabase();
    const seating = await db.collection<Seating>('seating').findOne({});
    return NextResponse.json(seating ?? { bride: '', groom: '', bridesSide: [], groomsSide: [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!authCheck(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { bride, groom, bridesSide, groomsSide } = body;
    const db = await getDatabase();
    await db.collection<Seating>('seating').replaceOne(
      {},
      { bride, groom, bridesSide, groomsSide },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
