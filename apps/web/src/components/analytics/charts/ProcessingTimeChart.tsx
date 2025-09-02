'use client';

import React, { useState } from 'react';
import type { ProcessingTimeMetrics } from '@shared/types';

interface ProcessingTimeChartProps {
  data?: ProcessingTimeMetrics;
  isLoading: boolean;
  className?: string;
}

export function ProcessingTimeChart({ data, isLoading, className = '' }: ProcessingTimeChartProps) {
  const [activeView, setActiveView] = useState<'overview' | 'bottlenecks' | 'trends'>('overview');

  if (isLoading || !data) {
    return (
      <div className={`processing-time-chart ${className}`}>
        <div className="animate-pulse">
          {/* Chart Controls Skeleton */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <div className="w-20 h-8 bg-gray-200 rounded"></div>
              <div className="w-20 h-8 bg-gray-200 rounded"></div>
              <div className="w-20 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
          
          {/* Chart Area Skeleton */}
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const renderOverviewChart = () => {
    const avgSubmissionTime = data.averageSubmissionToDecision;
    const avgReviewTime = data.averageReviewTime;
    const submissionTarget = data.targetMetrics.submissionToDecisionTarget;
    const reviewTarget = data.targetMetrics.reviewTimeTarget;

    return (
      <div className="h-48">
        <div className="grid grid-cols-2 gap-8 h-full">
          {/* Submission to Decision Time */}
          <div className="flex flex-col justify-center">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">Submission to Decision</h4>
            <div className="relative">
              {/* Circular Progress */}
              <div className="mx-auto w-24 h-24 relative">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 24 24">
                  {/* Background circle */}
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke={avgSubmissionTime <= submissionTarget ? "#10b981" : "#ef4444"}
                    strokeWidth="2"
                    strokeDasharray={`${Math.min((avgSubmissionTime / submissionTarget) * 62.83, 62.83)} 62.83`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{Math.round(avgSubmissionTime)}</div>
                    <div className="text-xs text-gray-600">days</div>
                  </div>
                </div>
              </div>
              <div className="text-center mt-2">
                <div className="text-sm text-gray-600">Target: {submissionTarget} days</div>
                <div className={`text-xs font-medium ${avgSubmissionTime <= submissionTarget ? 'text-green-600' : 'text-red-600'}`}>
                  {avgSubmissionTime <= submissionTarget ? 'On Track' : 'Behind Target'}
                </div>
              </div>
            </div>
          </div>

          {/* Review Time */}
          <div className="flex flex-col justify-center">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">Average Review Time</h4>
            <div className="relative">
              {/* Circular Progress */}
              <div className="mx-auto w-24 h-24 relative">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 24 24">
                  {/* Background circle */}
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke={avgReviewTime <= reviewTarget ? "#10b981" : "#f59e0b"}
                    strokeWidth="2"
                    strokeDasharray={`${Math.min((avgReviewTime / reviewTarget) * 62.83, 62.83)} 62.83`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{Math.round(avgReviewTime)}</div>
                    <div className="text-xs text-gray-600">days</div>
                  </div>
                </div>
              </div>
              <div className="text-center mt-2">
                <div className="text-sm text-gray-600">Target: {reviewTarget} days</div>
                <div className={`text-xs font-medium ${avgReviewTime <= reviewTarget ? 'text-green-600' : 'text-yellow-600'}`}>
                  {avgReviewTime <= reviewTarget ? 'On Track' : 'Needs Attention'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBottlenecksChart = () => {
    const bottlenecks = data.bottleneckAnalysis;

    if (!bottlenecks || bottlenecks.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No bottlenecks detected</p>
            <p className="text-sm mt-1">All processes are running smoothly</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-48 space-y-3">
        {bottlenecks.map((bottleneck, index) => (
          <div key={bottleneck.stage} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 capitalize">{bottleneck.stage} Stage</h4>
                <p className="text-sm text-gray-600">
                  Affecting {bottleneck.affectedSubmissions} submissions
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-red-600">{bottleneck.averageTime} days</div>
              <div className="text-sm text-gray-600">avg delay</div>
            </div>
          </div>
        ))}
        
        {/* Recommendations */}
        {bottlenecks[0]?.recommendations && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Recommended Actions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {bottlenecks[0].recommendations.slice(0, 3).map((rec, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderTrendsChart = () => {
    const trends = data.historicalComparison;

    if (!trends || trends.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p>Insufficient data for trends</p>
            <p className="text-sm mt-1">Historical data will appear over time</p>
          </div>
        </div>
      );
    }

    const maxValue = Math.max(...trends.map(t => Math.max(t.current, t.previous)));

    return (
      <div className="h-48">
        <svg className="w-full h-full" viewBox="0 0 600 200">
          {/* Grid */}
          <defs>
            <pattern id="trendGrid" width="60" height="40" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="600" height="200" fill="url(#trendGrid)" />
          
          {/* Bars */}
          {trends.map((trend, index) => {
            const barWidth = 40;
            const spacing = 80;
            const x = 50 + index * spacing;
            const currentHeight = (trend.current / maxValue) * 140;
            const previousHeight = (trend.previous / maxValue) * 140;

            return (
              <g key={trend.period}>
                {/* Previous value bar */}
                <rect
                  x={x}
                  y={160 - previousHeight}
                  width={barWidth}
                  height={previousHeight}
                  fill="#d1d5db"
                  opacity="0.7"
                />
                
                {/* Current value bar */}
                <rect
                  x={x + barWidth + 5}
                  y={160 - currentHeight}
                  width={barWidth}
                  height={currentHeight}
                  fill={trend.change < 0 ? "#10b981" : "#ef4444"}
                />
                
                {/* Labels */}
                <text x={x + barWidth} y={180} textAnchor="middle" fontSize="10" fill="#6b7280">
                  {trend.period}
                </text>
                
                {/* Change indicator */}
                <text
                  x={x + barWidth}
                  y={150 - Math.max(currentHeight, previousHeight) - 10}
                  textAnchor="middle"
                  fontSize="12"
                  fill={trend.change < 0 ? "#10b981" : "#ef4444"}
                  fontWeight="bold"
                >
                  {trend.change > 0 ? '+' : ''}{trend.change}d
                </text>
              </g>
            );
          })}
          
          {/* Legend */}
          <g transform="translate(400, 20)">
            <rect x="0" y="0" width="15" height="15" fill="#d1d5db" opacity="0.7" />
            <text x="20" y="12" fontSize="12" fill="#6b7280">Previous</text>
            <rect x="0" y="20" width="15" height="15" fill="#3b82f6" />
            <text x="20" y="32" fontSize="12" fill="#6b7280">Current</text>
          </g>
        </svg>
      </div>
    );
  };

  return (
    <div className={`processing-time-chart ${className}`}>
      {/* Chart Controls */}
      <div className="flex justify-center mb-6">
        <div className="flex rounded-lg bg-gray-100 p-1">
          {(['overview', 'bottlenecks', 'trends'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === view
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Content */}
      <div className="chart-content">
        {activeView === 'overview' && renderOverviewChart()}
        {activeView === 'bottlenecks' && renderBottlenecksChart()}
        {activeView === 'trends' && renderTrendsChart()}
      </div>

      {/* Performance Summary */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(data.averageSubmissionToDecision)} days
          </div>
          <div className="text-sm text-gray-600">Avg Submission Time</div>
          <div className={`text-xs mt-1 ${
            data.averageSubmissionToDecision <= data.targetMetrics.submissionToDecisionTarget
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            Target: {data.targetMetrics.submissionToDecisionTarget} days
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(data.averageReviewTime)} days
          </div>
          <div className="text-sm text-gray-600">Avg Review Time</div>
          <div className={`text-xs mt-1 ${
            data.averageReviewTime <= data.targetMetrics.reviewTimeTarget
              ? 'text-green-600' 
              : 'text-yellow-600'
          }`}>
            Target: {data.targetMetrics.reviewTimeTarget} days
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-lg font-semibold text-gray-900">
            {data.bottleneckAnalysis.length}
          </div>
          <div className="text-sm text-gray-600">Active Bottlenecks</div>
          <div className={`text-xs mt-1 ${
            data.bottleneckAnalysis.length === 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {data.bottleneckAnalysis.length === 0 ? 'All Clear' : 'Needs Attention'}
          </div>
        </div>
      </div>
    </div>
  );
}