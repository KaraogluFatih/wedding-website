import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/mongodb';

function authCheck(req: NextRequest): boolean {
  return req.headers.get('x-admin-password') === process.env.ADMIN_UPLOAD_PASSWORD;
}

export async function POST(request: NextRequest) {
  if (!authCheck(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const subscription = await request.json();
    const db = await getDatabase();
    await db.collection('push_subscriptions').updateOne(
      { endpoint: subscription.endpoint },
      { $set: subscription },
      { upsert: true },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!authCheck(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { endpoint } = await request.json();
    const db = await getDatabase();
    await db.collection('push_subscriptions').deleteOne({ endpoint });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
