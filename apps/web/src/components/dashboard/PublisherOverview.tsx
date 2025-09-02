'use client';

import { trpc } from '@/lib/trpc-client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PublisherCard } from './PublisherCard';
import { CreatePublisherButton } from './CreatePublisherButton';
import { Publisher } from '@synfind/shared';

interface PublisherOverviewProps {
  userId: string;
}

export function PublisherOverview({ userId }: PublisherOverviewProps) {
  const { data: publishersResult, isLoading, error } = trpc.publisher.getPublishersByUser.useQuery({
    userId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading publishers</h3>
            <div className="mt-2 text-sm text-red-700">
              {error.message || 'Failed to load your publishers'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!publishersResult?.success) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No data available</h3>
            <div className="mt-2 text-sm text-yellow-700">
              Unable to load publisher data at this time
            </div>
          </div>
        </div>
      </div>
    );
  }

  const publishers: Publisher[] = (publishersResult as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Your Publishers</h2>
          <p className="mt-1 text-sm text-gray-500">
            {publishers.length === 0 
              ? 'You haven\'t created any publishers yet'
              : `Managing ${publishers.length} publisher${publishers.length === 1 ? '' : 's'}`
            }
          </p>
        </div>
        <CreatePublisherButton />
      </div>

      {publishers.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No publishers yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first publisher to start managing journals and submissions.
          </p>
          <CreatePublisherButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishers.map((publisher: Publisher) => (
            <PublisherCard key={publisher.id} publisher={publisher} />
          ))}
        </div>
      )}
    </div>
  );
}