import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, ScheduleItem } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

function authCheck(req: NextRequest): boolean {
  return req.headers.get('x-admin-password') === process.env.ADMIN_UPLOAD_PASSWORD;
}

export async function GET() {
  try {
    const db = await getDatabase();
    const items = await db.collection<ScheduleItem>('schedule')
      .find({}).sort({ order: 1 }).toArray();
    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!authCheck(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const db = await getDatabase();
    const col = db.collection<ScheduleItem>('schedule');
    const maxItem = await col.find({}).sort({ order: -1 }).limit(1).toArray();
    const maxOrder = maxItem.length > 0 ? maxItem[0].order + 1 : 0;
    const item: ScheduleItem = {
      order: body.order ?? maxOrder,
      time: body.time ?? '',
      event: body.event ?? '',
      emoji: body.emoji ?? '📅',
      isBreak: body.isBreak ?? false,
    };
    const result = await col.insertOne(item);
    return NextResponse.json({ ...item, _id: result.insertedId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!authCheck(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const db = await getDatabase();
    const col = db.collection<ScheduleItem>('schedule');

    // Bulk reorder: { items: [{_id, order}] }
    if (body.items) {
      for (const item of body.items) {
        await col.updateOne({ _id: new ObjectId(item._id) }, { $set: { order: item.order } });
      }
      return NextResponse.json({ ok: true });
    }

    const { _id, ...update } = body;
    await col.updateOne({ _id: new ObjectId(_id) }, { $set: update });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!authCheck(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const db = await getDatabase();
    await db.collection('schedule').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
