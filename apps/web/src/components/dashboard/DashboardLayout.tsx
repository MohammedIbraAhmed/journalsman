'use client';

import { ReactNode } from 'react';
import { UserProfile } from '@/components/auth/UserProfile';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Synfind</h1>
            </div>
            <div className="flex items-center space-x-4">
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex">
          {/* Sidebar */}
          <nav className="w-64 bg-white rounded-lg shadow-sm p-6 mr-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Main
                </h3>
                <ul className="mt-2 space-y-1">
                  <li>
                    <a
                      href="/dashboard"
                      className="block px-3 py-2 rounded-md text-sm font-medium text-gray-900 bg-gray-100"
                    >
                      Overview
                    </a>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Publishers
                </h3>
                <ul className="mt-2 space-y-1">
                  <li>
                    <a
                      href="/dashboard/publishers"
                      className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    >
                      Manage Publishers
                    </a>
                  </li>
                  <li>
                    <a
                      href="/dashboard/publishers/new"
                      className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    >
                      Create Publisher
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Journals
                </h3>
                <ul className="mt-2 space-y-1">
                  <li>
                    <a
                      href="/dashboard/journals"
                      className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    >
                      All Journals
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 bg-white rounded-lg shadow-sm p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}