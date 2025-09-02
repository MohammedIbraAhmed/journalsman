'use client';

import React, { useState } from 'react';
import type { SubmissionVolumeMetrics } from '@shared/types';

interface SubmissionVolumeChartProps {
  data?: SubmissionVolumeMetrics;
  isLoading: boolean;
  className?: string;
}

export function SubmissionVolumeChart({ data, isLoading, className = '' }: SubmissionVolumeChartProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedJournal, setSelectedJournal] = useState<string>('all');

  if (isLoading || !data) {
    return (
      <div className={`submission-volume-chart ${className}`}>
        <div className="animate-pulse">
          {/* Chart Controls Skeleton */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <div className="w-16 h-8 bg-gray-200 rounded"></div>
              <div className="w-16 h-8 bg-gray-200 rounded"></div>
              <div className="w-16 h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="w-32 h-8 bg-gray-200 rounded"></div>
          </div>
          
          {/* Chart Area Skeleton */}
          <div className="h-48 bg-gray-200 rounded"></div>
          
          {/* Legend Skeleton */}
          <div className="flex justify-center space-x-4 mt-4">
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const chartData = data[activeTimeframe] || [];
  const journalData = data.byJournal || [];

  // Get filtered data based on selected journal
  const getFilteredData = () => {
    if (selectedJournal === 'all') {
      return chartData;
    }
    // In real implementation, this would filter by journal
    return chartData;
  };

  const filteredData = getFilteredData();
  const maxValue = Math.max(...filteredData.map(d => d.value), 1);

  return (
    <div className={`submission-volume-chart ${className}`}>
      {/* Chart Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        {/* Timeframe Selector */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          {(['daily', 'weekly', 'monthly'] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setActiveTimeframe(timeframe)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTimeframe === timeframe
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </button>
          ))}
        </div>

        {/* Journal Selector */}
        <select
          value={selectedJournal}
          onChange={(e) => setSelectedJournal(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Journals</option>
          {journalData.map((journal) => (
            <option key={journal.journalId} value={journal.journalId}>
              {journal.journalName}
            </option>
          ))}
        </select>
      </div>

      {/* Chart Area */}
      <div className="relative">
        {filteredData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>No submission data available</p>
              <p className="text-sm mt-1">Data will appear as submissions are received</p>
            </div>
          </div>
        ) : (
          <div className="h-48">
            {/* Simple SVG Bar Chart */}
            <svg className="w-full h-full" viewBox="0 0 800 200">
              {/* Chart Grid */}
              <defs>
                <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="800" height="200" fill="url(#grid)" />
              
              {/* Y-axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                <g key={index}>
                  <line x1="40" y1={200 - ratio * 180} x2="780" y2={200 - ratio * 180} stroke="#e5e7eb" strokeWidth={0.5} />
                  <text x="35" y={200 - ratio * 180 + 4} textAnchor="end" fontSize="12" fill="#6b7280">
                    {Math.round(maxValue * ratio)}
                  </text>
                </g>
              ))}

              {/* Bars */}
              {filteredData.map((point, index) => {
                const barWidth = Math.max(700 / filteredData.length - 4, 8);
                const barHeight = (point.value / maxValue) * 180;
                const x = 50 + index * (700 / filteredData.length);
                const y = 200 - barHeight - 10;

                return (
                  <g key={point.date}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill="#3b82f6"
                      className="hover:fill-blue-700 transition-colors cursor-pointer"
                      rx="2"
                    />
                    {/* Value label on hover */}
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#374151"
                      className="opacity-0 hover:opacity-100 transition-opacity"
                    >
                      {point.value}
                    </text>
                  </g>
                );
              })}

              {/* X-axis labels */}
              {filteredData.map((point, index) => {
                if (index % Math.ceil(filteredData.length / 8) === 0 || index === filteredData.length - 1) {
                  const x = 50 + index * (700 / filteredData.length) + (700 / filteredData.length) / 2;
                  const formattedDate = activeTimeframe === 'monthly' 
                    ? point.date.substring(0, 7) // YYYY-MM
                    : activeTimeframe === 'weekly'
                      ? `W${point.date.split('-W')[1]}`
                      : point.date.substring(5); // MM-DD

                  return (
                    <text
                      key={point.date}
                      x={x}
                      y={195}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#6b7280"
                    >
                      {formattedDate}
                    </text>
                  );
                }
                return null;
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Chart Statistics */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-lg font-semibold text-gray-900">{data.totalSubmissions.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Submissions</div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-lg font-semibold text-gray-900">
            {filteredData.length > 0 ? Math.round(filteredData.reduce((sum, d) => sum + d.value, 0) / filteredData.length) : 0}
          </div>
          <div className="text-sm text-gray-600">Average per {activeTimeframe.slice(0, -2)}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className={`text-lg font-semibold ${data.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.growthRate >= 0 ? '+' : ''}{data.growthRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Growth Rate</div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-lg font-semibold text-gray-900">{data.peakSubmissionDays.length}</div>
          <div className="text-sm text-gray-600">Peak Days</div>
        </div>
      </div>

      {/* Journal Breakdown */}
      {journalData.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Journal Performance</h4>
          <div className="space-y-2">
            {journalData.slice(0, 5).map((journal) => (
              <div key={journal.journalId} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium text-gray-900">{journal.journalName}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    {journal.acceptanceRate.toFixed(1)}% acceptance rate
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{journal.submissionCount}</div>
                  <div className="text-sm text-gray-600">submissions</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}