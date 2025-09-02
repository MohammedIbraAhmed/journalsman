import { Collection, Db, ObjectId } from 'mongodb';
import { User } from '@synfind/shared';

export interface UserDocument extends Omit<User, 'id'> {
  _id: ObjectId;
}

export class UserModel {
  private collection: Collection<UserDocument>;

  constructor(db: Db) {
    this.collection = db.collection<UserDocument>('users');
    this.createIndexes();
  }

  private async createIndexes() {
    try {
      // Ensure email is unique
      await this.collection.createIndex({ email: 1 }, { unique: true });
      // Index for publisher-specific queries (multi-tenancy)
      await this.collection.createIndex({ publisherId: 1 });
      // Index for ORCID lookups
      await this.collection.createIndex({ orcidId: 1 }, { sparse: true });
    } catch (error) {
      console.error('Failed to create user indexes:', error);
    }
  }

  async create(userData: Omit<User, 'id'>): Promise<User> {
    const now = new Date();
    const doc: Omit<UserDocument, '_id'> = {
      ...userData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(doc as UserDocument);
    
    return {
      id: result.insertedId.toString(),
      ...userData,
      createdAt: now,
      updatedAt: now,
    };
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.collection.findOne({ _id: new ObjectId(id) });
    if (!doc) return null;

    return {
      id: doc._id.toString(),
      ...doc,
    };
  }

  async findByEmail(email: string, publisherId?: string): Promise<User | null> {
    const query: any = { email };
    if (publisherId) {
      query.publisherId = publisherId;
    }

    const doc = await this.collection.findOne(query);
    if (!doc) return null;

    return {
      id: doc._id.toString(),
      ...doc,
    };
  }

  async updateById(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result) return null;

    return {
      id: result._id.toString(),
      ...result,
    };
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // Multi-tenant helper: get users for a specific publisher
  async findByPublisherId(publisherId: string, limit = 50, skip = 0): Promise<User[]> {
    const docs = await this.collection
      .find({ publisherId })
      .limit(limit)
      .skip(skip)
      .toArray();

    return docs.map(doc => ({
      id: doc._id.toString(),
      ...doc,
    }));
  }
}