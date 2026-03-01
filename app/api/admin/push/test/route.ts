import { NextRequest, NextResponse } from 'next/server';
import { sendPushToAll } from '../../../../lib/push';
import { getDatabase } from '../../../../lib/mongodb';

export async function POST(request: NextRequest) {
  const pw = request.headers.get('x-admin-password');
  if (pw !== process.env.ADMIN_UPLOAD_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const db = await getDatabase();
    const count = await db.collection('push_subscriptions').countDocuments();
    await sendPushToAll('🔔 Test-Benachrichtigung', 'Push-Nachrichten funktionieren!');
    return NextResponse.json({ ok: true, count });
  } catch (error) {
    console.error('Push test error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
