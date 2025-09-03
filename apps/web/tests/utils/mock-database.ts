/**
 * Mock Database Server for Testing
 * 
 * Provides in-memory MongoDB instance for integration testing
 */

import { vi } from 'vitest';

export class MockMongoMemoryServer {
  private db: any = null;

  async start(): Promise<void> {
    // Simplified mock database - no actual MongoDB server needed
    this.db = {
      collection: (name: string) => createMockCollection([]),
    };
    console.log('Mock database initialized (simplified)');
  }

  async stop(): Promise<void> {
    this.db = null;
    console.log('Mock database stopped');
  }

  getDb(): any {
    if (!this.db) {
      throw new Error('Database not initialized. Call start() first.');
    }
    return this.db;
  }

  getCollection<T = any>(name: string): any {
    return this.getDb().collection(name);
  }

  private async initializeCollections(): Promise<void> {
    if (!this.db) return;

    // Anonymous reviewer collections
    const anonymousReviewers = this.db.collection('anonymous_reviewers');
    await anonymousReviewers.createIndexes([
      { key: { anonymousId: 1 }, unique: true },
      { key: { email: 1 } },
      { key: { journalId: 1 } },
      { key: { manuscriptId: 1 } },
    ]);

    const anonymousSessions = this.db.collection('anonymous_sessions');
    await anonymousSessions.createIndexes([
      { key: { anonymousId: 1 } },
      { key: { sessionToken: 1 }, unique: true },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
    ]);

    const anonymityAuditTrail = this.db.collection('anonymity_audit_trail');
    await anonymityAuditTrail.createIndexes([
      { key: { anonymousId: 1 } },
      { key: { action: 1 } },
      { key: { timestamp: -1 } },
    ]);

    // Deadline management collections
    const reviewDeadlines = this.db.collection('review_deadlines');
    await reviewDeadlines.createIndexes([
      { key: { anonymousId: 1 } },
      { key: { reviewId: 1 }, unique: true },
      { key: { manuscriptId: 1 } },
      { key: { journalId: 1 } },
      { key: { status: 1 } },
      { key: { dueDate: 1 } },
      { key: { assignedDate: -1 } },
      { key: { completedDate: -1 } },
    ]);

    const reminderLogs = this.db.collection('reminder_logs');
    await reminderLogs.createIndexes([
      { key: { anonymousId: 1 } },
      { key: { type: 1 } },
      { key: { sentDate: -1 } },
      { key: { acknowledged: 1 } },
    ]);

    const extensionRequests = this.db.collection('extension_requests');
    await extensionRequests.createIndexes([
      { key: { anonymousId: 1 } },
      { key: { reviewId: 1 } },
      { key: { status: 1 } },
      { key: { requestDate: -1 } },
    ]);

    const deadlineAnalytics = this.db.collection('deadline_analytics');
    await deadlineAnalytics.createIndexes([
      { key: { anonymousId: 1 }, unique: true },
      { key: { performanceScore: -1 } },
    ]);

    // Quality management collections
    const qualityMetrics = this.db.collection('quality_metrics');
    await qualityMetrics.createIndexes([
      { key: { anonymousId: 1 } },
      { key: { reviewId: 1 }, unique: true },
      { key: { journalId: 1 } },
      { key: { submissionDate: -1 } },
      { key: { overallScore: -1 } },
    ]);

    const performanceAnalytics = this.db.collection('performance_analytics');
    await performanceAnalytics.createIndexes([
      { key: { anonymousId: 1 }, unique: true },
      { key: { overallPerformanceScore: -1 } },
      { key: { lastUpdated: -1 } },
    ]);

    const satisfactionSurveys = this.db.collection('satisfaction_surveys');
    await satisfactionSurveys.createIndexes([
      { key: { anonymousId: 1 } },
      { key: { reviewId: 1 } },
      { key: { submissionDate: -1 } },
    ]);

    console.log('Mock database collections initialized successfully');
  }

  /**
   * Seed database with test data
   */
  async seedTestData(): Promise<void> {
    if (!this.db) return;

    // Seed anonymous reviewers
    await this.db.collection('anonymous_reviewers').insertMany([
      {
        anonymousId: 'ANR_test_123',
        email: 'reviewer1@example.com',
        journalId: 'journal_test',
        manuscriptId: 'manuscript_test',
        createdAt: new Date(),
        isActive: true,
      },
      {
        anonymousId: 'ANR_test_456',
        email: 'reviewer2@example.com',
        journalId: 'journal_test',
        manuscriptId: 'manuscript_test2',
        createdAt: new Date(),
        isActive: true,
      },
    ]);

    // Seed review deadlines
    await this.db.collection('review_deadlines').insertMany([
      {
        id: 'deadline_1',
        anonymousId: 'ANR_test_123',
        reviewId: 'review_test_1',
        manuscriptId: 'manuscript_test',
        journalId: 'journal_test',
        assignedDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-22'),
        originalDueDate: new Date('2024-01-22'),
        extensionsGranted: 0,
        maxExtensions: 2,
        remindersSent: [],
        status: 'active',
        anonymityProtected: true,
      },
    ]);

    // Seed quality metrics
    await this.db.collection('quality_metrics').insertMany([
      {
        id: 'quality_1',
        anonymousId: 'ANR_test_123',
        reviewId: 'review_test_1',
        manuscriptId: 'manuscript_test',
        journalId: 'journal_test',
        submissionDate: new Date(),
        metrics: {
          comprehensivenessScore: 85,
          timelinessScore: 90,
          clarityScore: 88,
          constructivenessScore: 92,
        },
        overallScore: 88.75,
        editorRating: 4.2,
      },
    ]);

    console.log('Test data seeded successfully');
  }

  /**
   * Clear all test data
   */
  async clearTestData(): Promise<void> {
    if (!this.db) return;

    const collections = [
      'anonymous_reviewers',
      'anonymous_sessions',
      'anonymity_audit_trail',
      'review_deadlines',
      'reminder_logs',
      'extension_requests',
      'deadline_analytics',
      'quality_metrics',
      'performance_analytics',
      'satisfaction_surveys',
    ];

    await Promise.all(
      collections.map(collection => 
        this.db!.collection(collection).deleteMany({})
      )
    );

    console.log('Test data cleared successfully');
  }
}

/**
 * Mock database operations factory
 */
export function createMockDbOperations() {
  const mockOperations = {
    // Find operations
    findOne: vi.fn(),
    findMany: vi.fn(),
    find: vi.fn(() => ({
      toArray: vi.fn(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
    })),

    // Insert operations
    insertOne: vi.fn(() => ({ 
      insertedId: 'mock_id',
      acknowledged: true 
    })),
    insertMany: vi.fn(() => ({ 
      insertedIds: ['mock_id_1', 'mock_id_2'],
      acknowledged: true 
    })),

    // Update operations
    updateOne: vi.fn(() => ({ 
      modifiedCount: 1,
      matchedCount: 1,
      acknowledged: true 
    })),
    updateMany: vi.fn(() => ({ 
      modifiedCount: 2,
      matchedCount: 2,
      acknowledged: true 
    })),

    // Delete operations
    deleteOne: vi.fn(() => ({ 
      deletedCount: 1,
      acknowledged: true 
    })),
    deleteMany: vi.fn(() => ({ 
      deletedCount: 3,
      acknowledged: true 
    })),

    // Aggregation
    aggregate: vi.fn(() => ({
      toArray: vi.fn(() => []),
    })),

    // Index operations
    createIndex: vi.fn(),
    createIndexes: vi.fn(),
    dropIndex: vi.fn(),

    // Collection operations
    countDocuments: vi.fn(() => 0),
    distinct: vi.fn(() => []),
  };

  return mockOperations;
}

/**
 * Create mock collection with common operations
 */
export function createMockCollection<T = any>(initialData: T[] = []) {
  let data = [...initialData];

  const mockCollection = {
    // Data storage
    _data: data,

    // Find operations
    findOne: vi.fn((query: any) => {
      const result = data.find(item => {
        return Object.keys(query).every(key => 
          (item as any)[key] === query[key]
        );
      });
      return Promise.resolve(result || null);
    }),

    find: vi.fn((query: any = {}) => ({
      toArray: vi.fn(() => {
        const results = data.filter(item => {
          return Object.keys(query).every(key => 
            (item as any)[key] === query[key]
          );
        });
        return Promise.resolve(results);
      }),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
    })),

    // Insert operations
    insertOne: vi.fn((doc: T) => {
      const newDoc = { ...doc, _id: `mock_${Date.now()}` };
      data.push(newDoc as T);
      return Promise.resolve({ 
        insertedId: (newDoc as any)._id,
        acknowledged: true 
      });
    }),

    insertMany: vi.fn((docs: T[]) => {
      const newDocs = docs.map((doc, i) => ({ 
        ...doc, 
        _id: `mock_${Date.now()}_${i}` 
      }));
      data.push(...newDocs as T[]);
      return Promise.resolve({ 
        insertedIds: newDocs.map(d => (d as any)._id),
        acknowledged: true 
      });
    }),

    // Update operations
    updateOne: vi.fn((query: any, update: any) => {
      const index = data.findIndex(item => {
        return Object.keys(query).every(key => 
          (item as any)[key] === query[key]
        );
      });
      
      if (index !== -1) {
        data[index] = { ...data[index], ...update.$set };
        return Promise.resolve({ 
          modifiedCount: 1,
          matchedCount: 1,
          acknowledged: true 
        });
      }
      
      return Promise.resolve({ 
        modifiedCount: 0,
        matchedCount: 0,
        acknowledged: true 
      });
    }),

    // Delete operations
    deleteOne: vi.fn((query: any) => {
      const index = data.findIndex(item => {
        return Object.keys(query).every(key => 
          (item as any)[key] === query[key]
        );
      });
      
      if (index !== -1) {
        data.splice(index, 1);
        return Promise.resolve({ 
          deletedCount: 1,
          acknowledged: true 
        });
      }
      
      return Promise.resolve({ 
        deletedCount: 0,
        acknowledged: true 
      });
    }),

    deleteMany: vi.fn((query: any) => {
      const initialLength = data.length;
      data = data.filter(item => {
        return !Object.keys(query).every(key => 
          (item as any)[key] === query[key]
        );
      });
      
      return Promise.resolve({ 
        deletedCount: initialLength - data.length,
        acknowledged: true 
      });
    }),

    // Index operations
    createIndex: vi.fn(),
    createIndexes: vi.fn(),

    // Count
    countDocuments: vi.fn((query: any = {}) => {
      const count = data.filter(item => {
        return Object.keys(query).every(key => 
          (item as any)[key] === query[key]
        );
      }).length;
      return Promise.resolve(count);
    }),

    // Aggregation
    aggregate: vi.fn(() => ({
      toArray: vi.fn(() => Promise.resolve([])),
    })),

    // Reset data
    _reset: () => {
      data = [...initialData];
    },

    // Get current data
    _getData: () => [...data],
  };

  return mockCollection;
}