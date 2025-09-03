/**
 * MongoDB Models for Deadline Management System
 * 
 * This file defines the database collections and operations for the
 * anonymous deadline management system. Maintains anonymity protection
 * while tracking deadlines, reminders, and extensions.
 */

import { MongoClient, Collection, Db } from 'mongodb';
import { connectToDatabase } from '@synfind/database';
import {
  ReviewDeadline,
  ReminderLog,
  ExtensionRequest,
  DeadlineAnalytics
} from './index';

/**
 * Database collections for deadline management
 */
export interface DeadlineCollections {
  reviewDeadlines: Collection<ReviewDeadline>;
  reminderLogs: Collection<ReminderLog>;
  extensionRequests: Collection<ExtensionRequest>;
  deadlineAnalytics: Collection<DeadlineAnalytics>;
}

/**
 * Deadline database manager
 */
export class DeadlineDatabase {
  private db: Db | null = null;
  private collections: DeadlineCollections | null = null;

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    try {
      const { db } = await connectToDatabase();
      this.db = db;
      
      // Initialize collections
      this.collections = {
        reviewDeadlines: db.collection<ReviewDeadline>('review_deadlines'),
        reminderLogs: db.collection<ReminderLog>('reminder_logs'),
        extensionRequests: db.collection<ExtensionRequest>('extension_requests'),
        deadlineAnalytics: db.collection<DeadlineAnalytics>('deadline_analytics'),
      };

      // Create indexes for performance
      await this.createIndexes();
      
      console.log('Deadline database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize deadline database:', error);
      throw error;
    }
  }

  /**
   * Create database indexes for performance
   */
  private async createIndexes(): Promise<void> {
    if (!this.collections) throw new Error('Collections not initialized');

    try {
      // Review deadlines indexes
      await this.collections.reviewDeadlines.createIndexes([
        { key: { anonymousId: 1 } },
        { key: { reviewId: 1 }, unique: true },
        { key: { manuscriptId: 1 } },
        { key: { journalId: 1 } },
        { key: { status: 1 } },
        { key: { dueDate: 1 } },
        { key: { assignedDate: -1 } },
        { key: { completedDate: -1 } },
        // Compound indexes for common queries
        { key: { anonymousId: 1, status: 1 } },
        { key: { status: 1, dueDate: 1 } },
        { key: { journalId: 1, status: 1 } }
      ]);

      // Reminder logs indexes
      await this.collections.reminderLogs.createIndexes([
        { key: { anonymousId: 1 } },
        { key: { type: 1 } },
        { key: { sentDate: -1 } },
        { key: { acknowledged: 1 } },
        { key: { daysBeforeDue: 1 } },
        // Compound indexes
        { key: { anonymousId: 1, sentDate: -1 } },
        { key: { type: 1, sentDate: -1 } }
      ]);

      // Extension requests indexes
      await this.collections.extensionRequests.createIndexes([
        { key: { anonymousId: 1 } },
        { key: { reviewId: 1 } },
        { key: { status: 1 } },
        { key: { requestDate: -1 } },
        { key: { reviewedDate: -1 } },
        // Compound indexes
        { key: { status: 1, requestDate: -1 } },
        { key: { anonymousId: 1, status: 1 } }
      ]);

      // Analytics indexes
      await this.collections.deadlineAnalytics.createIndexes([
        { key: { anonymousId: 1 }, unique: true },
        { key: { performanceScore: -1 } },
        { key: { totalReviewsCompleted: -1 } },
        { key: { onTimeCompletionRate: -1 } }
      ]);

      console.log('Deadline database indexes created successfully');
    } catch (error) {
      console.error('Failed to create deadline database indexes:', error);
      throw error;
    }
  }

  /**
   * Get collections (ensure initialized)
   */
  getCollections(): DeadlineCollections {
    if (!this.collections) {
      throw new Error('Deadline database not initialized. Call initialize() first.');
    }
    return this.collections;
  }

  /**
   * Create review deadline
   */
  async createReviewDeadline(deadline: ReviewDeadline): Promise<string> {
    const collections = this.getCollections();
    
    try {
      const result = await collections.reviewDeadlines.insertOne(deadline);
      return result.insertedId.toString();
    } catch (error) {
      console.error('Failed to create review deadline:', error);
      throw error;
    }
  }

  /**
   * Find review deadline by review ID
   */
  async findDeadlineByReviewId(reviewId: string): Promise<ReviewDeadline | null> {
    const collections = this.getCollections();
    
    try {
      return await collections.reviewDeadlines.findOne({ reviewId });
    } catch (error) {
      console.error('Failed to find deadline by review ID:', error);
      throw error;
    }
  }

  /**
   * Find deadlines by anonymous ID
   */
  async findDeadlinesByAnonymousId(anonymousId: string): Promise<ReviewDeadline[]> {
    const collections = this.getCollections();
    
    try {
      return await collections.reviewDeadlines
        .find({ anonymousId })
        .sort({ assignedDate: -1 })
        .toArray();
    } catch (error) {
      console.error('Failed to find deadlines by anonymous ID:', error);
      throw error;
    }
  }

  /**
   * Find deadlines that need reminders
   */
  async findDeadlinesNeedingReminders(): Promise<ReviewDeadline[]> {
    const collections = this.getCollections();
    
    try {
      const now = new Date();
      const reminderThresholds = [1, 3, 7, 14]; // days before due date
      
      return await collections.reviewDeadlines
        .find({
          status: { $in: ['active', 'extended'] },
          dueDate: { $gte: now }, // not overdue yet
        })
        .toArray();
    } catch (error) {
      console.error('Failed to find deadlines needing reminders:', error);
      throw error;
    }
  }

  /**
   * Find overdue deadlines
   */
  async findOverdueDeadlines(): Promise<ReviewDeadline[]> {
    const collections = this.getCollections();
    
    try {
      const now = new Date();
      return await collections.reviewDeadlines
        .find({
          status: { $in: ['active', 'extended', 'overdue'] },
          dueDate: { $lt: now },
        })
        .sort({ dueDate: 1 })
        .toArray();
    } catch (error) {
      console.error('Failed to find overdue deadlines:', error);
      throw error;
    }
  }

  /**
   * Update deadline status
   */
  async updateDeadlineStatus(reviewId: string, status: ReviewDeadline['status'], completedDate?: Date): Promise<void> {
    const collections = this.getCollections();
    
    try {
      const updateDoc: any = { status };
      if (completedDate) {
        updateDoc.completedDate = completedDate;
      }

      await collections.reviewDeadlines.updateOne(
        { reviewId },
        { $set: updateDoc }
      );
    } catch (error) {
      console.error('Failed to update deadline status:', error);
      throw error;
    }
  }

  /**
   * Update deadline due date (for extensions)
   */
  async updateDeadlineDueDate(reviewId: string, newDueDate: Date, extensionsGranted?: number): Promise<void> {
    const collections = this.getCollections();
    
    try {
      const updateDoc: any = { dueDate: newDueDate };
      if (extensionsGranted !== undefined) {
        updateDoc.extensionsGranted = extensionsGranted;
      }

      await collections.reviewDeadlines.updateOne(
        { reviewId },
        { $set: updateDoc }
      );
    } catch (error) {
      console.error('Failed to update deadline due date:', error);
      throw error;
    }
  }

  /**
   * Create reminder log
   */
  async createReminderLog(reminderLog: ReminderLog): Promise<string> {
    const collections = this.getCollections();
    
    try {
      const result = await collections.reminderLogs.insertOne(reminderLog);
      
      // Also update the deadline's reminder log
      await collections.reviewDeadlines.updateOne(
        { anonymousId: reminderLog.anonymousId },
        { $push: { remindersSent: reminderLog } }
      );
      
      return result.insertedId.toString();
    } catch (error) {
      console.error('Failed to create reminder log:', error);
      throw error;
    }
  }

  /**
   * Acknowledge reminder
   */
  async acknowledgeReminder(reminderId: string, anonymousId: string): Promise<void> {
    const collections = this.getCollections();
    
    try {
      const acknowledgedDate = new Date();
      
      await collections.reminderLogs.updateOne(
        { id: reminderId, anonymousId },
        { 
          $set: { 
            acknowledged: true, 
            acknowledgedDate 
          } 
        }
      );

      // Also update in the deadline's embedded reminder log
      await collections.reviewDeadlines.updateOne(
        { anonymousId, 'remindersSent.id': reminderId },
        { 
          $set: {
            'remindersSent.$.acknowledged': true,
            'remindersSent.$.acknowledgedDate': acknowledgedDate
          }
        }
      );
    } catch (error) {
      console.error('Failed to acknowledge reminder:', error);
      throw error;
    }
  }

  /**
   * Create extension request
   */
  async createExtensionRequest(extensionRequest: ExtensionRequest): Promise<string> {
    const collections = this.getCollections();
    
    try {
      const result = await collections.extensionRequests.insertOne(extensionRequest);
      return result.insertedId.toString();
    } catch (error) {
      console.error('Failed to create extension request:', error);
      throw error;
    }
  }

  /**
   * Find extension requests by status
   */
  async findExtensionRequestsByStatus(status: ExtensionRequest['status']): Promise<ExtensionRequest[]> {
    const collections = this.getCollections();
    
    try {
      return await collections.extensionRequests
        .find({ status })
        .sort({ requestDate: -1 })
        .toArray();
    } catch (error) {
      console.error('Failed to find extension requests by status:', error);
      throw error;
    }
  }

  /**
   * Update extension request status
   */
  async updateExtensionRequestStatus(
    requestId: string,
    status: ExtensionRequest['status'],
    reviewedBy?: string,
    reviewerComment?: string
  ): Promise<void> {
    const collections = this.getCollections();
    
    try {
      const updateDoc: any = { 
        status,
        reviewedDate: new Date()
      };
      
      if (reviewedBy) updateDoc.reviewedBy = reviewedBy;
      if (reviewerComment) updateDoc.reviewerComment = reviewerComment;

      await collections.extensionRequests.updateOne(
        { id: requestId },
        { $set: updateDoc }
      );
    } catch (error) {
      console.error('Failed to update extension request status:', error);
      throw error;
    }
  }

  /**
   * Get deadline statistics for anonymous reviewer
   */
  async getAnonymousDeadlineStats(anonymousId: string): Promise<DeadlineAnalytics | null> {
    const collections = this.getCollections();
    
    try {
      return await collections.deadlineAnalytics.findOne({ anonymousId });
    } catch (error) {
      console.error('Failed to get anonymous deadline stats:', error);
      throw error;
    }
  }

  /**
   * Update deadline analytics
   */
  async updateDeadlineAnalytics(analytics: DeadlineAnalytics): Promise<void> {
    const collections = this.getCollections();
    
    try {
      await collections.deadlineAnalytics.updateOne(
        { anonymousId: analytics.anonymousId },
        { $set: analytics },
        { upsert: true }
      );
    } catch (error) {
      console.error('Failed to update deadline analytics:', error);
      throw error;
    }
  }

  /**
   * Get journal deadline performance
   */
  async getJournalPerformanceStats(journalId: string): Promise<{
    averageCompletionTime: number;
    onTimeRate: number;
    extensionRate: number;
    overdueRate: number;
    totalReviews: number;
  }> {
    const collections = this.getCollections();
    
    try {
      const pipeline = [
        { $match: { journalId } },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            completedReviews: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            onTimeCompletions: {
              $sum: { 
                $cond: [
                  { 
                    $and: [
                      { $eq: ['$status', 'completed'] },
                      { $lte: ['$completedDate', '$originalDueDate'] }
                    ]
                  }, 
                  1, 
                  0
                ]
              }
            },
            extensionsGranted: {
              $sum: { $cond: [{ $gt: ['$extensionsGranted', 0] }, 1, 0] }
            },
            overdueReviews: {
              $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
            },
            averageCompletionDays: {
              $avg: {
                $cond: [
                  { $and: ['$completedDate', '$assignedDate'] },
                  {
                    $divide: [
                      { $subtract: ['$completedDate', '$assignedDate'] },
                      1000 * 60 * 60 * 24 // Convert to days
                    ]
                  },
                  null
                ]
              }
            }
          }
        }
      ];

      const results = await collections.reviewDeadlines.aggregate(pipeline).toArray();
      const stats = results[0] || {};

      return {
        averageCompletionTime: Math.round(stats.averageCompletionDays || 0),
        onTimeRate: Math.round((stats.onTimeCompletions / stats.completedReviews) * 100) || 0,
        extensionRate: Math.round((stats.extensionsGranted / stats.totalReviews) * 100) || 0,
        overdueRate: Math.round((stats.overdueReviews / stats.totalReviews) * 100) || 0,
        totalReviews: stats.totalReviews || 0,
      };
    } catch (error) {
      console.error('Failed to get journal performance stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old deadline records
   */
  async cleanupOldRecords(daysOld: number = 365): Promise<{
    deadlinesRemoved: number;
    remindersRemoved: number;
    requestsRemoved: number;
  }> {
    const collections = this.getCollections();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    try {
      const [deadlines, reminders, requests] = await Promise.all([
        collections.reviewDeadlines.deleteMany({
          status: 'completed',
          completedDate: { $lt: cutoffDate }
        }),
        collections.reminderLogs.deleteMany({
          sentDate: { $lt: cutoffDate }
        }),
        collections.extensionRequests.deleteMany({
          requestDate: { $lt: cutoffDate },
          status: { $in: ['approved', 'denied'] }
        })
      ]);

      return {
        deadlinesRemoved: deadlines.deletedCount || 0,
        remindersRemoved: reminders.deletedCount || 0,
        requestsRemoved: requests.deletedCount || 0,
      };
    } catch (error) {
      console.error('Failed to cleanup old records:', error);
      throw error;
    }
  }
}

// Singleton instance
export const deadlineDb = new DeadlineDatabase();

// Utility functions
export const initializeDeadlineDatabase = () => deadlineDb.initialize();
export const getDeadlineCollections = () => deadlineDb.getCollections();

export default deadlineDb;