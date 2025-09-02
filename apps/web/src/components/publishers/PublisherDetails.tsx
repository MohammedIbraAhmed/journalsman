'use client';

import { trpc } from '@/lib/trpc-client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { JournalList } from '@/components/journals/JournalList';
import Link from 'next/link';

interface PublisherDetailsProps {
  publisherId: string;
  userId: string;
}

export function PublisherDetails({ publisherId, userId }: PublisherDetailsProps) {
  const { data: publisherResult, isLoading, error } = trpc.publisher.getById.useQuery({
    id: publisherId
  });

  const { data: summaryResult } = trpc.publisher.getPublisherSummary.useQuery({
    publisherId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !publisherResult?.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading publisher</h3>
            <div className="mt-2 text-sm text-red-700">
              {error?.message || 'Publisher not found or access denied'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const publisher = (publisherResult as any)?.data || null;
  const statistics = (summaryResult as any)?.data?.statistics || null;

  if (!publisher) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Publisher not found</h3>
            <div className="mt-2 text-sm text-red-700">
              The requested publisher could not be found or you don't have access to it.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Publisher Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{publisher.name}</h1>
            <p className="text-gray-500">{publisher.domain}</p>
            <div className="flex items-center mt-2 space-x-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                publisher.institutionalDetails.verification.status === 'verified'
                  ? 'text-green-600 bg-green-100'
                  : publisher.institutionalDetails.verification.status === 'pending'
                  ? 'text-yellow-600 bg-yellow-100'
                  : 'text-gray-600 bg-gray-100'
              }`}>
                {publisher.institutionalDetails.verification.status}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                publisher.billingInfo.isActive
                  ? 'text-green-600 bg-green-100'
                  : 'text-red-600 bg-red-100'
              }`}>
                {publisher.billingInfo.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/dashboard/publishers/${publisherId}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Edit
            </Link>
            <Link
              href={`/dashboard/publishers/${publisherId}/journals/new`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Journal
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Journals</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{statistics.totalJournals}</dd>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Active Journals</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{statistics.activeJournals}</dd>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Admin Users</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{statistics.adminUserCount}</dd>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Verification</dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900 capitalize">{statistics.verificationStatus}</dd>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Billing</dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900 capitalize">{statistics.billingStatus}</dd>
          </div>
        </div>
      )}

      {/* Journals Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">Journals</h2>
          <Link
            href={`/dashboard/publishers/${publisherId}/journals/new`}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            Add Journal
          </Link>
        </div>
        <JournalList publisherId={publisherId} />
      </div>

      {/* Publisher Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Publisher Information</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Institution Type</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">
              {publisher.institutionalDetails.type.replace('_', ' ')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Country</dt>
            <dd className="mt-1 text-sm text-gray-900">{publisher.institutionalDetails.country}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Default Language</dt>
            <dd className="mt-1 text-sm text-gray-900">{publisher.settings.defaultLanguage}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Timezone</dt>
            <dd className="mt-1 text-sm text-gray-900">{publisher.settings.timezone}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}