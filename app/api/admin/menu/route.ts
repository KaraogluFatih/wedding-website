import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, MenuItem } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

function authCheck(req: NextRequest): boolean {
  return req.headers.get('x-admin-password') === process.env.ADMIN_UPLOAD_PASSWORD;
}

export async function GET() {
  try {
    const db = await getDatabase();
    const items = await db.collection<MenuItem>('menu_items')
      .find({}).sort({ type: 1, category: 1, order: 1 }).toArray();
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
    const col = db.collection<MenuItem>('menu_items');
    const maxItem = await col.find({ type: body.type }).sort({ order: -1 }).limit(1).toArray();
    const maxOrder = maxItem.length > 0 ? maxItem[0].order + 1 : 0;
    // Generate slug from name if id not provided
    const id = body.id || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const item: MenuItem = {
      type: body.type,
      category: body.category,
      id,
      name: body.name,
      description: body.description ?? '',
      order: body.order ?? maxOrder,
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
    // Never allow changing the id slug
    const { _id, id: _ignoredId, ...update } = body;
    const db = await getDatabase();
    await db.collection<MenuItem>('menu_items').updateOne(
      { _id: new ObjectId(_id) },
      { $set: update }
    );
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
    await db.collection('menu_items').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
