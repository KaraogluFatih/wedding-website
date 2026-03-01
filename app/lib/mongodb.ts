import { MongoClient, Db, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error('Please add your MongoDB URI to .env.local');
  }

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    return globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    if (!clientPromise) {
      client = new MongoClient(uri, options);
      clientPromise = client.connect();
    }
    return clientPromise;
  }
}

export default getClientPromise;

export async function getDatabase(): Promise<Db> {
  const client = await getClientPromise();
  return client.db('wedding');
}

// Order interface
export interface Order {
  _id?: string;
  guest_name: string;
  main_course: string | null;
  drink: string | null;
  created_at: Date;
  updated_at: Date;
}

// Photo interface
export interface Photo {
  _id?: string;
  key: string;            // Uploadthing file key
  url: string;            // Uploadthing URL
  filename: string;
  size: number;
  uploaded_at: Date;
}

// Schedule/Timeline interface
export interface ScheduleItem {
  _id?: ObjectId;
  order: number;
  time: string;
  event: string;
  emoji: string;
  isBreak: boolean;
}

// Venue/Location interface
export interface Venue {
  _id?: ObjectId;
  order: number;
  name: string;
  subtitle: string;
  address: string;
  city: string;
  mapsUrl: string;
  embedUrl: string;
}

// Menu item interface
export interface MenuItem {
  _id?: ObjectId;
  type: 'food' | 'drink';
  category: string;
  id: string;             // slug used in orders — never change after seeding
  name: string;
  description: string;
  order: number;
}

// Guest interface
export interface Guest {
  _id?: ObjectId;
  name: string;
  family: string;
  order: number;
}

// Seating arrangement interface (single document)
export interface Seating {
  _id?: ObjectId;
  bride: string;
  groom: string;
  bridesSide: string[];
  groomsSide: string[];
}
