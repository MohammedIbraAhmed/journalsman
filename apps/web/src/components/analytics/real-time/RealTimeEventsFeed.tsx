'use client';

import React, { useState, useEffect } from 'react';
import type { AnalyticsEvent } from '@shared/types';
import { analyticsEmitter } from '@/lib/analytics/real-time';

interface RealTimeEventsFeedProps {
  events?: AnalyticsEvent[];
  publisherId: string;
  className?: string;
}

export function RealTimeEventsFeed({ events = [], publisherId, className = '' }: RealTimeEventsFeedProps) {
  const [realtimeEvents, setRealtimeEvents] = useState<AnalyticsEvent[]>(events);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);

  useEffect(() => {
    // Subscribe to real-time events
    setIsConnected(true);
    
    const unsubscribe = analyticsEmitter.subscribe(publisherId, (event: AnalyticsEvent) => {
      setRealtimeEvents(prev => [event, ...prev.slice(0, 49)]); // Keep only last 50 events
      setLastEventTime(new Date());
    });

    // Simulate connection status check
    const connectionCheck = setInterval(() => {
      const subscriberCount = analyticsEmitter.getSubscriberCount(publisherId);
      setIsConnected(subscriberCount > 0);
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(connectionCheck);
    };
  }, [publisherId]);

  useEffect(() => {
    // Update events when prop changes
    setRealtimeEvents(events);
  }, [events]);

  const getEventIcon = (eventType: AnalyticsEvent['type']) => {
    switch (eventType) {
      case 'submission':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'review':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        );
      case 'decision':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'publication':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatEventTime = (timestamp: Date) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - eventTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return eventTime.toLocaleDateString();
    }
  };

  const getEventDescription = (event: AnalyticsEvent) => {
    const { type, data, submissionId } = event;
    
    switch (type) {
      case 'submission':
        if (data?.type === 'metrics_update') {
          return `Metrics updated - ${data.metrics?.todaySubmissions || 0} submissions today`;
        }
        return `New submission received${submissionId ? ` (ID: ${submissionId.slice(-8)})` : ''}`;
      case 'review':
        return `Review ${data?.status || 'updated'}${submissionId ? ` for ${submissionId.slice(-8)}` : ''}`;
      case 'decision':
        return `Decision made: ${data?.decision || 'Unknown'}${submissionId ? ` for ${submissionId.slice(-8)}` : ''}`;
      case 'publication':
        return `Article published${submissionId ? ` (${submissionId.slice(-8)})` : ''}`;
      default:
        return 'Unknown event';
    }
  };

  return (
    <div className={`real-time-events-feed bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Live Activity Feed</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        {lastEventTime && (
          <p className="text-sm text-gray-500 mt-1">
            Last update: {formatEventTime(lastEventTime)}
          </p>
        )}
      </div>

      {/* Events List */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100% - 80px)' }}>
        {realtimeEvents.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400 mt-1">Events will appear here in real-time</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {realtimeEvents.slice(0, 20).map((event) => (
              <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  {getEventIcon(event.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {event.type} Event
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatEventTime(event.timestamp)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {getEventDescription(event)}
                    </p>
                    {event.journalId && event.journalId !== 'aggregate' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Journal: {event.journalId.slice(-8)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with event count */}
      {realtimeEvents.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {Math.min(realtimeEvents.length, 20)} of {realtimeEvents.length} events</span>
            {realtimeEvents.length > 20 && (
              <button 
                className="text-blue-600 hover:text-blue-800"
                onClick={() => {
                  // In a real implementation, this would load more events
                  console.log('Load more events');
                }}
              >
                View all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}