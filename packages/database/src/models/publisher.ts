import { Collection, Db, ObjectId } from 'mongodb';
import { Publisher } from '@synfind/shared';

export interface PublisherDocument extends Omit<Publisher, 'id'> {
  _id: ObjectId;
}

export class PublisherModel {
  private collection: Collection<PublisherDocument>;

  constructor(db: Db) {
    this.collection = db.collection<PublisherDocument>('publishers');
    this.createIndexes();
  }

  private async createIndexes() {
    try {
      // Ensure domain is unique
      await this.collection.createIndex({ domain: 1 }, { unique: true });
      // Index for name searches
      await this.collection.createIndex({ name: 1 });
      // Index for admin users
      await this.collection.createIndex({ adminUsers: 1 });
      // Index for institutional verification status
      await this.collection.createIndex({ 'institutionalDetails.verification.status': 1 });
      // Index for billing status
      await this.collection.createIndex({ 'billingInfo.isActive': 1 });
    } catch (error) {
      console.error('Failed to create publisher indexes:', error);
    }
  }

  async create(publisherData: Omit<Publisher, 'id'>): Promise<Publisher> {
    const now = new Date();
    const doc: Omit<PublisherDocument, '_id'> = {
      ...publisherData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(doc as PublisherDocument);
    
    return {
      id: result.insertedId.toString(),
      ...publisherData,
      createdAt: now,
      updatedAt: now,
    };
  }

  async findById(id: string): Promise<Publisher | null> {
    const doc = await this.collection.findOne({ _id: new ObjectId(id) });
    if (!doc) return null;

    return this.transformDocument(doc);
  }

  async findByDomain(domain: string): Promise<Publisher | null> {
    const doc = await this.collection.findOne({ domain });
    if (!doc) return null;

    return this.transformDocument(doc);
  }

  async findByAdminUser(userId: string): Promise<Publisher[]> {
    const docs = await this.collection
      .find({ adminUsers: userId })
      .toArray();

    return docs.map(doc => this.transformDocument(doc));
  }

  async updateById(id: string, updates: Partial<Omit<Publisher, 'id' | 'createdAt'>>): Promise<Publisher | null> {
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

    return this.transformDocument(result);
  }

  async addAdminUser(publisherId: string, userId: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(publisherId) },
      { 
        $addToSet: { adminUsers: userId },
        $set: { updatedAt: new Date() }
      }
    );

    return result.modifiedCount > 0;
  }

  async removeAdminUser(publisherId: string, userId: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(publisherId) },
      { 
        $pull: { adminUsers: userId },
        $set: { updatedAt: new Date() }
      }
    );

    return result.modifiedCount > 0;
  }

  async addJournal(publisherId: string, journalId: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(publisherId) },
      { 
        $addToSet: { journals: journalId },
        $set: { updatedAt: new Date() }
      }
    );

    return result.modifiedCount > 0;
  }

  async removeJournal(publisherId: string, journalId: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(publisherId) },
      { 
        $pull: { journals: journalId },
        $set: { updatedAt: new Date() }
      }
    );

    return result.modifiedCount > 0;
  }

  async findVerifiedPublishers(limit = 50, skip = 0): Promise<Publisher[]> {
    const docs = await this.collection
      .find({ 'institutionalDetails.verification.status': 'verified' })
      .limit(limit)
      .skip(skip)
      .toArray();

    return docs.map(doc => this.transformDocument(doc));
  }

  async findActivePublishers(limit = 50, skip = 0): Promise<Publisher[]> {
    const docs = await this.collection
      .find({ 'billingInfo.isActive': true })
      .limit(limit)
      .skip(skip)
      .toArray();

    return docs.map(doc => this.transformDocument(doc));
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async findAll(limit = 50, skip = 0): Promise<Publisher[]> {
    const docs = await this.collection
      .find({})
      .limit(limit)
      .skip(skip)
      .toArray();

    return docs.map(doc => this.transformDocument(doc));
  }

  private transformDocument(doc: PublisherDocument): Publisher {
    return {
      id: doc._id.toString(),
      name: doc.name,
      domain: doc.domain,
      institutionalDetails: doc.institutionalDetails,
      billingInfo: doc.billingInfo,
      settings: doc.settings,
      adminUsers: doc.adminUsers,
      journals: doc.journals,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}