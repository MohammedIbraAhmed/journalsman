'use client';

import { trpc } from '@/lib/trpc-client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { Journal } from '@synfind/shared';

interface JournalListProps {
  publisherId: string;
}

export function JournalList({ publisherId }: JournalListProps) {
  const { data: journalsResult, isLoading, error } = trpc.journal.getJournalsByPublisher.useQuery({
    publisherId,
    limit: 50,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !journalsResult?.success) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Error loading journals</p>
      </div>
    );
  }

  const journals: Journal[] = (journalsResult as any)?.data || [];

  if (journals.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No journals yet</h3>
        <p className="text-gray-500 mb-4">
          Create your first journal to start accepting submissions.
        </p>
        <Link
          href={`/dashboard/publishers/${publisherId}/journals/new`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Create Journal
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'draft':
        return 'text-yellow-600 bg-yellow-100';
      case 'suspended':
        return 'text-red-600 bg-red-100';
      case 'archived':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-4">
      {journals.map((journal: Journal) => (
        <div key={journal.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Link
                href={`/dashboard/journals/${journal.id}`}
                className="text-lg font-medium text-gray-900 hover:text-blue-600"
              >
                {journal.name}
              </Link>
              <p className="text-sm text-gray-500 mt-1">{journal.shortName}</p>
              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                <span>ISSN: {(journal as any).issn || 'Pending'}</span>
                <span>Submissions: {journal.statistics.totalSubmissions}</span>
                <span>Published: {journal.statistics.publishedArticles}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(journal.status)}`}
              >
                {journal.status}
              </span>
              <Link
                href={`/dashboard/journals/${journal.id}`}
                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
              >
                Manage
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}