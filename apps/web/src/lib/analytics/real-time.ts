import type { AnalyticsEvent } from '@shared/types';

export class AnalyticsEventEmitter {
  private listeners: Map<string, Set<(event: AnalyticsEvent) => void>> = new Map();
  private static instance: AnalyticsEventEmitter;

  static getInstance(): AnalyticsEventEmitter {
    if (!this.instance) {
      this.instance = new AnalyticsEventEmitter();
    }
    return this.instance;
  }

  subscribe(publisherId: string, callback: (event: AnalyticsEvent) => void) {
    if (!this.listeners.has(publisherId)) {
      this.listeners.set(publisherId, new Set());
    }
    this.listeners.get(publisherId)!.add(callback);

    return () => {
      const subscribers = this.listeners.get(publisherId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.listeners.delete(publisherId);
        }
      }
    };
  }

  emit(publisherId: string, event: AnalyticsEvent) {
    const subscribers = this.listeners.get(publisherId);
    if (subscribers) {
      subscribers.forEach(callback => callback(event));
    }
  }

  getSubscriberCount(publisherId: string): number {
    return this.listeners.get(publisherId)?.size || 0;
  }
}

export const analyticsEmitter = AnalyticsEventEmitter.getInstance();

// Real-time event tracking functions
export async function trackSubmissionEvent(
  db: any,
  publisherId: string,
  journalId: string,
  submissionId: string,
  eventType: 'submission' | 'review' | 'decision' | 'publication',
  data: Record<string, any>
) {
  const event: AnalyticsEvent = {
    id: generateEventId(),
    type: eventType,
    timestamp: new Date(),
    journalId,
    submissionId,
    data
  };

  // Store in database for persistence
  await db.collection('analytics_events').insertOne({
    ...event,
    publisherId
  });

  // Emit to real-time subscribers
  analyticsEmitter.emit(publisherId, event);

  return event;
}

export async function aggregateRealTimeMetrics(db: any, publisherId: string) {
  const currentDate = new Date();
  const todayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  
  const todayEvents = await db.collection('analytics_events')
    .find({ 
      publisherId, 
      timestamp: { $gte: todayStart } 
    })
    .toArray();

  const metrics = {
    todaySubmissions: todayEvents.filter(e => e.type === 'submission').length,
    todayDecisions: todayEvents.filter(e => e.type === 'decision').length,
    activeReviews: todayEvents.filter(e => e.type === 'review' && e.data.status === 'started').length,
    lastUpdated: currentDate
  };

  // Emit aggregated metrics update
  analyticsEmitter.emit(publisherId, {
    id: generateEventId(),
    type: 'submission', // Using submission as default type
    timestamp: currentDate,
    journalId: 'aggregate',
    data: { type: 'metrics_update', metrics }
  });

  return metrics;
}

function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Analytics data refresh scheduler
export class AnalyticsRefreshScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  scheduleRefresh(publisherId: string, intervalMs: number, refreshCallback: () => Promise<void>) {
    // Clear existing interval if any
    this.clearRefresh(publisherId);

    const interval = setInterval(async () => {
      try {
        await refreshCallback();
      } catch (error) {
        console.error(`Analytics refresh failed for publisher ${publisherId}:`, error);
      }
    }, intervalMs);

    this.intervals.set(publisherId, interval);
  }

  clearRefresh(publisherId: string) {
    const interval = this.intervals.get(publisherId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(publisherId);
    }
  }

  clearAllRefreshes() {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }
}

export const refreshScheduler = new AnalyticsRefreshScheduler();

// Performance monitoring for analytics dashboard
export class AnalyticsPerformanceMonitor {
  private static metrics: {
    dashboardLoadTimes: number[];
    queryExecutionTimes: Map<string, number[]>;
    memoryUsage: number[];
  } = {
    dashboardLoadTimes: [],
    queryExecutionTimes: new Map(),
    memoryUsage: []
  };

  static recordDashboardLoadTime(timeMs: number) {
    this.metrics.dashboardLoadTimes.push(timeMs);
    
    // Keep only last 100 measurements
    if (this.metrics.dashboardLoadTimes.length > 100) {
      this.metrics.dashboardLoadTimes.shift();
    }
  }

  static recordQueryTime(queryName: string, timeMs: number) {
    if (!this.metrics.queryExecutionTimes.has(queryName)) {
      this.metrics.queryExecutionTimes.set(queryName, []);
    }
    
    const times = this.metrics.queryExecutionTimes.get(queryName)!;
    times.push(timeMs);
    
    // Keep only last 50 measurements per query
    if (times.length > 50) {
      times.shift();
    }
  }

  static recordMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      this.metrics.memoryUsage.push(usage.heapUsed / 1024 / 1024); // MB
      
      // Keep only last 100 measurements
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift();
      }
    }
  }

  static getAverageDashboardLoadTime(): number {
    const times = this.metrics.dashboardLoadTimes;
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  static getAverageQueryTime(queryName: string): number {
    const times = this.metrics.queryExecutionTimes.get(queryName) || [];
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  static getPerformanceReport() {
    return {
      avgDashboardLoadTime: this.getAverageDashboardLoadTime(),
      queryPerformance: Object.fromEntries(
        Array.from(this.metrics.queryExecutionTimes.entries()).map(([name, times]) => [
          name,
          {
            avgTime: times.reduce((a, b) => a + b, 0) / times.length,
            minTime: Math.min(...times),
            maxTime: Math.max(...times),
            sampleCount: times.length
          }
        ])
      ),
      memoryUsage: {
        current: this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1] || 0,
        average: this.metrics.memoryUsage.reduce((a, b) => a + b, 0) / this.metrics.memoryUsage.length || 0,
        peak: Math.max(...this.metrics.memoryUsage) || 0
      }
    };
  }
}