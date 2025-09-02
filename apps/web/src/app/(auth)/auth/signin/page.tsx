import { SignInButton } from '@/components/auth/SignInButton';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto flex justify-center">
            <h1 className="text-3xl font-bold text-gray-900">🎓 Synfind</h1>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Academic publishing platform for researchers and institutions
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <SignInButton 
            provider="google" 
            className="w-full"
          />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or</span>
            </div>
          </div>
          
          <SignInButton 
            provider="orcid" 
            className="w-full"
          />
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                Academic Authentication
              </span>
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>🏫 Google: Academic email domains only (.edu, .ac.uk, etc.)</p>
            <p>🔬 ORCID: For verified researchers with ORCID accounts</p>
          </div>
        </div>
      </div>
    </div>
  );
}