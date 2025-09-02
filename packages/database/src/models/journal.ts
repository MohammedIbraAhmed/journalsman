import { Collection, Db, ObjectId } from 'mongodb';
import { Journal } from '@synfind/shared';

export interface JournalDocument extends Omit<Journal, 'id'> {
  _id: ObjectId;
}

export class JournalModel {
  private collection: Collection<JournalDocument>;

  constructor(db: Db) {
    this.collection = db.collection<JournalDocument>('journals');
    this.createIndexes();
  }

  private async createIndexes() {
    try {
      // Index for publisher tenant queries
      await this.collection.createIndex({ publisherId: 1 });
      // Index for short name (URL slug)
      await this.collection.createIndex({ shortName: 1 }, { unique: true });
      // Index for subdomain
      await this.collection.createIndex({ subdomain: 1 }, { unique: true, sparse: true });
      // Index for custom domain
      await this.collection.createIndex({ customDomain: 1 }, { unique: true, sparse: true });
      // Index for journal status
      await this.collection.createIndex({ status: 1 });
      // Compound index for publisher + status queries
      await this.collection.createIndex({ publisherId: 1, status: 1 });
      // Index for editorial board members
      await this.collection.createIndex({ 'editorialBoard.userId': 1 });
      // Index for name searches
      await this.collection.createIndex({ name: 1 });
    } catch (error) {
      console.error('Failed to create journal indexes:', error);
    }
  }

  async create(journalData: Omit<Journal, 'id'>): Promise<Journal> {
    const now = new Date();
    
    // Initialize default statistics
    const defaultStatistics = {
      totalSubmissions: 0,
      acceptedSubmissions: 0,
      rejectedSubmissions: 0,
      averageReviewTime: 0,
      currentActiveSubmissions: 0,
      publishedArticles: 0,
      totalViews: 0,
      totalDownloads: 0,
      lastUpdated: now,
    };

    const doc: Omit<JournalDocument, '_id'> = {
      ...journalData,
      statistics: journalData.statistics || defaultStatistics,
      editorialBoard: journalData.editorialBoard || [],
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(doc as JournalDocument);
    
    return {
      id: result.insertedId.toString(),
      ...doc,
    };
  }

  async findById(id: string): Promise<Journal | null> {
    const doc = await this.collection.findOne({ _id: new ObjectId(id) });
    if (!doc) return null;

    return this.transformDocument(doc);
  }

  async findByShortName(shortName: string): Promise<Journal | null> {
    const doc = await this.collection.findOne({ shortName });
    if (!doc) return null;

    return this.transformDocument(doc);
  }

  async findBySubdomain(subdomain: string): Promise<Journal | null> {
    const doc = await this.collection.findOne({ subdomain });
    if (!doc) return null;

    return this.transformDocument(doc);
  }

  async findByCustomDomain(customDomain: string): Promise<Journal | null> {
    const doc = await this.collection.findOne({ customDomain });
    if (!doc) return null;

    return this.transformDocument(doc);
  }

  async findByPublisherId(publisherId: string, status?: string, limit = 50, skip = 0): Promise<Journal[]> {
    const query: any = { publisherId };
    if (status) {
      query.status = status;
    }

    const docs = await this.collection
      .find(query)
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map(doc => this.transformDocument(doc));
  }

  async findByEditorialBoardMember(userId: string): Promise<Journal[]> {
    const docs = await this.collection
      .find({ 'editorialBoard.userId': userId })
      .toArray();

    return docs.map(doc => this.transformDocument(doc));
  }

  async updateById(id: string, updates: Partial<Omit<Journal, 'id' | 'createdAt'>>): Promise<Journal | null> {
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

  async addEditorialBoardMember(journalId: string, member: any): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(journalId) },
      { 
        $addToSet: { editorialBoard: member },
        $set: { updatedAt: new Date() }
      }
    );

    return result.modifiedCount > 0;
  }

  async removeEditorialBoardMember(journalId: string, userId: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(journalId) },
      { 
        $pull: { editorialBoard: { userId } },
        $set: { updatedAt: new Date() }
      }
    );

    return result.modifiedCount > 0;
  }

  async updateEditorialBoardMember(journalId: string, userId: string, updates: any): Promise<boolean> {
    const result = await this.collection.updateOne(
      { 
        _id: new ObjectId(journalId),
        'editorialBoard.userId': userId 
      },
      { 
        $set: { 
          'editorialBoard.$': { ...updates, userId },
          updatedAt: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  }

  async updateStatistics(journalId: string, statisticsUpdate: Partial<any>): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(journalId) },
      { 
        $set: { 
          ...Object.entries(statisticsUpdate).reduce((acc, [key, value]) => {
            acc[`statistics.${key}`] = value;
            return acc;
          }, {} as any),
          'statistics.lastUpdated': new Date(),
          updatedAt: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  }

  async incrementStatistic(journalId: string, field: string, increment = 1): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(journalId) },
      { 
        $inc: { [`statistics.${field}`]: increment },
        $set: { 
          'statistics.lastUpdated': new Date(),
          updatedAt: new Date() 
        }
      }
    );

    return result.modifiedCount > 0;
  }

  async updateJournalStatus(id: string, status: 'draft' | 'active' | 'suspended' | 'archived'): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status,
          updatedAt: new Date() 
        }
      }
    );

    return result.modifiedCount > 0;
  }

  async searchJournalsByName(searchTerm: string, publisherId?: string, limit = 20): Promise<Journal[]> {
    const query: any = {
      name: { $regex: searchTerm, $options: 'i' }
    };

    if (publisherId) {
      query.publisherId = publisherId;
    }

    const docs = await this.collection
      .find(query)
      .limit(limit)
      .toArray();

    return docs.map(doc => this.transformDocument(doc));
  }

  async getJournalCount(publisherId: string, status?: string): Promise<number> {
    const query: any = { publisherId };
    if (status) {
      query.status = status;
    }

    return await this.collection.countDocuments(query);
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  private transformDocument(doc: JournalDocument): Journal {
    return {
      id: doc._id.toString(),
      publisherId: doc.publisherId,
      name: doc.name,
      shortName: doc.shortName,
      description: doc.description,
      subdomain: doc.subdomain,
      customDomain: doc.customDomain,
      branding: doc.branding,
      configuration: doc.configuration,
      editorialBoard: doc.editorialBoard,
      statistics: doc.statistics,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}