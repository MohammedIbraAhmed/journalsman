import { MongoClient, Db } from 'mongodb';
import { config } from '@synfind/shared';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // In development, prefer to use cache to prevent connection churn
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!config.database.uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  try {
    const client = new MongoClient(config.database.uri, {
      // Modern connection options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    const db = client.db(config.database.name);

    // Test the connection
    await db.admin().ping();
    console.log('✅ Connected to MongoDB');

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('Disconnected from MongoDB');
  }
}