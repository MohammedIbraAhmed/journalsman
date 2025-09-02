import type { 
  TimeSeriesData, 
  BenchmarkData, 
  ReviewerEfficiencyData, 
  DecisionTimelineData 
} from '@shared/types';

export class AcademicKPICalculator {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  /**
   * Calculate submission-to-decision time KPIs with industry benchmarks
   */
  async calculateSubmissionToDecisionKPIs(publisherId: string, dateRange?: { start: Date; end: Date }) {
    const filter = this.buildDateFilter(publisherId, dateRange);
    
    // Get all submissions with decisions
    const submissions = await this.db.collection('submissions').aggregate([
      { $match: { ...filter, decisionDate: { $exists: true, $ne: null } } },
      {
        $project: {
          submissionDate: '$createdAt',
          decisionDate: '$decisionDate',
          decision: '$status',
          journalId: '$journalId',
          processingTime: {
            $divide: [
              { $subtract: ['$decisionDate', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      }
    ]).toArray();

    if (submissions.length === 0) {
      return this.getEmptyKPIs();
    }

    // Calculate basic statistics
    const processingTimes = submissions.map(s => s.processingTime);
    const avgProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
    const medianProcessingTime = this.calculateMedian(processingTimes);
    const percentile90 = this.calculatePercentile(processingTimes, 90);

    // Calculate acceptance rate
    const acceptedSubmissions = submissions.filter(s => s.decision === 'accepted').length;
    const acceptanceRate = (acceptedSubmissions / submissions.length) * 100;

    // Calculate by journal breakdown
    const journalBreakdown = await this.calculateByJournalKPIs(submissions);

    // Calculate time series data (monthly breakdown)
    const timeSeriesData = await this.calculateTimeSeriesKPIs(submissions);

    // Industry benchmarks
    const benchmarks = this.getIndustryBenchmarks();

    return {
      averageSubmissionToDecision: Math.round(avgProcessingTime),
      medianSubmissionToDecision: Math.round(medianProcessingTime),
      percentile90ProcessingTime: Math.round(percentile90),
      acceptanceRate,
      totalSubmissionsProcessed: submissions.length,
      journalBreakdown,
      timeSeriesData,
      benchmarks,
      performanceGrade: this.calculatePerformanceGrade(avgProcessingTime, acceptanceRate),
      recommendations: this.generateRecommendations(avgProcessingTime, acceptanceRate, processingTimes)
    };
  }

  /**
   * Calculate reviewer response rates and efficiency metrics
   */
  async calculateReviewerKPIs(publisherId: string, dateRange?: { start: Date; end: Date }) {
    const filter = this.buildDateFilter(publisherId, dateRange);

    // Get all review assignments
    const reviews = await this.db.collection('reviews').aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'reviewerId',
          foreignField: '_id',
          as: 'reviewer'
        }
      },
      {
        $project: {
          reviewerId: '$reviewerId',
          reviewerName: { $arrayElemAt: ['$reviewer.name', 0] },
          assignedDate: '$assignedAt',
          responseDate: '$respondedAt',
          completionDate: '$completedAt',
          qualityRating: '$qualityRating',
          isCompleted: { $ne: ['$completedAt', null] },
          responseTime: {
            $cond: {
              if: { $ne: ['$respondedAt', null] },
              then: {
                $divide: [
                  { $subtract: ['$respondedAt', '$assignedAt'] },
                  1000 * 60 * 60 * 24
                ]
              },
              else: null
            }
          },
          reviewTime: {
            $cond: {
              if: { $ne: ['$completedAt', null] },
              then: {
                $divide: [
                  { $subtract: ['$completedAt', '$respondedAt'] },
                  1000 * 60 * 60 * 24
                ]
              },
              else: null
            }
          }
        }
      }
    ]).toArray();

    // Group by reviewer
    const reviewerStats = reviews.reduce((acc, review) => {
      const reviewerId = review.reviewerId;
      if (!acc[reviewerId]) {
        acc[reviewerId] = {
          reviewerId,
          reviewerName: review.reviewerName || 'Unknown',
          totalAssigned: 0,
          totalCompleted: 0,
          totalResponded: 0,
          responseTimes: [],
          reviewTimes: [],
          qualityRatings: []
        };
      }

      acc[reviewerId].totalAssigned++;
      if (review.isCompleted) acc[reviewerId].totalCompleted++;
      if (review.responseDate) acc[reviewerId].totalResponded++;
      if (review.responseTime) acc[reviewerId].responseTimes.push(review.responseTime);
      if (review.reviewTime) acc[reviewerId].reviewTimes.push(review.reviewTime);
      if (review.qualityRating) acc[reviewerId].qualityRatings.push(review.qualityRating);

      return acc;
    }, {} as Record<string, any>);

    // Calculate reviewer efficiency metrics
    const reviewerEfficiency: ReviewerEfficiencyData[] = Object.values(reviewerStats).map((stats: any) => ({
      reviewerId: stats.reviewerId,
      reviewerName: stats.reviewerName,
      responseRate: (stats.totalResponded / stats.totalAssigned) * 100,
      averageReviewTime: stats.reviewTimes.length > 0 
        ? stats.reviewTimes.reduce((sum: number, time: number) => sum + time, 0) / stats.reviewTimes.length
        : 0,
      totalReviews: stats.totalCompleted,
      qualityScore: stats.qualityRatings.length > 0
        ? stats.qualityRatings.reduce((sum: number, rating: number) => sum + rating, 0) / stats.qualityRatings.length
        : 0
    }));

    // Calculate overall reviewer KPIs
    const overallResponseRate = reviews.length > 0 
      ? (reviews.filter(r => r.responseDate).length / reviews.length) * 100 
      : 0;

    const overallCompletionRate = reviews.length > 0 
      ? (reviews.filter(r => r.isCompleted).length / reviews.length) * 100 
      : 0;

    const avgResponseTime = reviews
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / reviews.filter(r => r.responseTime).length || 0;

    const avgReviewTime = reviews
      .filter(r => r.reviewTime)
      .reduce((sum, r) => sum + r.reviewTime, 0) / reviews.filter(r => r.reviewTime).length || 0;

    return {
      overallResponseRate,
      overallCompletionRate,
      averageResponseTime: Math.round(avgResponseTime),
      averageReviewTime: Math.round(avgReviewTime),
      totalReviewsAssigned: reviews.length,
      totalReviewsCompleted: reviews.filter(r => r.isCompleted).length,
      reviewerEfficiency: reviewerEfficiency.sort((a, b) => b.qualityScore - a.qualityScore).slice(0, 20),
      topPerformers: reviewerEfficiency
        .filter(r => r.totalReviews >= 3) // Minimum threshold
        .sort((a, b) => (b.qualityScore * b.responseRate / 100) - (a.qualityScore * a.responseRate / 100))
        .slice(0, 5),
      underperformers: reviewerEfficiency
        .filter(r => r.totalReviews >= 3 && (r.responseRate < 70 || r.qualityScore < 3))
        .slice(0, 5)
    };
  }

  /**
   * Calculate operational efficiency metrics
   */
  async calculateOperationalKPIs(publisherId: string) {
    // Calculate various operational metrics
    const [
      submissionMetrics,
      editorialMetrics,
      systemMetrics,
      costMetrics
    ] = await Promise.all([
      this.calculateSubmissionEfficiency(publisherId),
      this.calculateEditorialEfficiency(publisherId),
      this.calculateSystemEfficiency(publisherId),
      this.calculateCostEfficiency(publisherId)
    ]);

    // Calculate overall operational efficiency score
    const operationalEfficiencyScore = Math.round(
      (submissionMetrics.score * 0.3 +
       editorialMetrics.score * 0.3 +
       systemMetrics.score * 0.2 +
       costMetrics.score * 0.2)
    );

    return {
      operationalEfficiencyScore,
      submissionEfficiency: submissionMetrics,
      editorialEfficiency: editorialMetrics,
      systemEfficiency: systemMetrics,
      costEfficiency: costMetrics,
      recommendations: this.generateOperationalRecommendations({
        submissionMetrics,
        editorialMetrics,
        systemMetrics,
        costMetrics
      })
    };
  }

  // Helper methods
  private buildDateFilter(publisherId: string, dateRange?: { start: Date; end: Date }) {
    const filter: any = { publisherId };
    if (dateRange) {
      filter.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }
    return filter;
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private calculateByJournalKPIs(submissions: any[]) {
    const journalGroups = submissions.reduce((acc, submission) => {
      const journalId = submission.journalId;
      if (!acc[journalId]) {
        acc[journalId] = [];
      }
      acc[journalId].push(submission);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(journalGroups).map(([journalId, subs]) => {
      const processingTimes = subs.map(s => s.processingTime);
      const acceptedCount = subs.filter(s => s.decision === 'accepted').length;
      
      return {
        journalId,
        submissionCount: subs.length,
        averageProcessingTime: Math.round(processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length),
        acceptanceRate: (acceptedCount / subs.length) * 100,
        medianProcessingTime: Math.round(this.calculateMedian(processingTimes))
      };
    });
  }

  private calculateTimeSeriesKPIs(submissions: any[]): TimeSeriesData[] {
    const monthlyData = submissions.reduce((acc, submission) => {
      const month = new Date(submission.submissionDate).toISOString().substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { count: 0, totalProcessingTime: 0 };
      }
      acc[month].count++;
      acc[month].totalProcessingTime += submission.processingTime;
      return acc;
    }, {} as Record<string, { count: number; totalProcessingTime: number }>);

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        date: month,
        value: Math.round(data.totalProcessingTime / data.count),
        label: `${data.count} submissions`
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getIndustryBenchmarks(): BenchmarkData[] {
    return [
      {
        metric: 'Submission to Decision Time',
        currentValue: 0, // Will be filled by caller
        industryAverage: 120,
        topQuartile: 90,
        targetValue: 90
      },
      {
        metric: 'Acceptance Rate',
        currentValue: 0, // Will be filled by caller
        industryAverage: 25,
        topQuartile: 30,
        targetValue: 25
      }
    ];
  }

  private calculatePerformanceGrade(avgProcessingTime: number, acceptanceRate: number): string {
    let score = 0;
    
    // Processing time score (40% weight)
    if (avgProcessingTime <= 60) score += 40;
    else if (avgProcessingTime <= 90) score += 30;
    else if (avgProcessingTime <= 120) score += 20;
    else score += 10;
    
    // Acceptance rate score (30% weight)
    if (acceptanceRate >= 20 && acceptanceRate <= 30) score += 30;
    else if (acceptanceRate >= 15 && acceptanceRate <= 35) score += 25;
    else score += 15;
    
    // Additional 30 points for consistency and other factors
    score += 30;
    
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private generateRecommendations(avgProcessingTime: number, acceptanceRate: number, processingTimes: number[]): string[] {
    const recommendations: string[] = [];
    
    if (avgProcessingTime > 90) {
      recommendations.push('Consider streamlining the review process to reduce processing time');
      recommendations.push('Implement automated reviewer assignment to reduce delays');
    }
    
    if (acceptanceRate < 15) {
      recommendations.push('Review submission guidelines to ensure quality submissions');
    } else if (acceptanceRate > 40) {
      recommendations.push('Consider raising editorial standards to maintain journal quality');
    }
    
    const variance = this.calculateVariance(processingTimes);
    if (variance > 1000) {
      recommendations.push('Work on standardizing review timelines across submissions');
    }
    
    return recommendations;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private getEmptyKPIs() {
    return {
      averageSubmissionToDecision: 0,
      medianSubmissionToDecision: 0,
      percentile90ProcessingTime: 0,
      acceptanceRate: 0,
      totalSubmissionsProcessed: 0,
      journalBreakdown: [],
      timeSeriesData: [],
      benchmarks: this.getIndustryBenchmarks(),
      performanceGrade: 'N/A',
      recommendations: ['No data available for analysis']
    };
  }

  // Placeholder methods for operational efficiency calculations
  private async calculateSubmissionEfficiency(publisherId: string) {
    // Mock implementation
    return { score: 85, metrics: {} };
  }

  private async calculateEditorialEfficiency(publisherId: string) {
    // Mock implementation
    return { score: 78, metrics: {} };
  }

  private async calculateSystemEfficiency(publisherId: string) {
    // Mock implementation
    return { score: 92, metrics: {} };
  }

  private async calculateCostEfficiency(publisherId: string) {
    // Mock implementation
    return { score: 80, metrics: {} };
  }

  private generateOperationalRecommendations(metrics: any): string[] {
    return [
      'Implement automated workflow optimization',
      'Consider reviewer pool expansion',
      'Optimize editorial team workload distribution'
    ];
  }
}