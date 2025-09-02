'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

interface SignInButtonProps {
  provider: 'google' | 'orcid';
  className?: string;
}

export function SignInButton({ provider, className = '' }: SignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl: '/' });
    } catch (error) {
      console.error(`Sign in with ${provider} failed:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const providerConfig = {
    google: {
      name: 'Google',
      icon: '🔍',
      bgColor: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white',
    },
    orcid: {
      name: 'ORCID',
      icon: '🆔',
      bgColor: 'bg-green-600 hover:bg-green-700',
      textColor: 'text-white',
    },
  };

  const config = providerConfig[provider];

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className={`
        flex items-center justify-center px-4 py-3 rounded-md font-medium
        ${config.bgColor} ${config.textColor}
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Signing in...
        </div>
      ) : (
        <div className="flex items-center">
          <span className="text-lg mr-2">{config.icon}</span>
          Sign in with {config.name}
        </div>
      )}
    </button>
  );
}