'use client';

import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import type { AnalyticsMetrics } from '@shared/types';
import { SubmissionVolumeChart } from './charts/SubmissionVolumeChart';
import { ProcessingTimeChart } from './charts/ProcessingTimeChart';
import { MetricsOverview } from './metrics/MetricsOverview';
import { RealTimeEventsFeed } from './real-time/RealTimeEventsFeed';
import { AnalyticsPerformanceMonitor } from '@/lib/analytics/real-time';

interface AnalyticsDashboardProps {
  publisherId: string;
  className?: string;
}

export function AnalyticsDashboard({ publisherId, className = '' }: AnalyticsDashboardProps) {
  const [selectedJournals, setSelectedJournals] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  });
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [dashboardLoadTime, setDashboardLoadTime] = useState<number>(0);

  // Track dashboard load time
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      setDashboardLoadTime(loadTime);
      AnalyticsPerformanceMonitor.recordDashboardLoadTime(loadTime);
    };
  }, []);

  // Main analytics data query with auto-refresh
  const { data: analytics, isLoading, error, refetch } = trpc.analytics.getMetrics.useQuery(
    {
      publisherId,
      dateRange,
      journalIds: selectedJournals.length > 0 ? selectedJournals : undefined
    },
    {
      refetchInterval: refreshInterval,
      staleTime: 5000, // Consider data stale after 5 seconds
      cacheTime: 60000, // Keep in cache for 1 minute
      onSuccess: () => {
        AnalyticsPerformanceMonitor.recordMemoryUsage();
      },
      onError: (error: Error) => {
        console.error('Analytics fetch error:', error);
      }
    }
  );

  // Real-time events query
  const { data: realtimeEvents } = trpc.analytics.getRealtimeEvents.useQuery(
    { publisherId, limit: 50 },
    { refetchInterval: 5000 } // More frequent refresh for real-time events
  );

  // Handle refresh interval changes
  const handleRefreshIntervalChange = (newInterval: number) => {
    setRefreshInterval(newInterval);
  };

  // Reserved for future use - journal selection and date range changes
  // const handleJournalSelection = (journalIds: string[]) => {
  //   setSelectedJournals(journalIds);
  // };
  // const handleDateRangeChange = (start: Date, end: Date) => {
  //   setDateRange({ start, end });
  // };

  // Manual refresh handler
  const handleRefresh = () => {
    refetch();
  };

  if (isLoading && !analytics) {
    return (
      <div className={`analytics-dashboard ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`analytics-dashboard ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Analytics Error</h3>
          <p className="text-red-600 mt-1">{error.message}</p>
          <button 
            onClick={handleRefresh}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`analytics-dashboard space-y-6 ${className}`}>
      {/* Dashboard Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Real-Time Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Last updated: {analytics?.lastUpdated ? new Date(analytics.lastUpdated).toLocaleTimeString() : 'Never'}
          </p>
          {dashboardLoadTime > 0 && (
            <p className="text-sm text-gray-500">
              Load time: {Math.round(dashboardLoadTime)}ms
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Refresh Interval Selector */}
          <select
            value={refreshInterval}
            onChange={(e) => handleRefreshIntervalChange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value={5000}>Refresh every 5s</option>
            <option value={15000}>Refresh every 15s</option>
            <option value={30000}>Refresh every 30s</option>
            <option value={60000}>Refresh every 1m</option>
          </select>
          
          {/* Manual Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <MetricsOverview 
        analytics={analytics}
        isLoading={isLoading}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submission Volume Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Volume Trends</h2>
            <SubmissionVolumeChart 
              data={analytics?.submissionVolume}
              isLoading={isLoading}
              className="h-64"
            />
          </div>

          {/* Processing Time Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Time Analytics</h2>
            <ProcessingTimeChart 
              data={analytics?.processingTimes}
              isLoading={isLoading}
              className="h-64"
            />
          </div>
        </div>

        {/* Sidebar - Takes 1 column */}
        <div className="space-y-6">
          {/* Real-Time Events Feed */}
          <RealTimeEventsFeed 
            events={realtimeEvents}
            publisherId={publisherId}
            className="h-96"
          />
        </div>
      </div>

      {/* Performance Metrics (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Performance Metrics (Dev Only)</h3>
          <div className="text-xs text-gray-600 grid grid-cols-3 gap-4">
            <div>
              <span className="font-medium">Dashboard Load:</span> {Math.round(dashboardLoadTime)}ms
            </div>
            <div>
              <span className="font-medium">Refresh Rate:</span> {refreshInterval/1000}s
            </div>
            <div>
              <span className="font-medium">Data Points:</span> {analytics?.submissionVolume?.totalSubmissions || 0}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsDashboard;