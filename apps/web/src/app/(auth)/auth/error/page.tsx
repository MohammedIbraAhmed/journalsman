'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const errorMessages = {
  NonAcademicEmail: {
    title: 'Academic Email Required',
    description: 'Please use an academic email address (e.g., .edu, .ac.uk) to sign in with Google.',
    suggestion: 'Try signing in with ORCID instead, or use your institutional email.',
  },
  OAuthSignin: {
    title: 'OAuth Sign-in Error',
    description: 'There was an error during the sign-in process.',
    suggestion: 'Please try again or use a different authentication method.',
  },
  OAuthCallback: {
    title: 'OAuth Callback Error',
    description: 'There was an error processing the authentication response.',
    suggestion: 'Please try signing in again.',
  },
  OAuthCreateAccount: {
    title: 'Account Creation Error',
    description: 'Could not create account with the provided credentials.',
    suggestion: 'Please check your account details and try again.',
  },
  EmailCreateAccount: {
    title: 'Email Account Error',
    description: 'Could not create account with email.',
    suggestion: 'Please try a different authentication method.',
  },
  Callback: {
    title: 'Callback Error',
    description: 'There was an error during authentication callback.',
    suggestion: 'Please try signing in again.',
  },
  OAuthAccountNotLinked: {
    title: 'Account Not Linked',
    description: 'This account is associated with a different authentication method.',
    suggestion: 'Try signing in with the method you used previously.',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An unexpected error occurred during authentication.',
    suggestion: 'Please try again or contact support if the issue persists.',
  },
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  
  const errorInfo = errorMessages[error as keyof typeof errorMessages] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto flex justify-center">
            <h1 className="text-3xl font-bold text-gray-900">🎓 Synfind</h1>
          </div>
          <div className="mt-6 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900">
              {errorInfo.title}
            </h2>
            <p className="mt-2 text-gray-600">
              {errorInfo.description}
            </p>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-blue-400 text-xl">💡</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Suggestion
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>{errorInfo.suggestion}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <Link
            href="/auth/signin"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </Link>
          
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Error Code: <code className="font-mono bg-gray-100 px-1 rounded">{error}</code>
          </p>
        </div>
      </div>
    </div>
  );
}