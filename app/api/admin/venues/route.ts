import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Venue } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

function authCheck(req: NextRequest): boolean {
  return req.headers.get('x-admin-password') === process.env.ADMIN_UPLOAD_PASSWORD;
}

export async function GET() {
  try {
    const db = await getDatabase();
    const items = await db.collection<Venue>('venues')
      .find({}).sort({ order: 1 }).toArray();
    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!authCheck(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { _id, ...update } = body;
    const db = await getDatabase();
    await db.collection<Venue>('venues').updateOne(
      { _id: new ObjectId(_id) },
      { $set: update }
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
