'use client';

import { api } from '@/components/providers/trpc-provider';
import { useSession } from 'next-auth/react';
import { SignInButton } from '@/components/auth/SignInButton';
import { UserProfile } from '@/components/auth/UserProfile';
import Link from 'next/link';
import { SessionUser } from '@synfind/shared';

export default function Home() {
  const healthQuery = api.health.check.useQuery();
  const dbQuery = api.database.testConnection.useQuery();
  const { data: session, status } = useSession();

  return (
    <div className="font-sans min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-4xl mx-auto">
        {/* Header with Authentication */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🎓 Synfind Academic Platform
            </h1>
            <p className="text-lg text-gray-600">
              Modern academic journal publishing platform
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="animate-pulse bg-gray-200 rounded h-10 w-32"></div>
            ) : session ? (
              <UserProfile />
            ) : (
              <Link 
                href="/auth/signin"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Authentication Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🔐</span>
            Authentication Status
          </h2>
          {status === 'loading' ? (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Loading session...
            </div>
          ) : session?.user ? (
            <div className="text-green-600">
              <p className="font-medium">✅ Authenticated</p>
              <p className="text-sm text-gray-600 mt-2">
                Welcome back, {session.user.name}!
              </p>
              <div className="text-xs text-gray-500 mt-2 space-y-1">
                <p>Email: {session.user.email}</p>
                <p>User ID: {session.user.id}</p>
                {(session.user as SessionUser).orcidId && (
                  <p>ORCID: {(session.user as SessionUser).orcidId}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-orange-600">
              <p className="font-medium">🔓 Not Authenticated</p>
              <p className="text-sm text-gray-600 mt-2">
                Sign in to access academic publishing features
              </p>
              <div className="mt-4 flex space-x-4">
                <SignInButton provider="google" className="text-sm px-4 py-2" />
                <SignInButton provider="orcid" className="text-sm px-4 py-2" />
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Health Check Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              API Health Check
            </h2>
            {healthQuery.isLoading ? (
              <div className="flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Loading...
              </div>
            ) : healthQuery.error ? (
              <div className="text-red-600">
                <p className="font-medium">❌ Error</p>
                <p className="text-sm">{healthQuery.error.message}</p>
              </div>
            ) : (
              <div className="text-green-600">
                <p className="font-medium">✅ {healthQuery.data?.status.toUpperCase()}</p>
                <p className="text-sm text-gray-600">{healthQuery.data?.message}</p>
                <p className="text-xs text-gray-500 mt-2">{healthQuery.data?.timestamp}</p>
              </div>
            )}
          </div>

          {/* Database Connection Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">🗄️</span>
              Database Connection
            </h2>
            {dbQuery.isLoading ? (
              <div className="flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Testing connection...
              </div>
            ) : dbQuery.error ? (
              <div className="text-red-600">
                <p className="font-medium">❌ Connection Failed</p>
                <p className="text-sm">{dbQuery.error.message}</p>
              </div>
            ) : dbQuery.data?.success ? (
              <div className="text-green-600">
                <p className="font-medium">✅ Connected</p>
                <p className="text-sm text-gray-600">{dbQuery.data.message}</p>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <p>Database: {dbQuery.data.database}</p>
                  <p>Collections: {dbQuery.data.collections}</p>
                  <p>Data Size: {dbQuery.data.dataSize} bytes</p>
                </div>
              </div>
            ) : (
              <div className="text-red-600">
                <p className="font-medium">❌ {dbQuery.data?.message}</p>
                {dbQuery.data?.error && (
                  <p className="text-sm">{dbQuery.data.error}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">🛠️ Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="font-medium">Next.js</div>
              <div className="text-blue-600">15.x</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="font-medium">TypeScript</div>
              <div className="text-blue-600">5.3+</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="font-medium">tRPC</div>
              <div className="text-green-600">11.x</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="font-medium">MongoDB</div>
              <div className="text-green-600">7.0+</div>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">🚀 Quick Start</h2>
          <div className="space-y-2 text-sm">
            <p className="flex items-center"><span className="text-green-500 mr-2">✅</span>Next.js 15 with App Router</p>
            <p className="flex items-center"><span className="text-green-500 mr-2">✅</span>TypeScript strict mode</p>
            <p className="flex items-center"><span className="text-green-500 mr-2">✅</span>tRPC v11 configuration</p>
            <p className="flex items-center"><span className="text-green-500 mr-2">✅</span>Tailwind CSS integration</p>
            <p className="flex items-center"><span className="text-green-500 mr-2">✅</span>MongoDB Atlas connection</p>
            <p className="flex items-center"><span className="text-green-500 mr-2">✅</span>Turborepo monorepo structure</p>
            <p className="flex items-center"><span className="text-green-500 mr-2">✅</span>NextAuth v5 authentication</p>
            <p className="flex items-center"><span className="text-green-500 mr-2">✅</span>Google & ORCID OAuth providers</p>
            <p className="flex items-center"><span className="text-green-500 mr-2">✅</span>Academic email validation</p>
            <p className="flex items-center"><span className="text-green-500 mr-2">✅</span>Database session storage</p>
          </div>
          <p className="mt-4 text-gray-600 text-sm">
            Ready to build academic publishing features! 📚
          </p>
        </div>
      </main>
    </div>
  );
}