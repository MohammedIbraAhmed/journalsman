/**
 * MongoDB Models for Anonymity System
 * 
 * This file defines the database collections and schemas for the anonymity
 * protection system. Uses MongoDB with Client-Side Field Level Encryption
 * for sensitive data protection.
 */

import { MongoClient, Collection, Db } from 'mongodb';
import { connectToDatabase } from '@synfind/database';
import {
  AnonymousReviewer,
  AnonymousSession,
  AnonymityAuditTrail,
  EncryptedReviewData,
  ANONYMITY_SCHEMA_MAP
} from './index';

/**
 * Database collections for anonymity system
 */
export interface AnonymityCollections {
  anonymousReviewers: Collection<AnonymousReviewer>;
  anonymousSessions: Collection<AnonymousSession>;
  anonymityAuditTrails: Collection<AnonymityAuditTrail>;
  encryptedReviews: Collection<EncryptedReviewData>;
}

/**
 * Anonymity database manager
 * Handles all database operations for the anonymity system
 */
export class AnonymityDatabase {
  private db: Db | null = null;
  private collections: AnonymityCollections | null = null;

  /**
   * Initialize database connection with encryption support
   */
  async initialize(): Promise<void> {
    try {
      const { db } = await connectToDatabase();
      this.db = db;
      
      // Initialize collections
      this.collections = {
        anonymousReviewers: db.collection<AnonymousReviewer>('anonymous_reviewers'),
        anonymousSessions: db.collection<AnonymousSession>('anonymous_sessions'),
        anonymityAuditTrails: db.collection<AnonymityAuditTrail>('anonymity_audit_trails'),
        encryptedReviews: db.collection<EncryptedReviewData>('encrypted_reviews'),
      };

      // Create indexes for performance and security
      await this.createIndexes();
      
      console.log('Anonymity database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize anonymity database:', error);
      throw error;
    }
  }

  /**
   * Create database indexes for performance and security
   */
  private async createIndexes(): Promise<void> {
    if (!this.collections) throw new Error('Collections not initialized');

    try {
      // Anonymous reviewers indexes
      await this.collections.anonymousReviewers.createIndexes([
        { key: { anonymousId: 1 }, unique: true },
        { key: { hashedUserId: 1 } },
        { key: { sessionToken: 1 } },
        { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
        { key: { isActive: 1 } },
        { key: { createdAt: -1 } }
      ]);

      // Anonymous sessions indexes
      await this.collections.anonymousSessions.createIndexes([
        { key: { anonymousId: 1 } },
        { key: { sessionToken: 1 }, unique: true },
        { key: { reviewId: 1 } },
        { key: { manuscriptId: 1 } },
        { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
        { key: { lastActivity: -1 } },
        { key: { createdAt: -1 } }
      ]);

      // Audit trails indexes
      await this.collections.anonymityAuditTrails.createIndexes([
        { key: { anonymousId: 1 } },
        { key: { reviewId: 1 } },
        { key: { action: 1 } },
        { key: { timestamp: -1 } },
        { key: { 'metadata.type': 1 } }
      ]);

      // Encrypted reviews indexes
      await this.collections.encryptedReviews.createIndexes([
        { key: { anonymousId: 1 } },
        { key: { reviewId: 1 } },
        { key: { encryptionKeyId: 1 } },
        { key: { timestamp: -1 } }
      ]);

      console.log('Anonymity database indexes created successfully');
    } catch (error) {
      console.error('Failed to create anonymity database indexes:', error);
      throw error;
    }
  }

  /**
   * Get collections (ensure initialized)
   */
  getCollections(): AnonymityCollections {
    if (!this.collections) {
      throw new Error('Anonymity database not initialized. Call initialize() first.');
    }
    return this.collections;
  }

  /**
   * Create anonymous reviewer record
   */
  async createAnonymousReviewer(reviewer: AnonymousReviewer): Promise<string> {
    const collections = this.getCollections();
    
    try {
      const result = await collections.anonymousReviewers.insertOne(reviewer);
      return result.insertedId.toString();
    } catch (error) {
      console.error('Failed to create anonymous reviewer:', error);
      throw error;
    }
  }

  /**
   * Find anonymous reviewer by anonymous ID
   */
  async findAnonymousReviewer(anonymousId: string): Promise<AnonymousReviewer | null> {
    const collections = this.getCollections();
    
    try {
      return await collections.anonymousReviewers.findOne({ anonymousId });
    } catch (error) {
      console.error('Failed to find anonymous reviewer:', error);
      throw error;
    }
  }

  /**
   * Find anonymous reviewer by session token
   */
  async findBySessionToken(sessionToken: string): Promise<AnonymousReviewer | null> {
    const collections = this.getCollections();
    
    try {
      return await collections.anonymousReviewers.findOne({ 
        sessionToken,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });
    } catch (error) {
      console.error('Failed to find reviewer by session token:', error);
      throw error;
    }
  }

  /**
   * Update reviewer activity
   */
  async updateReviewerActivity(anonymousId: string): Promise<void> {
    const collections = this.getCollections();
    
    try {
      await collections.anonymousReviewers.updateOne(
        { anonymousId },
        { $set: { lastActivity: new Date() } }
      );
    } catch (error) {
      console.error('Failed to update reviewer activity:', error);
      throw error;
    }
  }

  /**
   * Create anonymous session
   */
  async createAnonymousSession(session: AnonymousSession): Promise<string> {
    const collections = this.getCollections();
    
    try {
      const result = await collections.anonymousSessions.insertOne(session);
      return result.insertedId.toString();
    } catch (error) {
      console.error('Failed to create anonymous session:', error);
      throw error;
    }
  }

  /**
   * Find active session by anonymous ID and review ID
   */
  async findActiveSession(anonymousId: string, reviewId: string): Promise<AnonymousSession | null> {
    const collections = this.getCollections();
    
    try {
      return await collections.anonymousSessions.findOne({
        anonymousId,
        reviewId,
        expiresAt: { $gt: new Date() }
      });
    } catch (error) {
      console.error('Failed to find active session:', error);
      throw error;
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionToken: string): Promise<void> {
    const collections = this.getCollections();
    
    try {
      await collections.anonymousSessions.updateOne(
        { sessionToken },
        { $set: { lastActivity: new Date() } }
      );
    } catch (error) {
      console.error('Failed to update session activity:', error);
      throw error;
    }
  }

  /**
   * Create audit trail entry
   */
  async createAuditTrail(auditTrail: AnonymityAuditTrail): Promise<string> {
    const collections = this.getCollections();
    
    try {
      const result = await collections.anonymityAuditTrails.insertOne(auditTrail);
      return result.insertedId.toString();
    } catch (error) {
      console.error('Failed to create audit trail:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for a review (anonymized)
   */
  async getReviewAuditTrail(reviewId: string): Promise<AnonymityAuditTrail[]> {
    const collections = this.getCollections();
    
    try {
      return await collections.anonymityAuditTrails
        .find({ reviewId })
        .sort({ timestamp: -1 })
        .toArray();
    } catch (error) {
      console.error('Failed to get review audit trail:', error);
      throw error;
    }
  }

  /**
   * Store encrypted review content
   */
  async storeEncryptedReview(encryptedReview: EncryptedReviewData): Promise<string> {
    const collections = this.getCollections();
    
    try {
      const result = await collections.encryptedReviews.insertOne(encryptedReview);
      return result.insertedId.toString();
    } catch (error) {
      console.error('Failed to store encrypted review:', error);
      throw error;
    }
  }

  /**
   * Find encrypted review by review ID and anonymous ID
   */
  async findEncryptedReview(reviewId: string, anonymousId: string): Promise<EncryptedReviewData | null> {
    const collections = this.getCollections();
    
    try {
      return await collections.encryptedReviews.findOne({
        reviewId,
        anonymousId
      });
    } catch (error) {
      console.error('Failed to find encrypted review:', error);
      throw error;
    }
  }

  /**
   * Clean up expired sessions and reviewers
   */
  async cleanupExpiredData(): Promise<void> {
    const collections = this.getCollections();
    const now = new Date();
    
    try {
      // Clean up expired anonymous reviewers
      const expiredReviewers = await collections.anonymousReviewers.deleteMany({
        expiresAt: { $lt: now }
      });

      // Clean up expired sessions
      const expiredSessions = await collections.anonymousSessions.deleteMany({
        expiresAt: { $lt: now }
      });

      console.log(`Cleaned up ${expiredReviewers.deletedCount} expired reviewers and ${expiredSessions.deletedCount} expired sessions`);
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
      throw error;
    }
  }

  /**
   * Get anonymity compliance statistics
   */
  async getComplianceStatistics(): Promise<{
    activeReviewers: number;
    activeSessions: number;
    auditTrailEntries: number;
    encryptedReviews: number;
  }> {
    const collections = this.getCollections();
    const now = new Date();
    
    try {
      const [activeReviewers, activeSessions, auditTrailEntries, encryptedReviews] = await Promise.all([
        collections.anonymousReviewers.countDocuments({
          isActive: true,
          expiresAt: { $gt: now }
        }),
        collections.anonymousSessions.countDocuments({
          expiresAt: { $gt: now }
        }),
        collections.anonymityAuditTrails.countDocuments(),
        collections.encryptedReviews.countDocuments()
      ]);

      return {
        activeReviewers,
        activeSessions,
        auditTrailEntries,
        encryptedReviews
      };
    } catch (error) {
      console.error('Failed to get compliance statistics:', error);
      throw error;
    }
  }

  /**
   * Verify data anonymization compliance
   */
  async verifyDataCompliance(): Promise<{
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const collections = this.getCollections();
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      // Check for any unencrypted sensitive data
      const unencryptedData = await collections.anonymousReviewers.findOne({
        encryptedData: { $exists: false }
      });
      
      if (unencryptedData) {
        issues.push('Found anonymous reviewer without encrypted data');
        recommendations.push('Ensure all reviewer data is properly encrypted');
      }

      // Check for expired but not cleaned up data
      const expiredData = await collections.anonymousReviewers.countDocuments({
        expiresAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 1 day old
      });
      
      if (expiredData > 0) {
        issues.push(`Found ${expiredData} expired reviewer records`);
        recommendations.push('Run cleanup process to remove expired data');
      }

      return {
        compliant: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Failed to verify data compliance:', error);
      return {
        compliant: false,
        issues: ['Failed to verify compliance'],
        recommendations: ['Check database connection and permissions']
      };
    }
  }
}

// Singleton instance
export const anonymityDb = new AnonymityDatabase();

// Utility functions
export const initializeAnonymityDatabase = () => anonymityDb.initialize();
export const getAnonymityCollections = () => anonymityDb.getCollections();

// Export specific model operations
export const createAnonymousReviewer = (reviewer: AnonymousReviewer) => 
  anonymityDb.createAnonymousReviewer(reviewer);
export const findAnonymousReviewer = (anonymousId: string) => 
  anonymityDb.findAnonymousReviewer(anonymousId);
export const createAnonymousSession = (session: AnonymousSession) => 
  anonymityDb.createAnonymousSession(session);
export const createAuditTrailEntry = (auditTrail: AnonymityAuditTrail) => 
  anonymityDb.createAuditTrail(auditTrail);

export default anonymityDb;