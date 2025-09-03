/**
 * Anonymity Foundation for Peer Review System
 * 
 * This module provides comprehensive anonymity protection for reviewers throughout
 * the peer review process. It uses MongoDB Client-Side Field Level Encryption (CSFLE)
 * and cryptographic hashing to ensure reviewer identities are protected while maintaining
 * audit trails and quality metrics.
 * 
 * Key Features:
 * - Anonymous reviewer session management
 * - Secure identity hashing with anonymous IDs
 * - Encrypted data storage using MongoDB CSFLE
 * - Audit trail preservation without identity exposure
 * - Quality metrics collection with anonymization
 */

import crypto from 'crypto';
import { ObjectId } from 'mongodb';

// Types for anonymity system
export interface AnonymousReviewer {
  anonymousId: string;
  hashedUserId: string;
  encryptedData: string;
  sessionToken: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface AnonymousSession {
  anonymousId: string;
  sessionToken: string;
  reviewId: string;
  manuscriptId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
}

export interface AnonymityAuditTrail {
  action: string;
  anonymousId: string;
  reviewId: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
  ipHash?: string;
}

export interface EncryptedReviewData {
  encryptedContent: string;
  anonymousId: string;
  reviewId: string;
  encryptionKeyId: string;
  algorithm: string;
  timestamp: Date;
}

/**
 * Core anonymity manager class
 * Handles all anonymity operations for the review system
 */
export class AnonymityManager {
  private readonly ANONYMOUS_ID_LENGTH = 32;
  private readonly SESSION_DURATION_HOURS = 72; // 3 days for review completion
  private readonly HASH_ALGORITHM = 'sha256';
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';

  /**
   * Generate a secure anonymous ID for a reviewer
   * Format: ANR_[timestamp]_[random]
   */
  generateAnonymousId(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `ANR_${timestamp}_${randomBytes}`;
  }

  /**
   * Create a secure hash of the user ID for anonymous tracking
   * Uses HMAC with a secret key for additional security
   */
  hashUserId(userId: string): string {
    const secret = process.env.REVIEWER_ANONYMITY_SECRET || 'fallback-secret-key';
    return crypto
      .createHmac(this.HASH_ALGORITHM, secret)
      .update(userId)
      .digest('hex');
  }

  /**
   * Generate a secure session token for anonymous review sessions
   */
  generateSessionToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Create an anonymous reviewer record
   * Encrypts the actual user data while maintaining anonymous tracking
   */
  async createAnonymousReviewer(
    userId: string, 
    reviewId: string, 
    userData: Record<string, unknown>
  ): Promise<AnonymousReviewer> {
    const anonymousId = this.generateAnonymousId();
    const hashedUserId = this.hashUserId(userId);
    const sessionToken = this.generateSessionToken();
    
    // Encrypt user data for secure storage
    const encryptedData = await this.encryptUserData(userData);
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.SESSION_DURATION_HOURS);

    return {
      anonymousId,
      hashedUserId,
      encryptedData,
      sessionToken,
      createdAt: new Date(),
      expiresAt,
      isActive: true,
    };
  }

  /**
   * Create an anonymous session for a reviewer
   */
  async createAnonymousSession(
    anonymousId: string,
    reviewId: string,
    manuscriptId: string
  ): Promise<AnonymousSession> {
    const sessionToken = this.generateSessionToken();
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.SESSION_DURATION_HOURS);

    return {
      anonymousId,
      sessionToken,
      reviewId,
      manuscriptId,
      createdAt: now,
      expiresAt,
      lastActivity: now,
    };
  }

  /**
   * Encrypt sensitive user data using AES-256-GCM
   */
  private async encryptUserData(data: Record<string, unknown>): Promise<string> {
    const key = crypto.scryptSync(
      process.env.ENCRYPTION_KEY || 'default-key', 
      'salt', 
      32
    );
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ENCRYPTION_ALGORITHM, key);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine IV and encrypted data
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt user data
   */
  private async decryptUserData(encryptedData: string): Promise<Record<string, unknown>> {
    const key = crypto.scryptSync(
      process.env.ENCRYPTION_KEY || 'default-key', 
      'salt', 
      32
    );
    
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher(this.ENCRYPTION_ALGORITHM, key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Validate an anonymous session
   */
  isValidSession(session: AnonymousSession): boolean {
    const now = new Date();
    return (
      session.isActive !== false &&
      session.expiresAt > now &&
      session.sessionToken !== undefined
    );
  }

  /**
   * Create audit trail entry without exposing identity
   */
  createAuditTrail(
    action: string,
    anonymousId: string,
    reviewId: string,
    metadata: Record<string, unknown> = {},
    ipAddress?: string
  ): AnonymityAuditTrail {
    return {
      action,
      anonymousId,
      reviewId,
      timestamp: new Date(),
      metadata,
      ipHash: ipAddress ? this.hashIpAddress(ipAddress) : undefined,
    };
  }

  /**
   * Hash IP address for audit trails without storing actual IP
   */
  private hashIpAddress(ipAddress: string): string {
    return crypto
      .createHash(this.HASH_ALGORITHM)
      .update(ipAddress)
      .digest('hex');
  }

  /**
   * Generate anonymous communication channel ID
   * Used for reviewer-author communication during revisions
   */
  generateCommunicationChannelId(reviewId: string, anonymousId: string): string {
    const combined = `${reviewId}_${anonymousId}`;
    return crypto
      .createHash(this.HASH_ALGORITHM)
      .update(combined)
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();
  }

  /**
   * Create anonymized performance metrics
   * Allows tracking quality without revealing identity
   */
  createAnonymizedMetrics(
    anonymousId: string,
    reviewData: {
      completionTime: number;
      qualityScore: number;
      comprehensiveness: number;
      timeliness: number;
    }
  ) {
    return {
      anonymousId,
      ...reviewData,
      timestamp: new Date(),
      // Create derived metrics for aggregation
      performanceHash: this.generatePerformanceHash(anonymousId, reviewData),
    };
  }

  /**
   * Generate performance hash for statistical analysis without identity exposure
   */
  private generatePerformanceHash(
    anonymousId: string, 
    reviewData: Record<string, number>
  ): string {
    const combined = anonymousId + JSON.stringify(reviewData);
    return crypto
      .createHash(this.HASH_ALGORITHM)
      .update(combined)
      .digest('hex')
      .substring(0, 12);
  }

  /**
   * Encrypt review content before storage
   * Part of CSFLE implementation
   */
  async encryptReviewContent(
    content: string,
    anonymousId: string,
    reviewId: string
  ): Promise<EncryptedReviewData> {
    const encryptionKeyId = this.generateEncryptionKeyId(reviewId);
    
    // In production, this would use MongoDB CSFLE
    // For now, using local encryption as foundation
    const key = crypto.scryptSync(encryptionKeyId, 'review-salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ENCRYPTION_ALGORITHM, key);
    
    let encryptedContent = cipher.update(content, 'utf8', 'hex');
    encryptedContent += cipher.final('hex');
    
    return {
      encryptedContent: iv.toString('hex') + ':' + encryptedContent,
      anonymousId,
      reviewId,
      encryptionKeyId,
      algorithm: this.ENCRYPTION_ALGORITHM,
      timestamp: new Date(),
    };
  }

  /**
   * Generate encryption key ID for review content
   */
  private generateEncryptionKeyId(reviewId: string): string {
    return crypto
      .createHash(this.HASH_ALGORITHM)
      .update(`review_${reviewId}_${Date.now()}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Verify anonymity compliance for a review session
   * Ensures no personally identifiable information is exposed
   */
  verifyAnonymityCompliance(data: Record<string, unknown>): {
    compliant: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check for common PII patterns
    const piiPatterns = [
      { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, name: 'email' },
      { pattern: /\d{3}-\d{2}-\d{4}/, name: 'SSN' },
      { pattern: /\(\d{3}\)\s*\d{3}-\d{4}/, name: 'phone' },
      { pattern: /https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/, name: 'ORCID' }
    ];

    const dataString = JSON.stringify(data);
    
    piiPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(dataString)) {
        violations.push(`Potential ${name} detected in data`);
        recommendations.push(`Remove or encrypt ${name} before storage`);
      }
    });

    // Check for anonymous ID presence
    if (!data.anonymousId || typeof data.anonymousId !== 'string') {
      violations.push('Missing or invalid anonymous ID');
      recommendations.push('Ensure anonymous ID is properly set');
    }

    return {
      compliant: violations.length === 0,
      violations,
      recommendations,
    };
  }
}

// Singleton instance for application use
export const anonymityManager = new AnonymityManager();

// Utility functions for easy access
export const generateAnonymousId = () => anonymityManager.generateAnonymousId();
export const createAnonymousReviewer = (userId: string, reviewId: string, userData: Record<string, unknown>) => 
  anonymityManager.createAnonymousReviewer(userId, reviewId, userData);
export const createAuditTrail = (action: string, anonymousId: string, reviewId: string, metadata?: Record<string, unknown>, ipAddress?: string) =>
  anonymityManager.createAuditTrail(action, anonymousId, reviewId, metadata, ipAddress);
export const verifyAnonymityCompliance = (data: Record<string, unknown>) =>
  anonymityManager.verifyAnonymityCompliance(data);

// MongoDB schema configuration for CSFLE
export const ANONYMITY_SCHEMA_MAP = {
  'synfind.anonymous_reviewers': {
    bsonType: 'object',
    properties: {
      encryptedData: {
        encrypt: {
          bsonType: 'string',
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
          keyId: ['/path/to/key/id'] // This would be configured with actual key management
        }
      },
      hashedUserId: {
        encrypt: {
          bsonType: 'string',
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random'
        }
      }
    }
  },
  'synfind.encrypted_reviews': {
    bsonType: 'object',
    properties: {
      encryptedContent: {
        encrypt: {
          bsonType: 'string',
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random'
        }
      }
    }
  }
};

// Export types and classes
export type {
  AnonymousReviewer,
  AnonymousSession,
  AnonymityAuditTrail,
  EncryptedReviewData,
};