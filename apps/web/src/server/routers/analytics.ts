import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import type { 
  AnalyticsMetrics, 
  SubmissionVolumeMetrics, 
  ProcessingTimeMetrics,
  EditorialEfficiencyMetrics,
  PublisherOverviewMetrics,
  AnalyticsEvent,
  TimeSeriesData,
  JournalVolumeData
} from '@shared/types';

export const analyticsRouter = createTRPCRouter({
  // Get comprehensive analytics metrics for a publisher
  getMetrics: protectedProcedure
    .input(z.object({
      publisherId: z.string(),
      dateRange: z.object({
        start: z.date(),
        end: z.date()
      }).optional(),
      journalIds: z.array(z.string()).optional()
    }))
    .query(async ({ ctx, input }) => {
      const { publisherId, dateRange, journalIds } = input;
      
      // Verify user has access to this publisher's analytics
      const publisher = await ctx.db.collection('publishers').findOne({ 
        _id: publisherId,
        adminUsers: ctx.session.user.id
      });
      
      if (!publisher) {
        throw new Error('Unauthorized: Cannot access analytics for this publisher');
      }

      // Build date filter
      const dateFilter = dateRange ? {
        createdAt: {
          $gte: dateRange.start,
          $lte: dateRange.end
        }
      } : {};

      // Build journal filter
      const journalFilter = journalIds?.length ? { 
        journalId: { $in: journalIds } 
      } : { 
        publisherId 
      };

      const combinedFilter = { ...dateFilter, ...journalFilter };

      // Get submission volume metrics
      const submissionVolume = await getSubmissionVolumeMetrics(ctx.db, publisherId, combinedFilter);
      
      // Get processing time metrics
      const processingTimes = await getProcessingTimeMetrics(ctx.db, publisherId, combinedFilter);
      
      // Get editorial efficiency metrics
      const editorialEfficiency = await getEditorialEfficiencyMetrics(ctx.db, publisherId, combinedFilter);
      
      // Get publisher overview metrics
      const publisherOverview = await getPublisherOverviewMetrics(ctx.db, publisherId, combinedFilter);
      
      // Get recent real-time events
      const realTimeEvents = await getRealTimeEvents(ctx.db, publisherId, 100);

      const analytics: AnalyticsMetrics = {
        submissionVolume,
        processingTimes,
        editorialEfficiency,
        publisherOverview,
        realTimeEvents,
        lastUpdated: new Date()
      };

      return analytics;
    }),

  // Get real-time submission volume data
  getSubmissionVolume: protectedProcedure
    .input(z.object({
      publisherId: z.string(),
      timeframe: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
      journalIds: z.array(z.string()).optional()
    }))
    .query(async ({ ctx, input }) => {
      const { publisherId, timeframe, journalIds } = input;
      
      // Verify access
      const publisher = await ctx.db.collection('publishers').findOne({ 
        _id: publisherId,
        adminUsers: ctx.session.user.id
      });
      
      if (!publisher) {
        throw new Error('Unauthorized: Cannot access analytics for this publisher');
      }

      const journalFilter = journalIds?.length ? { 
        journalId: { $in: journalIds } 
      } : { 
        publisherId 
      };

      return await getSubmissionVolumeMetrics(ctx.db, publisherId, journalFilter);
    }),

  // Get processing time analytics with bottleneck identification
  getProcessingTimes: protectedProcedure
    .input(z.object({
      publisherId: z.string(),
      journalIds: z.array(z.string()).optional()
    }))
    .query(async ({ ctx, input }) => {
      const { publisherId, journalIds } = input;
      
      // Verify access
      const publisher = await ctx.db.collection('publishers').findOne({ 
        _id: publisherId,
        adminUsers: ctx.session.user.id
      });
      
      if (!publisher) {
        throw new Error('Unauthorized: Cannot access analytics for this publisher');
      }

      const journalFilter = journalIds?.length ? { 
        journalId: { $in: journalIds } 
      } : { 
        publisherId 
      };

      return await getProcessingTimeMetrics(ctx.db, publisherId, journalFilter);
    }),

  // Get editorial team efficiency metrics
  getEditorialEfficiency: protectedProcedure
    .input(z.object({
      publisherId: z.string(),
      journalIds: z.array(z.string()).optional()
    }))
    .query(async ({ ctx, input }) => {
      const { publisherId, journalIds } = input;
      
      // Verify access
      const publisher = await ctx.db.collection('publishers').findOne({ 
        _id: publisherId,
        adminUsers: ctx.session.user.id
      });
      
      if (!publisher) {
        throw new Error('Unauthorized: Cannot access analytics for this publisher');
      }

      const journalFilter = journalIds?.length ? { 
        journalId: { $in: journalIds } 
      } : { 
        publisherId 
      };

      return await getEditorialEfficiencyMetrics(ctx.db, publisherId, journalFilter);
    }),

  // Stream real-time analytics events
  getRealtimeEvents: protectedProcedure
    .input(z.object({
      publisherId: z.string(),
      limit: z.number().default(50)
    }))
    .query(async ({ ctx, input }) => {
      const { publisherId, limit } = input;
      
      // Verify access
      const publisher = await ctx.db.collection('publishers').findOne({ 
        _id: publisherId,
        adminUsers: ctx.session.user.id
      });
      
      if (!publisher) {
        throw new Error('Unauthorized: Cannot access analytics for this publisher');
      }

      return await getRealTimeEvents(ctx.db, publisherId, limit);
    }),
});

// Helper functions for analytics calculations
async function getSubmissionVolumeMetrics(db: any, publisherId: string, filter: any): Promise<SubmissionVolumeMetrics> {
  // Get daily submission volumes for the last 30 days
  const daily = await db.collection('submissions').aggregate([
    { $match: { ...filter, publisherId } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } },
    { $limit: 30 }
  ]).toArray();

  // Get weekly volumes for the last 12 weeks
  const weekly = await db.collection('submissions').aggregate([
    { $match: { ...filter, publisherId } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-W%V', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } },
    { $limit: 12 }
  ]).toArray();

  // Get monthly volumes for the last 12 months
  const monthly = await db.collection('submissions').aggregate([
    { $match: { ...filter, publisherId } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } },
    { $limit: 12 }
  ]).toArray();

  // Get by journal breakdown
  const byJournal = await db.collection('submissions').aggregate([
    { $match: { ...filter, publisherId } },
    {
      $group: {
        _id: '$journalId',
        submissionCount: { $sum: 1 },
        totalProcessingTime: { $avg: { $subtract: ['$decisionDate', '$createdAt'] } }
      }
    },
    {
      $lookup: {
        from: 'journals',
        localField: '_id',
        foreignField: '_id',
        as: 'journal'
      }
    },
    {
      $lookup: {
        from: 'submissions',
        let: { journalId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$journalId', '$$journalId'] }, status: 'accepted' } },
          { $count: 'acceptedCount' }
        ],
        as: 'accepted'
      }
    }
  ]).toArray();

  const totalSubmissions = await db.collection('submissions').countDocuments({ ...filter, publisherId });
  
  // Calculate growth rate (comparing last 30 days to previous 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const recentCount = await db.collection('submissions').countDocuments({
    publisherId,
    createdAt: { $gte: thirtyDaysAgo }
  });
  
  const previousCount = await db.collection('submissions').countDocuments({
    publisherId,
    createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
  });

  const growthRate = previousCount > 0 ? ((recentCount - previousCount) / previousCount) * 100 : 0;

  return {
    daily: daily.map(d => ({ date: d._id, value: d.count })),
    weekly: weekly.map(w => ({ date: w._id, value: w.count })),
    monthly: monthly.map(m => ({ date: m._id, value: m.count })),
    byJournal: byJournal.map(j => ({
      journalId: j._id,
      journalName: j.journal[0]?.name || 'Unknown Journal',
      submissionCount: j.submissionCount,
      acceptanceRate: j.accepted[0]?.acceptedCount ? (j.accepted[0].acceptedCount / j.submissionCount) * 100 : 0,
      averageProcessingTime: j.totalProcessingTime || 0
    })),
    totalSubmissions,
    growthRate,
    peakSubmissionDays: daily
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map(d => d.date)
  };
}

async function getProcessingTimeMetrics(db: any, publisherId: string, filter: any): Promise<ProcessingTimeMetrics> {
  // Calculate average submission to decision time
  const processingStats = await db.collection('submissions').aggregate([
    { $match: { ...filter, publisherId, decisionDate: { $exists: true } } },
    {
      $project: {
        processingTime: {
          $divide: [
            { $subtract: ['$decisionDate', '$createdAt'] },
            1000 * 60 * 60 * 24 // Convert to days
          ]
        },
        reviewTime: {
          $divide: [
            { $subtract: ['$reviewCompletedDate', '$reviewStartedDate'] },
            1000 * 60 * 60 * 24 // Convert to days
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgSubmissionToDecision: { $avg: '$processingTime' },
        avgReviewTime: { $avg: '$reviewTime' },
        maxProcessingTime: { $max: '$processingTime' },
        totalSubmissions: { $sum: 1 }
      }
    }
  ]).toArray();

  const stats = processingStats[0] || {
    avgSubmissionToDecision: 0,
    avgReviewTime: 0,
    maxProcessingTime: 0,
    totalSubmissions: 0
  };

  // Identify bottlenecks by stage
  const bottlenecks = await identifyBottlenecks(db, publisherId, filter);

  // Get historical comparison for the last 6 months
  const historicalComparison = await getHistoricalProcessingComparison(db, publisherId, filter);

  return {
    averageSubmissionToDecision: stats.avgSubmissionToDecision,
    averageReviewTime: stats.avgReviewTime,
    bottleneckAnalysis: bottlenecks,
    historicalComparison,
    targetMetrics: {
      submissionToDecisionTarget: 90,
      reviewTimeTarget: 30
    }
  };
}

async function getEditorialEfficiencyMetrics(db: any, publisherId: string, filter: any): Promise<EditorialEfficiencyMetrics> {
  // Get reviewer response rates
  const reviewerResponseRates = await db.collection('reviews').aggregate([
    { $match: { ...filter, publisherId } },
    {
      $group: {
        _id: '$reviewerId',
        totalAssigned: { $sum: 1 },
        totalCompleted: { $sum: { $cond: [{ $ne: ['$completedAt', null] }, 1, 0] } },
        avgResponseTime: { 
          $avg: { 
            $subtract: ['$respondedAt', '$assignedAt'] 
          } 
        },
        qualityScore: { $avg: '$qualityRating' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'reviewer'
      }
    },
    { $limit: 20 }
  ]).toArray();

  // Get editorial team workload
  const editorialTeamWorkload = await db.collection('submissions').aggregate([
    { $match: { ...filter, publisherId, assignedEditor: { $exists: true } } },
    {
      $group: {
        _id: '$assignedEditor',
        activeSubmissions: { $sum: { $cond: [{ $in: ['$status', ['under_review', 'revision_requested']] }, 1, 0] } },
        totalProcessed: { $sum: 1 },
        avgDecisionTime: {
          $avg: {
            $divide: [
              { $subtract: ['$decisionDate', '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'editor'
      }
    },
    { $limit: 15 }
  ]).toArray();

  // Get decision timelines for active submissions
  const decisionTimelines = await db.collection('submissions').aggregate([
    { 
      $match: { 
        ...filter, 
        publisherId, 
        status: { $in: ['under_review', 'revision_requested', 'revision_submitted'] }
      } 
    },
    {
      $project: {
        submissionId: '$_id',
        submissionDate: '$createdAt',
        decisionDate: '$decisionDate',
        currentStage: '$status',
        daysInProcess: {
          $divide: [
            { $subtract: [new Date(), '$createdAt'] },
            1000 * 60 * 60 * 24
          ]
        },
        targetDays: 90,
        isOverdue: {
          $gt: [
            { $divide: [{ $subtract: [new Date(), '$createdAt'] }, 1000 * 60 * 60 * 24] },
            90
          ]
        }
      }
    },
    { $sort: { daysInProcess: -1 } },
    { $limit: 25 }
  ]).toArray();

  // Calculate performance trends
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const currentPeriodStats = await db.collection('submissions').aggregate([
    { $match: { publisherId, createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: null,
        avgProcessingTime: {
          $avg: {
            $divide: [
              { $subtract: ['$decisionDate', '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        },
        acceptanceRate: {
          $avg: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
        }
      }
    }
  ]).toArray();

  const previousPeriodStats = await db.collection('submissions').aggregate([
    { $match: { publisherId, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
    {
      $group: {
        _id: null,
        avgProcessingTime: {
          $avg: {
            $divide: [
              { $subtract: ['$decisionDate', '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        },
        acceptanceRate: {
          $avg: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
        }
      }
    }
  ]).toArray();

  const current = currentPeriodStats[0] || { avgProcessingTime: 0, acceptanceRate: 0 };
  const previous = previousPeriodStats[0] || { avgProcessingTime: 0, acceptanceRate: 0 };

  const performanceTrends = [
    {
      metric: 'Processing Time',
      trend: current.avgProcessingTime < previous.avgProcessingTime ? 'improving' as const : 'declining' as const,
      value: current.avgProcessingTime,
      previousValue: previous.avgProcessingTime,
      benchmarkValue: 90 // Industry benchmark
    },
    {
      metric: 'Acceptance Rate',
      trend: current.acceptanceRate > previous.acceptanceRate ? 'improving' as const : 'stable' as const,
      value: current.acceptanceRate * 100,
      previousValue: previous.acceptanceRate * 100,
      benchmarkValue: 25 // Industry benchmark
    }
  ];

  return {
    reviewerResponseRates: reviewerResponseRates.map(r => ({
      reviewerId: r._id,
      reviewerName: r.reviewer[0]?.name || 'Unknown Reviewer',
      responseRate: r.totalAssigned > 0 ? (r.totalCompleted / r.totalAssigned) * 100 : 0,
      averageReviewTime: Math.round((r.avgResponseTime || 0) / (1000 * 60 * 60 * 24)), // Convert to days
      totalReviews: r.totalCompleted,
      qualityScore: r.qualityScore || 0
    })),
    editorialTeamWorkload: editorialTeamWorkload.map(e => ({
      editorId: e._id,
      editorName: e.editor[0]?.name || 'Unknown Editor',
      activeSubmissions: e.activeSubmissions,
      avgDecisionTime: Math.round(e.avgDecisionTime || 0),
      workloadCapacity: Math.min((e.activeSubmissions / 10) * 100, 100), // Assuming capacity of 10 submissions
      efficiencyScore: e.avgDecisionTime > 0 ? Math.max(100 - (e.avgDecisionTime / 90) * 100, 0) : 100
    })),
    decisionTimelines: decisionTimelines.map(d => ({
      submissionId: d.submissionId,
      submissionDate: d.submissionDate,
      decisionDate: d.decisionDate,
      currentStage: d.currentStage,
      daysInProcess: Math.round(d.daysInProcess),
      targetDays: d.targetDays,
      isOverdue: d.isOverdue
    })),
    performanceTrends
  };
}

async function getPublisherOverviewMetrics(db: any, publisherId: string, filter: any): Promise<PublisherOverviewMetrics> {
  const totalJournals = await db.collection('journals').countDocuments({ publisherId });
  const activeSubmissions = await db.collection('submissions').countDocuments({ 
    publisherId, 
    status: { $in: ['under_review', 'revision_requested', 'revision_submitted'] }
  });

  return {
    totalJournals,
    activeSubmissions,
    monthlyRevenue: 0, // Would calculate from billing data
    operationalEfficiency: 85, // Mock value
    complianceScore: 95, // Mock value
    industryBenchmarks: []
  };
}

async function getRealTimeEvents(db: any, publisherId: string, limit: number): Promise<AnalyticsEvent[]> {
  return await db.collection('analytics_events').find({ publisherId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
}

async function identifyBottlenecks(db: any, publisherId: string, filter: any) {
  // Mock implementation for bottleneck analysis
  return [
    {
      stage: 'review' as const,
      averageTime: 45,
      maxTime: 120,
      affectedSubmissions: 25,
      recommendations: [
        'Consider increasing reviewer pool',
        'Implement automated reviewer assignment',
        'Set up review deadline reminders'
      ]
    }
  ];
}

async function getHistoricalProcessingComparison(db: any, publisherId: string, filter: any) {
  // Mock implementation for historical comparison
  return [
    {
      period: '2024-08',
      current: 75,
      previous: 82,
      change: -7,
      changePercentage: -8.5
    }
  ];
}