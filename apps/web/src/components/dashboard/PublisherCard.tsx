'use client';

import { Publisher } from '@synfind/shared';
import Link from 'next/link';

interface PublisherCardProps {
  publisher: Publisher;
}

export function PublisherCard({ publisher }: PublisherCardProps) {
  const isActive = publisher.billingInfo.isActive;
  const verificationStatus = publisher.institutionalDetails.verification.status;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Link href={`/dashboard/publishers/${publisher.id}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {publisher.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {publisher.domain}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(verificationStatus)}`}
            >
              {verificationStatus}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Journals:</span>
            <span className="text-gray-900 font-medium">
              {publisher.journals.length}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Admin Users:</span>
            <span className="text-gray-900 font-medium">
              {publisher.adminUsers.length}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status:</span>
            <span className={`font-medium ${isActive ? 'text-green-600' : 'text-red-600'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6" />
            </svg>
            {publisher.institutionalDetails.type === 'university' ? 'University' : 
             publisher.institutionalDetails.type === 'research_institute' ? 'Research Institute' :
             publisher.institutionalDetails.type === 'commercial' ? 'Commercial' : 
             publisher.institutionalDetails.type}
          </div>
        </div>
      </div>
    </Link>
  );
}