/**
 * Anonymous Review Session Middleware
 * 
 * This middleware handles anonymous reviewer sessions, ensuring that reviewer
 * identities are protected while maintaining secure access to review functionality.
 * It integrates with NextAuth for base authentication and adds anonymous session
 * management on top.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { anonymityManager, AnonymousSession } from './index';
import { anonymityDb } from './models';

// Middleware configuration
export const ANONYMOUS_PATHS = [
  '/review/',
  '/api/review/',
  '/api/anonymous/',
];

export const REVIEWER_SESSION_COOKIE = 'anonymous-reviewer-session';

/**
 * Anonymous session validation result
 */
export interface AnonymousValidationResult {
  isValid: boolean;
  anonymousId?: string;
  reviewId?: string;
  sessionToken?: string;
  error?: string;
}

/**
 * Create anonymous reviewer session
 */
export async function createAnonymousReviewerSession(
  userId: string,
  reviewId: string,
  manuscriptId: string,
  userData: Record<string, unknown>
): Promise<{
  success: boolean;
  anonymousId?: string;
  sessionToken?: string;
  error?: string;
}> {
  try {
    // Initialize database if needed
    try {
      await anonymityDb.initialize();
    } catch (error) {
      // Database might already be initialized
      console.log('Database initialization skipped (likely already initialized)');
    }

    // Create anonymous reviewer record
    const anonymousReviewer = await anonymityManager.createAnonymousReviewer(
      userId,
      reviewId,
      userData
    );

    // Store in database
    await anonymityDb.createAnonymousReviewer(anonymousReviewer);

    // Create anonymous session
    const anonymousSession = await anonymityManager.createAnonymousSession(
      anonymousReviewer.anonymousId,
      reviewId,
      manuscriptId
    );

    // Store session in database
    await anonymityDb.createAnonymousSession(anonymousSession);

    // Create audit trail
    const auditTrail = anonymityManager.createAuditTrail(
      'SESSION_CREATED',
      anonymousReviewer.anonymousId,
      reviewId,
      {
        type: 'session_creation',
        manuscriptId,
        timestamp: new Date().toISOString()
      }
    );

    await anonymityDb.createAuditTrail(auditTrail);

    return {
      success: true,
      anonymousId: anonymousReviewer.anonymousId,
      sessionToken: anonymousReviewer.sessionToken
    };

  } catch (error) {
    console.error('Failed to create anonymous reviewer session:', error);
    return {
      success: false,
      error: 'Failed to create anonymous session'
    };
  }
}

/**
 * Validate anonymous reviewer session
 */
export async function validateAnonymousSession(
  sessionToken: string
): Promise<AnonymousValidationResult> {
  try {
    // Initialize database if needed
    try {
      await anonymityDb.initialize();
    } catch (error) {
      console.log('Database initialization skipped (likely already initialized)');
    }

    // Find reviewer by session token
    const reviewer = await anonymityDb.findBySessionToken(sessionToken);

    if (!reviewer) {
      return {
        isValid: false,
        error: 'Invalid or expired session token'
      };
    }

    // Check if session is still valid
    if (reviewer.expiresAt <= new Date() || !reviewer.isActive) {
      return {
        isValid: false,
        error: 'Session has expired'
      };
    }

    // Update last activity
    await anonymityDb.updateReviewerActivity(reviewer.anonymousId);

    // Find active session for this reviewer
    const sessions = await anonymityDb.getCollections().anonymousSessions
      .find({ anonymousId: reviewer.anonymousId, expiresAt: { $gt: new Date() } })
      .sort({ lastActivity: -1 })
      .limit(1)
      .toArray();

    const activeSession = sessions[0];

    if (!activeSession) {
      return {
        isValid: false,
        error: 'No active review session found'
      };
    }

    return {
      isValid: true,
      anonymousId: reviewer.anonymousId,
      reviewId: activeSession.reviewId,
      sessionToken: reviewer.sessionToken
    };

  } catch (error) {
    console.error('Failed to validate anonymous session:', error);
    return {
      isValid: false,
      error: 'Session validation failed'
    };
  }
}

/**
 * Anonymous session middleware for Next.js
 */
export async function anonymousSessionMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  // Only apply to anonymous paths
  const isAnonymousPath = ANONYMOUS_PATHS.some(path => pathname.startsWith(path));
  if (!isAnonymousPath) {
    return null; // Not an anonymous path, continue with normal processing
  }

  try {
    // Get session token from cookie or header
    const sessionToken = 
      request.cookies.get(REVIEWER_SESSION_COOKIE)?.value ||
      request.headers.get('X-Anonymous-Session-Token');

    if (!sessionToken) {
      return new NextResponse(
        JSON.stringify({ error: 'Anonymous session required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate anonymous session
    const validation = await validateAnonymousSession(sessionToken);

    if (!validation.isValid) {
      return new NextResponse(
        JSON.stringify({ error: validation.error || 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add anonymous context to headers for API routes
    const response = NextResponse.next();
    response.headers.set('X-Anonymous-Id', validation.anonymousId!);
    response.headers.set('X-Review-Id', validation.reviewId!);
    
    // Update session activity
    try {
      await anonymityDb.updateSessionActivity(sessionToken);
    } catch (error) {
      console.warn('Failed to update session activity:', error);
    }

    return response;

  } catch (error) {
    console.error('Anonymous session middleware error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Session validation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get anonymous context from request headers
 */
export function getAnonymousContext(request: NextRequest): {
  anonymousId?: string;
  reviewId?: string;
} {
  return {
    anonymousId: request.headers.get('X-Anonymous-Id') || undefined,
    reviewId: request.headers.get('X-Review-Id') || undefined,
  };
}

/**
 * Revoke anonymous session
 */
export async function revokeAnonymousSession(sessionToken: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await anonymityDb.initialize();

    const reviewer = await anonymityDb.findBySessionToken(sessionToken);
    if (!reviewer) {
      return { success: false, error: 'Session not found' };
    }

    // Mark reviewer as inactive
    await anonymityDb.getCollections().anonymousReviewers.updateOne(
      { anonymousId: reviewer.anonymousId },
      { $set: { isActive: false } }
    );

    // Create audit trail
    const auditTrail = anonymityManager.createAuditTrail(
      'SESSION_REVOKED',
      reviewer.anonymousId,
      'unknown', // No specific review ID for revocation
      {
        type: 'session_revocation',
        timestamp: new Date().toISOString(),
        reason: 'manual_revocation'
      }
    );

    await anonymityDb.createAuditTrail(auditTrail);

    return { success: true };

  } catch (error) {
    console.error('Failed to revoke anonymous session:', error);
    return { success: false, error: 'Failed to revoke session' };
  }
}

/**
 * Clean up expired sessions (should be run periodically)
 */
export async function cleanupExpiredSessions(): Promise<{
  cleaned: number;
  errors: string[];
}> {
  try {
    await anonymityDb.initialize();
    await anonymityDb.cleanupExpiredData();
    
    return { cleaned: 0, errors: [] }; // Actual count would come from cleanup method
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error);
    return { cleaned: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
  }
}

/**
 * Verify anonymity compliance for a request
 */
export async function verifyAnonymityCompliance(
  requestData: Record<string, unknown>
): Promise<{
  compliant: boolean;
  violations: string[];
  recommendations: string[];
}> {
  return anonymityManager.verifyAnonymityCompliance(requestData);
}

/**
 * Helper function to check if current request is in anonymous context
 */
export function isAnonymousRequest(request: NextRequest): boolean {
  return ANONYMOUS_PATHS.some(path => request.nextUrl.pathname.startsWith(path));
}

/**
 * Create audit trail for anonymous action
 */
export async function auditAnonymousAction(
  anonymousId: string,
  reviewId: string,
  action: string,
  metadata: Record<string, unknown> = {},
  ipAddress?: string
): Promise<void> {
  try {
    const auditTrail = anonymityManager.createAuditTrail(
      action,
      anonymousId,
      reviewId,
      {
        ...metadata,
        timestamp: new Date().toISOString(),
        userAgent: metadata.userAgent || 'unknown'
      },
      ipAddress
    );

    await anonymityDb.createAuditTrail(auditTrail);
  } catch (error) {
    console.error('Failed to create audit trail:', error);
    // Don't throw error to avoid breaking the main flow
  }
}

export default anonymousSessionMiddleware;