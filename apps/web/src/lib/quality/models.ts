/**
 * MongoDB Models for Quality Management System
 * 
 * This file defines the database collections and operations for the
 * quality standards and scoring system. Maintains anonymity protection
 * while tracking performance, satisfaction, and improvement metrics.
 */

import { MongoClient, Collection, Db } from 'mongodb';
import { connectToDatabase } from '@synfind/database';
import {
  QualityMetrics,
  QualityStandards,
  PerformanceAnalytics,
  QualityImprovement,
  SatisfactionSurvey
} from './index';

/**
 * Database collections for quality management
 */
export interface QualityCollections {
  qualityMetrics: Collection<QualityMetrics>;
  qualityStandards: Collection<QualityStandards>;
  performanceAnalytics: Collection<PerformanceAnalytics>;
  qualityImprovements: Collection<QualityImprovement>;
  satisfactionSurveys: Collection<SatisfactionSurvey>;
}

/**
 * Quality database manager
 */
export class QualityDatabase {
  private db: Db | null = null;
  private collections: QualityCollections | null = null;

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    try {
      const { db } = await connectToDatabase();
      this.db = db;
      
      // Initialize collections
      this.collections = {
        qualityMetrics: db.collection<QualityMetrics>('quality_metrics'),
        qualityStandards: db.collection<QualityStandards>('quality_standards'),
        performanceAnalytics: db.collection<PerformanceAnalytics>('performance_analytics'),
        qualityImprovements: db.collection<QualityImprovement>('quality_improvements'),
        satisfactionSurveys: db.collection<SatisfactionSurvey>('satisfaction_surveys'),
      };

      // Create indexes for performance
      await this.createIndexes();
      
      console.log('Quality database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize quality database:', error);
      throw error;
    }
  }

  /**
   * Create database indexes for performance
   */
  private async createIndexes(): Promise<void> {
    if (!this.collections) throw new Error('Collections not initialized');

    try {
      // Quality metrics indexes
      await this.collections.qualityMetrics.createIndexes([
        { key: { anonymousId: 1 } },
        { key: { reviewId: 1 }, unique: true },
        { key: { manuscriptId: 1 } },
        { key: { journalId: 1 } },
        { key: { qualityScore: -1 } },
        { key: { completionTime: 1 } },
        { key: { timestamp: -1 } },
        // Compound indexes for analytics
        { key: { anonymousId: 1, timestamp: -1 } },
        { key: { journalId: 1, qualityScore: -1 } },
        { key: { journalId: 1, timestamp: -1 } },
        { key: { qualityScore: -1, timestamp: -1 } }
      ]);

      // Quality standards indexes
      await this.collections.qualityStandards.createIndexes([
        { key: { journalId: 1 }, unique: true }
      ]);

      // Performance analytics indexes
      await this.collections.performanceAnalytics.createIndexes([
        { key: { anonymousId: 1 }, unique: true },
        { key: { performanceLevel: 1 } },
        { key: { averageQualityScore: -1 } },
        { key: { totalReviewsCompleted: -1 } },
        { key: { onTimeCompletionRate: -1 } },
        { key: { 'anonymizedBenchmarks.percentileRank': -1 } }
      ]);

      // Quality improvements indexes
      await this.collections.qualityImprovements.createIndexes([
        { key: { anonymousId: 1 } },
        { key: { recommendationType: 1 } },
        { key: { priority: 1 } },
        { key: { timestamp: -1 } },
        { key: { estimatedImpact: -1 } },
        // Compound indexes
        { key: { anonymousId: 1, priority: 1 } },
        { key: { recommendationType: 1, priority: 1 } }
      ]);

      // Satisfaction surveys indexes
      await this.collections.satisfactionSurveys.createIndexes([
        { key: { anonymousId: 1 } },
        { key: { reviewId: 1 } },
        { key: { overallSatisfaction: -1 } },
        { key: { timestamp: -1 } },
        { key: { wouldRecommend: 1 } },
        // Compound indexes
        { key: { anonymousId: 1, timestamp: -1 } },
        { key: { overallSatisfaction: -1, timestamp: -1 } }
      ]);

      console.log('Quality database indexes created successfully');
    } catch (error) {
      console.error('Failed to create quality database indexes:', error);
      throw error;
    }
  }

  /**
   * Get collections (ensure initialized)
   */
  getCollections(): QualityCollections {
    if (!this.collections) {
      throw new Error('Quality database not initialized. Call initialize() first.');
    }
    return this.collections;
  }

  /**
   * Store quality metrics for a completed review
   */
  async storeQualityMetrics(metrics: QualityMetrics): Promise<string> {
    const collections = this.getCollections();
    
    try {
      const result = await collections.qualityMetrics.insertOne(metrics);
      return result.insertedId.toString();
    } catch (error) {
      console.error('Failed to store quality metrics:', error);
      throw error;
    }
  }

  /**
   * Get quality metrics for an anonymous reviewer
   */
  async getReviewerMetrics(anonymousId: string): Promise<QualityMetrics[]> {
    const collections = this.getCollections();
    
    try {
      return await collections.qualityMetrics
        .find({ anonymousId })
        .sort({ timestamp: -1 })
        .toArray();
    } catch (error) {
      console.error('Failed to get reviewer metrics:', error);
      throw error;
    }
  }

  /**
   * Get journal quality metrics for benchmarking
   */
  async getJournalMetrics(journalId: string, limit: number = 1000): Promise<QualityMetrics[]> {
    const collections = this.getCollections();
    
    try {
      return await collections.qualityMetrics
        .find({ journalId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Failed to get journal metrics:', error);
      throw error;
    }
  }

  /**
   * Get global quality metrics for benchmarking
   */
  async getGlobalMetrics(limit: number = 5000): Promise<QualityMetrics[]> {
    const collections = this.getCollections();
    
    try {
      return await collections.qualityMetrics
        .find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Failed to get global metrics:', error);
      throw error;
    }
  }

  /**
   * Store or update quality standards for a journal
   */
  async storeQualityStandards(standards: QualityStandards): Promise<void> {
    const collections = this.getCollections();
    
    try {
      await collections.qualityStandards.updateOne(
        { journalId: standards.journalId },
        { $set: standards },
        { upsert: true }
      );
    } catch (error) {
      console.error('Failed to store quality standards:', error);
      throw error;
    }
  }

  /**
   * Get quality standards for a journal
   */
  async getQualityStandards(journalId: string): Promise<QualityStandards | null> {
    const collections = this.getCollections();
    
    try {
      return await collections.qualityStandards.findOne({ journalId });
    } catch (error) {
      console.error('Failed to get quality standards:', error);
      throw error;
    }
  }

  /**
   * Store performance analytics for a reviewer
   */
  async storePerformanceAnalytics(analytics: PerformanceAnalytics): Promise<void> {
    const collections = this.getCollections();
    
    try {
      await collections.performanceAnalytics.updateOne(
        { anonymousId: analytics.anonymousId },
        { $set: analytics },
        { upsert: true }
      );
    } catch (error) {
      console.error('Failed to store performance analytics:', error);
      throw error;
    }
  }

  /**
   * Get performance analytics for a reviewer
   */
  async getPerformanceAnalytics(anonymousId: string): Promise<PerformanceAnalytics | null> {
    const collections = this.getCollections();
    
    try {
      return await collections.performanceAnalytics.findOne({ anonymousId });
    } catch (error) {
      console.error('Failed to get performance analytics:', error);
      throw error;
    }
  }

  /**
   * Store quality improvement recommendations
   */
  async storeQualityImprovements(improvements: QualityImprovement[]): Promise<string[]> {
    const collections = this.getCollections();
    
    try {
      const result = await collections.qualityImprovements.insertMany(improvements);
      return Object.values(result.insertedIds).map(id => id.toString());
    } catch (error) {
      console.error('Failed to store quality improvements:', error);
      throw error;
    }
  }

  /**
   * Get quality improvement recommendations for a reviewer
   */
  async getQualityImprovements(anonymousId: string): Promise<QualityImprovement[]> {
    const collections = this.getCollections();
    
    try {
      return await collections.qualityImprovements
        .find({ anonymousId })
        .sort({ priority: 1, estimatedImpact: -1, timestamp: -1 })
        .toArray();
    } catch (error) {
      console.error('Failed to get quality improvements:', error);
      throw error;
    }
  }

  /**
   * Store satisfaction survey response
   */
  async storeSatisfactionSurvey(survey: SatisfactionSurvey): Promise<string> {
    const collections = this.getCollections();
    
    try {
      const result = await collections.satisfactionSurveys.insertOne(survey);
      return result.insertedId.toString();
    } catch (error) {
      console.error('Failed to store satisfaction survey:', error);
      throw error;
    }
  }

  /**
   * Get satisfaction surveys for a reviewer
   */
  async getReviewerSatisfactionSurveys(anonymousId: string): Promise<SatisfactionSurvey[]> {
    const collections = this.getCollections();
    
    try {
      return await collections.satisfactionSurveys
        .find({ anonymousId })
        .sort({ timestamp: -1 })
        .toArray();
    } catch (error) {
      console.error('Failed to get satisfaction surveys:', error);
      throw error;
    }
  }

  /**
   * Calculate journal quality statistics
   */
  async calculateJournalQualityStats(journalId: string): Promise<{
    totalReviews: number;
    averageQualityScore: number;
    averageCompletionTime: number;
    onTimeCompletionRate: number;
    averageSatisfactionScore: number;
    performanceLevelDistribution: Record<string, number>;
    qualityTrends: {
      period: string;
      averageScore: number;
    }[];
  }> {
    const collections = this.getCollections();
    
    try {
      // Quality metrics aggregation
      const metricsStats = await collections.qualityMetrics.aggregate([
        { $match: { journalId } },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageQualityScore: { $avg: '$qualityScore' },
            averageCompletionTime: { $avg: '$completionTime' },
            onTimeReviews: {
              $sum: { $cond: [{ $gte: ['$timelinessScore', 80] }, 1, 0] }
            }
          }
        }
      ]).toArray();

      // Performance level distribution
      const performanceLevels = await collections.performanceAnalytics.aggregate([
        {
          $group: {
            _id: '$performanceLevel',
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      // Satisfaction scores
      const satisfactionStats = await collections.satisfactionSurveys.aggregate([
        {
          $group: {
            _id: null,
            averageSatisfactionScore: { $avg: '$overallSatisfaction' }
          }
        }
      ]).toArray();

      // Quality trends (last 12 months)
      const qualityTrends = await collections.qualityMetrics.aggregate([
        { $match: { journalId } },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' }
            },
            averageScore: { $avg: '$qualityScore' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
        {
          $project: {
            period: {
              $concat: [
                { $toString: '$_id.year' },
                '-',
                { $toString: '$_id.month' }
              ]
            },
            averageScore: { $round: ['$averageScore', 1] },
            _id: 0
          }
        }
      ]).toArray();

      const metrics = metricsStats[0] || {};
      const satisfaction = satisfactionStats[0] || {};
      
      const performanceLevelDistribution = performanceLevels.reduce((acc, level) => {
        acc[level._id] = level.count;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalReviews: metrics.totalReviews || 0,
        averageQualityScore: Math.round(metrics.averageQualityScore || 0),
        averageCompletionTime: Math.round(metrics.averageCompletionTime || 0),
        onTimeCompletionRate: Math.round(
          ((metrics.onTimeReviews || 0) / (metrics.totalReviews || 1)) * 100
        ),
        averageSatisfactionScore: Math.round((satisfaction.averageSatisfactionScore || 0) * 10) / 10,
        performanceLevelDistribution,
        qualityTrends: qualityTrends.reverse(), // Show chronological order
      };
    } catch (error) {
      console.error('Failed to calculate journal quality stats:', error);
      throw error;
    }
  }

  /**
   * Get reviewers needing quality intervention
   */
  async getReviewersNeedingIntervention(): Promise<PerformanceAnalytics[]> {
    const collections = this.getCollections();
    
    try {
      return await collections.performanceAnalytics
        .find({
          $or: [
            { performanceLevel: 'needs_improvement' },
            { averageQualityScore: { $lt: 60 } },
            { onTimeCompletionRate: { $lt: 60 } },
            { 'trendAnalysis.qualityTrend': 'declining' }
          ]
        })
        .sort({ averageQualityScore: 1 })
        .toArray();
    } catch (error) {
      console.error('Failed to get reviewers needing intervention:', error);
      throw error;
    }
  }

  /**
   * Get top performing reviewers (anonymized)
   */
  async getTopPerformers(limit: number = 50): Promise<PerformanceAnalytics[]> {
    const collections = this.getCollections();
    
    try {
      return await collections.performanceAnalytics
        .find({
          totalReviewsCompleted: { $gte: 3 }, // Minimum 3 reviews for reliability
          performanceLevel: { $in: ['excellent', 'good'] }
        })
        .sort({ 
          averageQualityScore: -1,
          onTimeCompletionRate: -1,
          totalReviewsCompleted: -1
        })
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Failed to get top performers:', error);
      throw error;
    }
  }

  /**
   * Clean up old quality data
   */
  async cleanupOldQualityData(monthsOld: number = 24): Promise<{
    metricsRemoved: number;
    surveysRemoved: number;
    improvementsRemoved: number;
  }> {
    const collections = this.getCollections();
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);
    
    try {
      const [metrics, surveys, improvements] = await Promise.all([
        collections.qualityMetrics.deleteMany({
          timestamp: { $lt: cutoffDate }
        }),
        collections.satisfactionSurveys.deleteMany({
          timestamp: { $lt: cutoffDate }
        }),
        collections.qualityImprovements.deleteMany({
          timestamp: { $lt: cutoffDate }
        })
      ]);

      return {
        metricsRemoved: metrics.deletedCount || 0,
        surveysRemoved: surveys.deletedCount || 0,
        improvementsRemoved: improvements.deletedCount || 0,
      };
    } catch (error) {
      console.error('Failed to cleanup old quality data:', error);
      throw error;
    }
  }

  /**
   * Get quality dashboard data
   */
  async getQualityDashboardData(journalId?: string): Promise<{
    totalReviews: number;
    averageQualityScore: number;
    onTimeRate: number;
    satisfactionScore: number;
    performanceLevels: Record<string, number>;
    recentTrends: Array<{ date: string; score: number }>;
    topConcerns: string[];
    improvementOpportunities: string[];
  }> {
    const collections = this.getCollections();
    
    try {
      const matchStage = journalId ? { journalId } : {};
      
      // Overall metrics
      const overallStats = await collections.qualityMetrics.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageQualityScore: { $avg: '$qualityScore' },
            onTimeReviews: {
              $sum: { $cond: [{ $gte: ['$timelinessScore', 80] }, 1, 0] }
            }
          }
        }
      ]).toArray();

      // Performance levels
      const performanceLevels = await collections.performanceAnalytics.aggregate([
        {
          $group: {
            _id: '$performanceLevel',
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      // Recent trends (last 30 days)
      const recentTrends = await collections.qualityMetrics.aggregate([
        { 
          $match: { 
            ...matchStage,
            timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
            },
            score: { $avg: '$qualityScore' }
          }
        },
        { $sort: { '_id': 1 } },
        {
          $project: {
            date: '$_id',
            score: { $round: ['$score', 1] },
            _id: 0
          }
        }
      ]).toArray();

      // Satisfaction score
      const satisfactionStats = await collections.satisfactionSurveys.aggregate([
        {
          $group: {
            _id: null,
            averageSatisfaction: { $avg: '$overallSatisfaction' }
          }
        }
      ]).toArray();

      const stats = overallStats[0] || {};
      const satisfaction = satisfactionStats[0] || {};
      
      const performanceLevelMap = performanceLevels.reduce((acc, level) => {
        acc[level._id] = level.count;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalReviews: stats.totalReviews || 0,
        averageQualityScore: Math.round(stats.averageQualityScore || 0),
        onTimeRate: Math.round(((stats.onTimeReviews || 0) / (stats.totalReviews || 1)) * 100),
        satisfactionScore: Math.round((satisfaction.averageSatisfaction || 0) * 10) / 10,
        performanceLevels: performanceLevelMap,
        recentTrends,
        topConcerns: ['Completion timeliness', 'Review comprehensiveness'], // Would be dynamic
        improvementOpportunities: ['Enhanced training resources', 'Better deadline management'], // Would be dynamic
      };
    } catch (error) {
      console.error('Failed to get quality dashboard data:', error);
      throw error;
    }
  }
}

// Singleton instance
export const qualityDb = new QualityDatabase();

// Utility functions
export const initializeQualityDatabase = () => qualityDb.initialize();
export const getQualityCollections = () => qualityDb.getCollections();

export default qualityDb;