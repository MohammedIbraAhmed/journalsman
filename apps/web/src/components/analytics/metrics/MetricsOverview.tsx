'use client';

import React from 'react';
import type { AnalyticsMetrics } from '@shared/types';

interface MetricsOverviewProps {
  analytics?: AnalyticsMetrics;
  isLoading: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  icon: React.ReactNode;
  isLoading: boolean;
  subtitle?: string;
}

function MetricCard({ title, value, change, icon, isLoading, subtitle }: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div className="w-20 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="mt-4 w-24 h-8 bg-gray-200 rounded"></div>
        <div className="mt-2 w-32 h-3 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-shrink-0">
          {icon}
        </div>
        {change && (
          <div className={`flex items-center text-sm font-medium ${
            change.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <svg 
              className={`w-4 h-4 mr-1 ${change.isPositive ? '' : 'transform rotate-180'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            {Math.abs(change.value)}%
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
        {change && (
          <p className="text-xs text-gray-500 mt-1">{change.label}</p>
        )}
      </div>
    </div>
  );
}

export function MetricsOverview({ analytics, isLoading }: MetricsOverviewProps) {
  // Calculate derived metrics
  const totalSubmissions = analytics?.submissionVolume?.totalSubmissions || 0;
  const avgProcessingTime = Math.round(analytics?.processingTimes?.averageSubmissionToDecision || 0);
  const activeSubmissions = analytics?.publisherOverview?.activeSubmissions || 0;
  const totalJournals = analytics?.publisherOverview?.totalJournals || 0;

  // Mock change calculations (in real implementation, these would come from historical comparison)
  const submissionGrowth = analytics?.submissionVolume?.growthRate || 0;
  const processingTimeImprovement = avgProcessingTime > 0 ? 
    ((90 - avgProcessingTime) / 90) * 100 : 0; // Comparing against 90-day target

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Submissions */}
      <MetricCard
        title="Total Submissions"
        value={totalSubmissions}
        change={submissionGrowth !== 0 ? {
          value: Math.abs(submissionGrowth),
          isPositive: submissionGrowth > 0,
          label: "vs last 30 days"
        } : undefined}
        icon={
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        }
        subtitle="All-time submissions"
        isLoading={isLoading}
      />

      {/* Average Processing Time */}
      <MetricCard
        title="Avg Processing Time"
        value={avgProcessingTime > 0 ? `${avgProcessingTime} days` : 'No data'}
        change={processingTimeImprovement > 0 ? {
          value: Math.round(processingTimeImprovement),
          isPositive: true,
          label: "better than 90-day target"
        } : undefined}
        icon={
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        }
        subtitle="Submission to decision"
        isLoading={isLoading}
      />

      {/* Active Submissions */}
      <MetricCard
        title="Active Submissions"
        value={activeSubmissions}
        icon={
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        }
        subtitle="Currently in review"
        isLoading={isLoading}
      />

      {/* Active Journals */}
      <MetricCard
        title="Active Journals"
        value={totalJournals}
        icon={
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        }
        subtitle="Publishing journals"
        isLoading={isLoading}
      />

      {/* Performance Indicators */}
      {analytics && (
        <>
          {/* Review Time */}
          <MetricCard
            title="Avg Review Time"
            value={`${Math.round(analytics.processingTimes?.averageReviewTime || 0)} days`}
            change={{
              value: Math.round(((30 - (analytics.processingTimes?.averageReviewTime || 30)) / 30) * 100),
              isPositive: (analytics.processingTimes?.averageReviewTime || 30) < 30,
              label: "vs 30-day target"
            }}
            icon={
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            }
            subtitle="Peer review duration"
            isLoading={isLoading}
          />

          {/* Operational Efficiency */}
          <MetricCard
            title="Operational Efficiency"
            value={`${analytics.publisherOverview?.operationalEfficiency || 0}%`}
            change={{
              value: 5.2,
              isPositive: true,
              label: "vs industry average"
            }}
            icon={
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            }
            subtitle="Overall system performance"
            isLoading={isLoading}
          />

          {/* Compliance Score */}
          <MetricCard
            title="Compliance Score"
            value={`${analytics.publisherOverview?.complianceScore || 0}%`}
            change={{
              value: 2.1,
              isPositive: true,
              label: "vs last month"
            }}
            icon={
              <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            }
            subtitle="Academic standards adherence"
            isLoading={isLoading}
          />

          {/* Growth Rate */}
          <MetricCard
            title="Submission Growth"
            value={`${submissionGrowth > 0 ? '+' : ''}${submissionGrowth.toFixed(1)}%`}
            change={{
              value: Math.abs(submissionGrowth),
              isPositive: submissionGrowth > 0,
              label: "month over month"
            }}
            icon={
              <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            }
            subtitle="Submission volume trend"
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
}