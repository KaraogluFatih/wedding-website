import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Photo } from '../../lib/mongodb';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

// GET all photos (public)
export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection<Photo>('photos');
    
    const photos = await collection
      .find({})
      .sort({ uploaded_at: -1 })
      .toArray();
    
    return NextResponse.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

// POST - Save photo metadata after upload (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin password
    const adminPassword = request.headers.get('x-admin-password');
    if (adminPassword !== process.env.ADMIN_UPLOAD_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Handle password verification request
    if (body.verify) {
      return NextResponse.json({ success: true });
    }
    
    const { key, url, filename, size } = body;

    if (!key || !url || !filename) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save metadata to MongoDB
    const db = await getDatabase();
    const collection = db.collection<Photo>('photos');

    const photo: Photo = {
      key,
      url,
      filename,
      size: size || 0,
      uploaded_at: new Date(),
    };

    const result = await collection.insertOne(photo);

    return NextResponse.json({ 
      success: true, 
      photo: { ...photo, _id: result.insertedId } 
    });
  } catch (error) {
    console.error('Error saving photo:', error);
    return NextResponse.json({ error: 'Failed to save photo' }, { status: 500 });
  }
}

// DELETE - Delete a photo (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check admin password
    const adminPassword = request.headers.get('x-admin-password');
    if (adminPassword !== process.env.ADMIN_UPLOAD_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 });
    }

    // Delete from Uploadthing
    try {
      await utapi.deleteFiles(key);
    } catch (error) {
      console.warn('Uploadthing deletion may have failed:', error);
    }

    // Delete from MongoDB
    const db = await getDatabase();
    const collection = db.collection<Photo>('photos');
    await collection.deleteOne({ key });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
