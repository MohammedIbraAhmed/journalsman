/**
 * Anonymous Review Deadline Management System
 * 
 * This module provides comprehensive deadline management for peer review
 * while maintaining reviewer anonymity. Features include deadline tracking,
 * automated reminders, extension requests, and anonymous notifications.
 */

import { ObjectId } from 'mongodb';

// Types for deadline management
export interface ReviewDeadline {
  id: string;
  anonymousId: string;
  reviewId: string;
  manuscriptId: string;
  journalId: string;
  assignedDate: Date;
  dueDate: Date;
  originalDueDate: Date;
  extensionsGranted: number;
  maxExtensions: number;
  remindersSent: ReminderLog[];
  status: 'active' | 'completed' | 'overdue' | 'extended' | 'expired';
  completedDate?: Date;
  anonymityProtected: true;
}

export interface ReminderLog {
  id: string;
  anonymousId: string;
  type: 'initial' | 'reminder' | 'urgent' | 'final' | 'overdue';
  sentDate: Date;
  daysBeforeDue: number;
  channelUsed: 'email' | 'platform' | 'both';
  acknowledged: boolean;
  acknowledgedDate?: Date;
}

export interface ExtensionRequest {
  id: string;
  anonymousId: string;
  reviewId: string;
  requestDate: Date;
  requestedDays: number;
  reason: string;
  currentDueDate: Date;
  proposedDueDate: Date;
  status: 'pending' | 'approved' | 'denied';
  reviewedBy?: string;
  reviewedDate?: Date;
  reviewerComment?: string;
  anonymousJustification: string;
}

export interface DeadlineAnalytics {
  anonymousId: string;
  averageCompletionTime: number;
  onTimeCompletionRate: number;
  extensionRequestRate: number;
  responseTimeToReminders: number;
  totalReviewsCompleted: number;
  currentActiveDeadlines: number;
  performanceScore: number;
  anonymizedTrends: Record<string, number>;
}

/**
 * Deadline management configuration
 */
export interface DeadlineConfig {
  standardReviewPeriod: number; // days
  maxExtensionPeriod: number; // days
  maxExtensionsAllowed: number;
  reminderSchedule: number[]; // days before due date
  urgentThreshold: number; // days before due date
  overdueGracePeriod: number; // days after due date
  autoEscalationPeriod: number; // days for auto-escalation
}

/**
 * Default deadline configuration
 */
export const DEFAULT_DEADLINE_CONFIG: DeadlineConfig = {
  standardReviewPeriod: 21, // 3 weeks standard
  maxExtensionPeriod: 14, // maximum 2 weeks extension
  maxExtensionsAllowed: 2,
  reminderSchedule: [14, 7, 3, 1], // 2 weeks, 1 week, 3 days, 1 day
  urgentThreshold: 3,
  overdueGracePeriod: 5,
  autoEscalationPeriod: 30,
};

/**
 * Core deadline management class
 */
export class DeadlineManager {
  private config: DeadlineConfig;

  constructor(config: DeadlineConfig = DEFAULT_DEADLINE_CONFIG) {
    this.config = config;
  }

  /**
   * Create a new review deadline for an anonymous reviewer
   */
  createReviewDeadline(
    anonymousId: string,
    reviewId: string,
    manuscriptId: string,
    journalId: string,
    customPeriod?: number
  ): ReviewDeadline {
    const now = new Date();
    const reviewPeriod = customPeriod || this.config.standardReviewPeriod;
    const dueDate = new Date(now.getTime() + reviewPeriod * 24 * 60 * 60 * 1000);

    return {
      id: new ObjectId().toString(),
      anonymousId,
      reviewId,
      manuscriptId,
      journalId,
      assignedDate: now,
      dueDate,
      originalDueDate: new Date(dueDate),
      extensionsGranted: 0,
      maxExtensions: this.config.maxExtensionsAllowed,
      remindersSent: [],
      status: 'active',
      anonymityProtected: true,
    };
  }

  /**
   * Calculate days remaining until deadline
   */
  getDaysUntilDeadline(deadline: ReviewDeadline): number {
    const now = new Date();
    const timeDiff = deadline.dueDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Check if a deadline requires a reminder
   */
  shouldSendReminder(deadline: ReviewDeadline): {
    shouldSend: boolean;
    reminderType: 'initial' | 'reminder' | 'urgent' | 'final' | 'overdue';
    daysUntilDue: number;
  } {
    const daysUntilDue = this.getDaysUntilDeadline(deadline);
    
    // Don't send reminders for completed or expired deadlines
    if (deadline.status === 'completed' || deadline.status === 'expired') {
      return { shouldSend: false, reminderType: 'initial', daysUntilDue };
    }

    // Overdue reminders
    if (daysUntilDue < 0) {
      const daysPastDue = Math.abs(daysUntilDue);
      const lastOverdueReminder = deadline.remindersSent
        .filter(r => r.type === 'overdue')
        .sort((a, b) => b.sentDate.getTime() - a.sentDate.getTime())[0];
      
      // Send overdue reminders every 3 days
      if (!lastOverdueReminder || 
          (new Date().getTime() - lastOverdueReminder.sentDate.getTime()) > 3 * 24 * 60 * 60 * 1000) {
        return { shouldSend: true, reminderType: 'overdue', daysUntilDue };
      }
    }

    // Check if we need to send a scheduled reminder
    for (const scheduledDay of this.config.reminderSchedule) {
      const hasReminderForThisDay = deadline.remindersSent.some(
        r => r.daysBeforeDue === scheduledDay
      );
      
      if (daysUntilDue <= scheduledDay && !hasReminderForThisDay) {
        let reminderType: 'initial' | 'reminder' | 'urgent' | 'final' = 'reminder';
        
        if (scheduledDay === Math.max(...this.config.reminderSchedule)) {
          reminderType = 'initial';
        } else if (daysUntilDue <= this.config.urgentThreshold) {
          reminderType = 'urgent';
        } else if (daysUntilDue <= 1) {
          reminderType = 'final';
        }
        
        return { shouldSend: true, reminderType, daysUntilDue };
      }
    }

    return { shouldSend: false, reminderType: 'initial', daysUntilDue };
  }

  /**
   * Create a reminder log entry
   */
  createReminderLog(
    anonymousId: string,
    type: ReminderLog['type'],
    daysBeforeDue: number,
    channelUsed: 'email' | 'platform' | 'both' = 'both'
  ): ReminderLog {
    return {
      id: new ObjectId().toString(),
      anonymousId,
      type,
      sentDate: new Date(),
      daysBeforeDue,
      channelUsed,
      acknowledged: false,
    };
  }

  /**
   * Process extension request
   */
  processExtensionRequest(
    deadline: ReviewDeadline,
    requestedDays: number,
    reason: string
  ): ExtensionRequest {
    const now = new Date();
    const proposedDueDate = new Date(deadline.dueDate.getTime() + requestedDays * 24 * 60 * 60 * 1000);

    return {
      id: new ObjectId().toString(),
      anonymousId: deadline.anonymousId,
      reviewId: deadline.reviewId,
      requestDate: now,
      requestedDays,
      reason,
      currentDueDate: deadline.dueDate,
      proposedDueDate,
      status: 'pending',
      anonymousJustification: `Extension requested by ${deadline.anonymousId.substring(0, 8)}`,
    };
  }

  /**
   * Approve extension request
   */
  approveExtension(
    deadline: ReviewDeadline,
    extensionRequest: ExtensionRequest,
    reviewerComment?: string
  ): ReviewDeadline {
    const updatedDeadline = { ...deadline };
    updatedDeadline.dueDate = extensionRequest.proposedDueDate;
    updatedDeadline.extensionsGranted += 1;
    updatedDeadline.status = 'extended';

    return updatedDeadline;
  }

  /**
   * Update deadline status based on current state
   */
  updateDeadlineStatus(deadline: ReviewDeadline): ReviewDeadline {
    const now = new Date();
    const daysUntilDue = this.getDaysUntilDeadline(deadline);

    if (deadline.status === 'completed') {
      return deadline; // No need to update completed deadlines
    }

    const updated = { ...deadline };

    if (daysUntilDue < -this.config.overdueGracePeriod) {
      updated.status = 'expired';
    } else if (daysUntilDue < 0) {
      updated.status = 'overdue';
    } else if (deadline.extensionsGranted > 0) {
      updated.status = 'extended';
    } else {
      updated.status = 'active';
    }

    return updated;
  }

  /**
   * Calculate completion statistics for anonymous reviewer
   */
  calculateAnonymousStats(
    anonymousId: string,
    completedDeadlines: ReviewDeadline[]
  ): DeadlineAnalytics {
    const reviewerDeadlines = completedDeadlines.filter(
      d => d.anonymousId === anonymousId
    );

    if (reviewerDeadlines.length === 0) {
      return {
        anonymousId,
        averageCompletionTime: 0,
        onTimeCompletionRate: 0,
        extensionRequestRate: 0,
        responseTimeToReminders: 0,
        totalReviewsCompleted: 0,
        currentActiveDeadlines: 0,
        performanceScore: 0,
        anonymizedTrends: {},
      };
    }

    // Calculate completion times
    const completionTimes = reviewerDeadlines
      .filter(d => d.completedDate)
      .map(d => {
        const assignedTime = d.assignedDate.getTime();
        const completedTime = d.completedDate!.getTime();
        return (completedTime - assignedTime) / (1000 * 3600 * 24); // days
      });

    const averageCompletionTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;

    // Calculate on-time completion rate
    const onTimeCompletions = reviewerDeadlines.filter(d => 
      d.completedDate && d.completedDate <= d.originalDueDate
    ).length;
    const onTimeCompletionRate = (onTimeCompletions / reviewerDeadlines.length) * 100;

    // Calculate extension request rate
    const extensionRequests = reviewerDeadlines.filter(d => d.extensionsGranted > 0).length;
    const extensionRequestRate = (extensionRequests / reviewerDeadlines.length) * 100;

    // Calculate performance score (0-100)
    const performanceScore = Math.min(100, Math.max(0, 
      (onTimeCompletionRate * 0.6) + 
      ((100 - extensionRequestRate) * 0.2) + 
      (Math.max(0, 100 - (averageCompletionTime - this.config.standardReviewPeriod) * 5) * 0.2)
    ));

    return {
      anonymousId,
      averageCompletionTime,
      onTimeCompletionRate,
      extensionRequestRate,
      responseTimeToReminders: 0, // Would calculate from reminder acknowledgments
      totalReviewsCompleted: reviewerDeadlines.length,
      currentActiveDeadlines: 0, // Would be calculated from active deadlines
      performanceScore: Math.round(performanceScore),
      anonymizedTrends: {
        recentPerformance: performanceScore,
        trendDirection: 0, // Would calculate trend over time
      },
    };
  }

  /**
   * Generate anonymous reminder message
   */
  generateReminderMessage(
    deadline: ReviewDeadline,
    reminderType: ReminderLog['type'],
    daysUntilDue: number
  ): {
    subject: string;
    message: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  } {
    const manuscripts = `manuscript (ID: ${deadline.manuscriptId.substring(0, 8)})`;
    
    let subject: string;
    let message: string;
    let urgency: 'low' | 'medium' | 'high' | 'critical';

    switch (reminderType) {
      case 'initial':
        subject = 'Review Assignment Confirmation';
        message = `You have been assigned to review ${manuscripts}. The review is due in ${daysUntilDue} days. Your anonymous reviewer ID is ${deadline.anonymousId.substring(0, 12)}.`;
        urgency = 'low';
        break;

      case 'reminder':
        subject = `Review Reminder - ${daysUntilDue} Days Remaining`;
        message = `Reminder: Your review for ${manuscripts} is due in ${daysUntilDue} days. Please complete your review at your earliest convenience.`;
        urgency = 'medium';
        break;

      case 'urgent':
        subject = `URGENT: Review Due in ${daysUntilDue} Day${daysUntilDue === 1 ? '' : 's'}`;
        message = `URGENT: Your review for ${manuscripts} is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}. Please complete your review immediately or request an extension if needed.`;
        urgency = 'high';
        break;

      case 'final':
        subject = 'FINAL NOTICE: Review Due Tomorrow';
        message = `FINAL NOTICE: Your review for ${manuscripts} is due tomorrow. Please complete your review today or it will be marked as overdue.`;
        urgency = 'critical';
        break;

      case 'overdue':
        const daysPastDue = Math.abs(daysUntilDue);
        subject = `OVERDUE: Review Past Due by ${daysPastDue} Day${daysPastDue === 1 ? '' : 's'}`;
        message = `Your review for ${manuscripts} is now ${daysPastDue} day${daysPastDue === 1 ? '' : 's'} overdue. Please complete it immediately to avoid assignment cancellation.`;
        urgency = 'critical';
        break;

      default:
        subject = 'Review Status Update';
        message = `Status update for your review of ${manuscripts}.`;
        urgency = 'low';
    }

    return { subject, message, urgency };
  }

  /**
   * Check if reviewer can request extension
   */
  canRequestExtension(deadline: ReviewDeadline): {
    canRequest: boolean;
    reason?: string;
    maxDaysAvailable?: number;
  } {
    if (deadline.status === 'completed' || deadline.status === 'expired') {
      return { canRequest: false, reason: 'Review already completed or expired' };
    }

    if (deadline.extensionsGranted >= deadline.maxExtensions) {
      return { 
        canRequest: false, 
        reason: `Maximum extensions (${deadline.maxExtensions}) already granted` 
      };
    }

    const daysUntilDue = this.getDaysUntilDeadline(deadline);
    if (daysUntilDue < -this.config.overdueGracePeriod) {
      return { canRequest: false, reason: 'Review is too far past due' };
    }

    const maxDaysAvailable = this.config.maxExtensionPeriod;

    return { 
      canRequest: true, 
      maxDaysAvailable 
    };
  }
}

// Singleton instance
export const deadlineManager = new DeadlineManager();

// Utility functions
export const createReviewDeadline = (
  anonymousId: string,
  reviewId: string,
  manuscriptId: string,
  journalId: string,
  customPeriod?: number
) => deadlineManager.createReviewDeadline(anonymousId, reviewId, manuscriptId, journalId, customPeriod);

export const shouldSendReminder = (deadline: ReviewDeadline) => 
  deadlineManager.shouldSendReminder(deadline);

export const generateReminderMessage = (
  deadline: ReviewDeadline,
  reminderType: ReminderLog['type'],
  daysUntilDue: number
) => deadlineManager.generateReminderMessage(deadline, reminderType, daysUntilDue);

export const canRequestExtension = (deadline: ReviewDeadline) =>
  deadlineManager.canRequestExtension(deadline);

export default deadlineManager;