/**
 * Review Quality Standards and Scoring System
 * 
 * This module provides comprehensive quality assessment for peer reviews
 * while maintaining reviewer anonymity. Features include quality scoring,
 * performance metrics, satisfaction tracking, and improvement recommendations.
 */

import { ObjectId } from 'mongodb';

// Types for quality management
export interface QualityMetrics {
  id: string;
  anonymousId: string;
  reviewId: string;
  manuscriptId: string;
  journalId: string;
  completionTime: number; // days from assignment to completion
  comprehensivenessScore: number; // 0-100 based on review depth
  timelinessScore: number; // 0-100 based on meeting deadlines
  qualityScore: number; // 0-100 overall quality assessment
  feedbackHelpfulnessScore?: number; // 0-100 from author feedback
  editorRating?: number; // 1-5 rating from editor
  reviewerSatisfactionScore?: number; // 1-5 self-reported satisfaction
  isAnonymous: true;
  timestamp: Date;
}

export interface QualityStandards {
  journalId: string;
  targetCompletionTime: number; // days (e.g., 21)
  minimumComprehensivenessScore: number; // e.g., 70
  minimumQualityScore: number; // e.g., 75
  targetSatisfactionScore: number; // e.g., 4.0/5
  qualityWeights: {
    timeliness: number; // e.g., 0.3
    comprehensiveness: number; // e.g., 0.4
    helpfulness: number; // e.g., 0.3
  };
  improvementThresholds: {
    excellent: number; // e.g., 90
    good: number; // e.g., 75
    needsImprovement: number; // e.g., 60
  };
}

export interface PerformanceAnalytics {
  anonymousId: string;
  totalReviewsCompleted: number;
  averageQualityScore: number;
  averageCompletionTime: number;
  onTimeCompletionRate: number;
  satisfactionRating: number;
  performanceLevel: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
  strengths: string[];
  improvementAreas: string[];
  trendAnalysis: {
    qualityTrend: 'improving' | 'stable' | 'declining';
    timelinesssTrend: 'improving' | 'stable' | 'declining';
    recentPerformanceChange: number; // percentage change
  };
  anonymizedBenchmarks: {
    percentileRank: number; // 0-100
    comparedToJournal: number; // relative score vs journal average
    comparedToGlobal: number; // relative score vs global average
  };
}

export interface QualityImprovement {
  id: string;
  anonymousId: string;
  recommendationType: 'training' | 'resource' | 'guidance' | 'mentoring';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: number; // 0-100
  recommendedActions: string[];
  resourceLinks?: string[];
  isPersonalized: boolean;
  timestamp: Date;
}

export interface SatisfactionSurvey {
  id: string;
  anonymousId: string;
  reviewId: string;
  overallSatisfaction: number; // 1-5
  interfaceUsability: number; // 1-5
  manuscriptQuality: number; // 1-5
  supportQuality: number; // 1-5
  timeAllocation: number; // 1-5
  anonymityProtection: number; // 1-5
  improvements: string[];
  positiveAspects: string[];
  openFeedback?: string;
  wouldRecommend: boolean;
  timestamp: Date;
}

/**
 * Quality scoring algorithms
 */
export class QualityScorer {
  private standards: QualityStandards;

  constructor(standards: QualityStandards) {
    this.standards = standards;
  }

  /**
   * Calculate comprehensiveness score based on review content
   */
  calculateComprehensivenessScore(reviewData: {
    sectionsCompleted: number;
    totalSections: number;
    averageResponseLength: number;
    detailLevel: 'minimal' | 'adequate' | 'comprehensive';
    annotationsCount: number;
    specificFeedbackProvided: boolean;
  }): number {
    let score = 0;

    // Section completion (40% of score)
    const sectionCompletion = (reviewData.sectionsCompleted / reviewData.totalSections) * 40;
    score += sectionCompletion;

    // Response detail level (30% of score)
    const detailScores = { minimal: 10, adequate: 20, comprehensive: 30 };
    score += detailScores[reviewData.detailLevel];

    // Annotations and specific feedback (20% of score)
    const annotationScore = Math.min(20, reviewData.annotationsCount * 2);
    score += annotationScore;

    // Specific feedback quality (10% of score)
    if (reviewData.specificFeedbackProvided) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate timeliness score based on completion time
   */
  calculateTimelinessScore(
    completionTime: number,
    targetTime: number = this.standards.targetCompletionTime
  ): number {
    if (completionTime <= targetTime) {
      return 100; // On time or early
    }

    const daysLate = completionTime - targetTime;
    const gracePeriod = Math.ceil(targetTime * 0.2); // 20% grace period

    if (daysLate <= gracePeriod) {
      // Linear decrease within grace period
      return Math.max(80, 100 - (daysLate / gracePeriod) * 20);
    } else {
      // Steeper decrease after grace period
      const additionalDays = daysLate - gracePeriod;
      return Math.max(0, 80 - additionalDays * 5);
    }
  }

  /**
   * Calculate overall quality score
   */
  calculateQualityScore(metrics: {
    comprehensivenessScore: number;
    timelinessScore: number;
    editorRating?: number;
    feedbackHelpfulnessScore?: number;
  }): number {
    const weights = this.standards.qualityWeights;
    let weightedScore = 0;
    let totalWeight = 0;

    // Comprehensiveness (always included)
    weightedScore += metrics.comprehensivenessScore * weights.comprehensiveness;
    totalWeight += weights.comprehensiveness;

    // Timeliness (always included)
    weightedScore += metrics.timelinessScore * weights.timeliness;
    totalWeight += weights.timeliness;

    // Helpfulness (if available)
    if (metrics.feedbackHelpfulnessScore !== undefined) {
      weightedScore += metrics.feedbackHelpfulnessScore * weights.helpfulness;
      totalWeight += weights.helpfulness;
    } else if (metrics.editorRating !== undefined) {
      // Use editor rating as proxy if helpfulness score unavailable
      const editorScore = (metrics.editorRating / 5) * 100;
      weightedScore += editorScore * weights.helpfulness;
      totalWeight += weights.helpfulness;
    }

    return Math.round(weightedScore / totalWeight);
  }

  /**
   * Determine performance level based on score
   */
  getPerformanceLevel(score: number): 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' {
    const thresholds = this.standards.improvementThresholds;
    
    if (score >= thresholds.excellent) return 'excellent';
    if (score >= thresholds.good) return 'good';
    if (score >= thresholds.needsImprovement) return 'satisfactory';
    return 'needs_improvement';
  }
}

/**
 * Performance analytics engine
 */
export class PerformanceAnalyzer {
  /**
   * Analyze reviewer performance trends
   */
  analyzePerformanceTrends(
    metrics: QualityMetrics[],
    windowSize: number = 5
  ): {
    qualityTrend: 'improving' | 'stable' | 'declining';
    timelinesssTrend: 'improving' | 'stable' | 'declining';
    recentPerformanceChange: number;
  } {
    if (metrics.length < 2) {
      return {
        qualityTrend: 'stable',
        timelinesssTrend: 'stable',
        recentPerformanceChange: 0,
      };
    }

    // Sort by timestamp (most recent first)
    const sortedMetrics = [...metrics].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );

    // Calculate trends using linear regression
    const qualityTrend = this.calculateTrend(
      sortedMetrics.slice(0, windowSize).map(m => m.qualityScore)
    );
    
    const timelinesssTrend = this.calculateTrend(
      sortedMetrics.slice(0, windowSize).map(m => m.timelinessScore)
    );

    // Calculate recent performance change
    const recentAvg = this.average(
      sortedMetrics.slice(0, Math.min(3, sortedMetrics.length))
        .map(m => m.qualityScore)
    );
    
    const previousAvg = this.average(
      sortedMetrics.slice(3, Math.min(6, sortedMetrics.length))
        .map(m => m.qualityScore)
    );

    const recentPerformanceChange = previousAvg > 0 
      ? ((recentAvg - previousAvg) / previousAvg) * 100 
      : 0;

    return {
      qualityTrend,
      timelinesssTrend,
      recentPerformanceChange: Math.round(recentPerformanceChange),
    };
  }

  /**
   * Calculate trend direction using simple slope analysis
   */
  private calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable';

    // Calculate simple linear trend
    const n = values.length;
    const xSum = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = values.reduce((sum, y, x) => sum + x * y, 0);
    const x2Sum = (n * (n - 1) * (2 * n - 1)) / 6; // 0² + 1² + 2² + ... + (n-1)²

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);

    if (Math.abs(slope) < 0.5) return 'stable';
    return slope > 0 ? 'improving' : 'declining';
  }

  /**
   * Calculate average of number array
   */
  private average(numbers: number[]): number {
    return numbers.length > 0 
      ? numbers.reduce((a, b) => a + b, 0) / numbers.length 
      : 0;
  }

  /**
   * Generate improvement recommendations
   */
  generateImprovementRecommendations(
    analytics: PerformanceAnalytics,
    metrics: QualityMetrics[]
  ): QualityImprovement[] {
    const recommendations: QualityImprovement[] = [];

    // Timeliness improvement
    if (analytics.onTimeCompletionRate < 80) {
      recommendations.push({
        id: new ObjectId().toString(),
        anonymousId: analytics.anonymousId,
        recommendationType: 'guidance',
        title: 'Improve Review Timeliness',
        description: 'Focus on meeting review deadlines to improve overall performance',
        priority: 'high',
        estimatedImpact: 85,
        recommendedActions: [
          'Set personal deadlines 2-3 days before official due date',
          'Break review into smaller daily tasks',
          'Use calendar reminders for key milestones',
          'Request extensions early if needed'
        ],
        isPersonalized: true,
        timestamp: new Date(),
      });
    }

    // Quality improvement
    if (analytics.averageQualityScore < 75) {
      recommendations.push({
        id: new ObjectId().toString(),
        anonymousId: analytics.anonymousId,
        recommendationType: 'training',
        title: 'Enhance Review Quality',
        description: 'Improve the depth and usefulness of your reviews',
        priority: 'high',
        estimatedImpact: 90,
        recommendedActions: [
          'Provide more specific, actionable feedback',
          'Include concrete examples in your comments',
          'Address all required review sections thoroughly',
          'Use annotation tools to highlight specific issues'
        ],
        resourceLinks: [
          '/resources/effective-peer-review-guide',
          '/resources/review-checklist'
        ],
        isPersonalized: true,
        timestamp: new Date(),
      });
    }

    // Satisfaction improvement
    if (analytics.satisfactionRating < 4.0) {
      recommendations.push({
        id: new ObjectId().toString(),
        anonymousId: analytics.anonymousId,
        recommendationType: 'resource',
        title: 'Enhance Review Experience',
        description: 'Improve your satisfaction with the review process',
        priority: 'medium',
        estimatedImpact: 70,
        recommendedActions: [
          'Explore interface customization options',
          'Use keyboard shortcuts for efficiency',
          'Take advantage of annotation tools',
          'Provide feedback on system improvements'
        ],
        isPersonalized: true,
        timestamp: new Date(),
      });
    }

    // Declining trend intervention
    if (analytics.trendAnalysis.qualityTrend === 'declining') {
      recommendations.push({
        id: new ObjectId().toString(),
        anonymousId: analytics.anonymousId,
        recommendationType: 'mentoring',
        title: 'Performance Support',
        description: 'Get additional support to reverse declining performance trend',
        priority: 'high',
        estimatedImpact: 80,
        recommendedActions: [
          'Schedule consultation with editorial team',
          'Review recent feedback from editors and authors',
          'Identify specific challenges affecting quality',
          'Develop personalized improvement plan'
        ],
        isPersonalized: true,
        timestamp: new Date(),
      });
    }

    return recommendations;
  }

  /**
   * Calculate anonymized benchmarks
   */
  calculateBenchmarks(
    reviewerMetrics: QualityMetrics[],
    journalMetrics: QualityMetrics[],
    globalMetrics: QualityMetrics[]
  ): {
    percentileRank: number;
    comparedToJournal: number;
    comparedToGlobal: number;
  } {
    const reviewerAvg = this.average(reviewerMetrics.map(m => m.qualityScore));
    const journalAvg = this.average(journalMetrics.map(m => m.qualityScore));
    const globalAvg = this.average(globalMetrics.map(m => m.qualityScore));

    // Calculate percentile rank
    const allScores = globalMetrics.map(m => m.qualityScore).sort((a, b) => a - b);
    const percentileRank = this.calculatePercentile(allScores, reviewerAvg);

    return {
      percentileRank: Math.round(percentileRank),
      comparedToJournal: Math.round(((reviewerAvg - journalAvg) / journalAvg) * 100),
      comparedToGlobal: Math.round(((reviewerAvg - globalAvg) / globalAvg) * 100),
    };
  }

  /**
   * Calculate percentile rank
   */
  private calculatePercentile(sortedValues: number[], value: number): number {
    let rank = 0;
    for (const v of sortedValues) {
      if (v <= value) rank++;
      else break;
    }
    return (rank / sortedValues.length) * 100;
  }
}

/**
 * Default quality standards for journals
 */
export const DEFAULT_QUALITY_STANDARDS: QualityStandards = {
  journalId: 'default',
  targetCompletionTime: 21,
  minimumComprehensivenessScore: 70,
  minimumQualityScore: 75,
  targetSatisfactionScore: 4.0,
  qualityWeights: {
    timeliness: 0.3,
    comprehensiveness: 0.4,
    helpfulness: 0.3,
  },
  improvementThresholds: {
    excellent: 90,
    good: 75,
    needsImprovement: 60,
  },
};

// Main quality management class
export class QualityManager {
  private scorer: QualityScorer;
  private analyzer: PerformanceAnalyzer;

  constructor(standards: QualityStandards = DEFAULT_QUALITY_STANDARDS) {
    this.scorer = new QualityScorer(standards);
    this.analyzer = new PerformanceAnalyzer();
  }

  /**
   * Evaluate a completed review
   */
  evaluateReview(reviewData: {
    anonymousId: string;
    reviewId: string;
    manuscriptId: string;
    journalId: string;
    completionTime: number;
    sectionsCompleted: number;
    totalSections: number;
    averageResponseLength: number;
    detailLevel: 'minimal' | 'adequate' | 'comprehensive';
    annotationsCount: number;
    specificFeedbackProvided: boolean;
    editorRating?: number;
    feedbackHelpfulnessScore?: number;
  }): QualityMetrics {
    const comprehensivenessScore = this.scorer.calculateComprehensivenessScore({
      sectionsCompleted: reviewData.sectionsCompleted,
      totalSections: reviewData.totalSections,
      averageResponseLength: reviewData.averageResponseLength,
      detailLevel: reviewData.detailLevel,
      annotationsCount: reviewData.annotationsCount,
      specificFeedbackProvided: reviewData.specificFeedbackProvided,
    });

    const timelinessScore = this.scorer.calculateTimelinessScore(reviewData.completionTime);

    const qualityScore = this.scorer.calculateQualityScore({
      comprehensivenessScore,
      timelinessScore,
      editorRating: reviewData.editorRating,
      feedbackHelpfulnessScore: reviewData.feedbackHelpfulnessScore,
    });

    return {
      id: new ObjectId().toString(),
      anonymousId: reviewData.anonymousId,
      reviewId: reviewData.reviewId,
      manuscriptId: reviewData.manuscriptId,
      journalId: reviewData.journalId,
      completionTime: reviewData.completionTime,
      comprehensivenessScore,
      timelinessScore,
      qualityScore,
      editorRating: reviewData.editorRating,
      feedbackHelpfulnessScore: reviewData.feedbackHelpfulnessScore,
      isAnonymous: true,
      timestamp: new Date(),
    };
  }

  /**
   * Generate comprehensive performance analytics
   */
  generatePerformanceAnalytics(
    anonymousId: string,
    metrics: QualityMetrics[],
    satisfactionSurveys: SatisfactionSurvey[] = []
  ): PerformanceAnalytics {
    const reviewerMetrics = metrics.filter(m => m.anonymousId === anonymousId);
    
    if (reviewerMetrics.length === 0) {
      return {
        anonymousId,
        totalReviewsCompleted: 0,
        averageQualityScore: 0,
        averageCompletionTime: 0,
        onTimeCompletionRate: 0,
        satisfactionRating: 0,
        performanceLevel: 'needs_improvement',
        strengths: [],
        improvementAreas: ['Complete more reviews to establish performance baseline'],
        trendAnalysis: {
          qualityTrend: 'stable',
          timelinesssTrend: 'stable',
          recentPerformanceChange: 0,
        },
        anonymizedBenchmarks: {
          percentileRank: 0,
          comparedToJournal: 0,
          comparedToGlobal: 0,
        },
      };
    }

    const avgQualityScore = this.analyzer.average(reviewerMetrics.map(m => m.qualityScore));
    const avgCompletionTime = this.analyzer.average(reviewerMetrics.map(m => m.completionTime));
    const onTimeReviews = reviewerMetrics.filter(m => m.timelinessScore >= 80).length;
    const onTimeRate = (onTimeReviews / reviewerMetrics.length) * 100;

    const avgSatisfaction = satisfactionSurveys.length > 0
      ? this.analyzer.average(satisfactionSurveys.map(s => s.overallSatisfaction))
      : 4.0;

    const performanceLevel = this.scorer.getPerformanceLevel(avgQualityScore);
    const trendAnalysis = this.analyzer.analyzePerformanceTrends(reviewerMetrics);

    // Identify strengths and improvement areas
    const strengths: string[] = [];
    const improvementAreas: string[] = [];

    if (avgQualityScore >= 85) strengths.push('High-quality reviews');
    if (onTimeRate >= 90) strengths.push('Excellent timeliness');
    if (avgSatisfaction >= 4.5) strengths.push('Positive review experience');

    if (avgQualityScore < 75) improvementAreas.push('Review quality and depth');
    if (onTimeRate < 80) improvementAreas.push('Meeting deadlines');
    if (avgSatisfaction < 4.0) improvementAreas.push('Review process satisfaction');

    return {
      anonymousId,
      totalReviewsCompleted: reviewerMetrics.length,
      averageQualityScore: Math.round(avgQualityScore),
      averageCompletionTime: Math.round(avgCompletionTime),
      onTimeCompletionRate: Math.round(onTimeRate),
      satisfactionRating: Math.round(avgSatisfaction * 10) / 10,
      performanceLevel,
      strengths,
      improvementAreas,
      trendAnalysis,
      anonymizedBenchmarks: {
        percentileRank: 0, // Would be calculated with comparison data
        comparedToJournal: 0,
        comparedToGlobal: 0,
      },
    };
  }
}

// Singleton instances
export const qualityManager = new QualityManager();
export const qualityScorer = qualityManager['scorer'];
export const performanceAnalyzer = qualityManager['analyzer'];

// Export utility functions
export const evaluateReview = (data: any) => qualityManager.evaluateReview(data);
export const generatePerformanceAnalytics = (id: string, metrics: QualityMetrics[], surveys?: SatisfactionSurvey[]) =>
  qualityManager.generatePerformanceAnalytics(id, metrics, surveys);

export default qualityManager;