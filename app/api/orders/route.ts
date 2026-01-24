import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Order } from '../../lib/mongodb';

// GET all orders or a specific order by guest_name
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guestName = searchParams.get('guest_name');

    const db = await getDatabase();
    const collection = db.collection<Order>('orders');

    if (guestName) {
      // Get specific order
      const order = await collection.findOne({ guest_name: guestName });
      if (order) {
        return NextResponse.json({
          main_course: order.main_course,
          drink: order.drink,
        });
      }
      return NextResponse.json(null);
    } else {
      // Get all orders
      const orders = await collection.find({}).sort({ guest_name: 1 }).toArray();
      return NextResponse.json(orders);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST/PUT - Save or update an order (upsert)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guest_name, main_course, drink } = body;

    if (!guest_name) {
      return NextResponse.json({ error: 'guest_name is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<Order>('orders');

    const now = new Date();

    // Upsert: update if exists, insert if not
    const result = await collection.updateOne(
      { guest_name },
      {
        $set: {
          main_course,
          drink,
          updated_at: now,
        },
        $setOnInsert: {
          created_at: now,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error saving order:', error);
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
  }
}
