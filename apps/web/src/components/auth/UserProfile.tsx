'use client';

import { useSession } from 'next-auth/react';
import { SignOutButton } from './SignOutButton';
import { SessionUser } from '@synfind/shared';
import Image from 'next/image';

export function UserProfile() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse bg-gray-200 rounded-full h-8 w-8"></div>
        <div className="animate-pulse bg-gray-200 rounded h-4 w-24"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-3">
        {user.image && (
          <Image
            src={user.image}
            alt={user.name || 'User avatar'}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full"
          />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">
            {user.name}
          </span>
          <span className="text-xs text-gray-500">
            {user.email}
          </span>
          {(user as SessionUser).orcidId && (
            <span className="text-xs text-green-600">
              ORCID: {(user as SessionUser).orcidId}
            </span>
          )}
        </div>
      </div>
      <SignOutButton className="text-sm px-3 py-1" />
    </div>
  );
}