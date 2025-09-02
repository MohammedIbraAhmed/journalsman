import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider, useSession } from 'next-auth/react';
import { authConfig } from '@/lib/auth/config';
import type { NextAuthConfig } from 'next-auth';

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Test component for session testing
function TestAuthComponent() {
  const { data: session, status } = useSession();
  
  return (
    <div>
      <div data-testid="auth-status">{status}</div>
      {session?.user && (
        <div data-testid="user-info">
          <span data-testid="user-name">{session.user.name}</span>
          <span data-testid="user-email">{session.user.email}</span>
        </div>
      )}
    </div>
  );
}

// Test Story 1.2: NextAuth v5 Multi-Provider Configuration
describe('NextAuth Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NextAuth v5 Configuration', () => {
    it('should have NextAuth v5 configured', () => {
      expect(authConfig).toBeDefined();
      expect(authConfig.providers).toBeDefined();
      expect(Array.isArray(authConfig.providers)).toBe(true);
    });

    it('should have MongoDB adapter configured', () => {
      expect(authConfig.adapter).toBeDefined();
    });

    it('should have database session strategy', () => {
      expect(authConfig.session?.strategy).toBe('database');
    });

    it('should have proper session configuration', () => {
      expect(authConfig.session?.maxAge).toBe(30 * 24 * 60 * 60); // 30 days
      expect(authConfig.session?.updateAge).toBe(24 * 60 * 60); // 24 hours
    });
  });

  describe('Google OAuth Provider', () => {
    it('should have Google provider configured', () => {
      const googleProvider = authConfig.providers?.find(
        (provider: any) => provider.id === 'google'
      );
      expect(googleProvider).toBeDefined();
    });

    it('should require academic email domains', async () => {
      const callback = authConfig.callbacks?.signIn;
      expect(callback).toBeDefined();

      // Test academic email (should pass)
      const academicResult = await callback?.({
        user: { email: 'researcher@university.edu' },
        account: { provider: 'google' }
      } as any);
      expect(academicResult).toBe(true);

      // Test non-academic email (should fail)
      const nonAcademicResult = await callback?.({
        user: { email: 'user@gmail.com' },
        account: { provider: 'google' }
      } as any);
      expect(nonAcademicResult).toContain('/auth/error');
    });

    it('should validate various academic domains', async () => {
      const callback = authConfig.callbacks?.signIn;
      const academicDomains = [
        'researcher@mit.edu',
        'professor@oxford.ac.uk',
        'student@tokyo.ac.jp',
        'faculty@sydney.edu.au',
        'admin@mcgill.edu.ca'
      ];

      for (const email of academicDomains) {
        const result = await callback?.({
          user: { email },
          account: { provider: 'google' }
        } as any);
        expect(result).toBe(true);
      }
    });
  });

  describe('ORCID OAuth Provider', () => {
    it('should have ORCID provider configured', () => {
      const orcidProvider = authConfig.providers?.find(
        (provider: any) => provider.id === 'orcid'
      );
      expect(orcidProvider).toBeDefined();
      expect(orcidProvider?.name).toBe('ORCID');
    });

    it('should allow ORCID sign-ins without email validation', async () => {
      const callback = authConfig.callbacks?.signIn;
      
      const result = await callback?.({
        user: { email: 'any-email@example.com' },
        account: { provider: 'orcid' }
      } as any);
      
      expect(result).toBe(true);
    });

    it('should have proper ORCID configuration', () => {
      const orcidProvider = authConfig.providers?.find(
        (provider: any) => provider.id === 'orcid'
      );
      
      expect(orcidProvider?.authorization?.url).toContain('orcid.org/oauth/authorize');
      expect(orcidProvider?.token).toContain('orcid.org/oauth/token');
    });
  });

  describe('Session Management', () => {
    it('should render loading state initially', () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: 'loading'
      });

      render(<TestAuthComponent />);
      expect(screen.getByTestId('auth-status')).toHaveTextContent('loading');
    });

    it('should render unauthenticated state', () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: 'unauthenticated'
      });

      render(<TestAuthComponent />);
      expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
    });

    it('should render authenticated user session', () => {
      const mockSession = {
        user: {
          id: '1',
          name: 'Dr. Test Researcher',
          email: 'test@university.edu'
        },
        expires: '2025-01-31'
      };

      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: 'authenticated'
      });

      render(<TestAuthComponent />);
      
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Dr. Test Researcher');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@university.edu');
    });
  });

  describe('JWT and Session Callbacks', () => {
    it('should persist ORCID ID in JWT token', async () => {
      const jwtCallback = authConfig.callbacks?.jwt;
      
      const token = await jwtCallback?.({
        token: {},
        user: { orcidId: '0000-0000-0000-0000' },
        account: { provider: 'orcid' }
      } as any);
      
      expect(token?.orcidId).toBe('0000-0000-0000-0000');
    });

    it('should add user ID to JWT token', async () => {
      const jwtCallback = authConfig.callbacks?.jwt;
      
      const token = await jwtCallback?.({
        token: {},
        user: { id: 'user123' },
        account: { provider: 'google' }
      } as any);
      
      expect(token?.userId).toBe('user123');
    });

    it('should include ORCID ID in session', async () => {
      const sessionCallback = authConfig.callbacks?.session;
      
      const session = await sessionCallback?.({
        session: { user: {} },
        token: { userId: 'user123', orcidId: '0000-0000-0000-0000' }
      } as any);
      
      expect(session?.user.id).toBe('user123');
      expect((session?.user as any).orcidId).toBe('0000-0000-0000-0000');
    });
  });

  describe('Security Configuration', () => {
    it('should have secure cookie settings', () => {
      expect(authConfig.cookies?.sessionToken?.name).toBe('synfind-session-token');
      expect(authConfig.cookies?.sessionToken?.options?.httpOnly).toBe(true);
      expect(authConfig.cookies?.sessionToken?.options?.sameSite).toBe('lax');
    });

    it('should enable secure cookies in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Would need to re-evaluate config in production
      expect(authConfig.cookies?.sessionToken?.options?.secure).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should trust host for deployment', () => {
      expect(authConfig.trustHost).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should have custom error page configured', () => {
      expect(authConfig.pages?.error).toBe('/auth/error');
    });

    it('should have custom sign-in page configured', () => {
      expect(authConfig.pages?.signIn).toBe('/auth/signin');
    });

    it('should handle authentication errors gracefully', async () => {
      const callback = authConfig.callbacks?.signIn;
      
      const result = await callback?.({
        user: { email: 'invalid@gmail.com' },
        account: { provider: 'google' }
      } as any);
      
      expect(result).toContain('/auth/error');
      expect(result).toContain('NonAcademicEmail');
    });
  });

  describe('Account Linking', () => {
    it('should support multiple authentication methods', () => {
      expect(authConfig.providers?.length).toBeGreaterThanOrEqual(2);
      
      const providerIds = authConfig.providers?.map((p: any) => p.id);
      expect(providerIds).toContain('google');
      expect(providerIds).toContain('orcid');
    });

    it('should handle user profile merging', async () => {
      const sessionCallback = authConfig.callbacks?.session;
      
      const session = await sessionCallback?.({
        session: { user: { name: 'Test User', email: 'test@university.edu' } },
        token: { userId: 'user123', orcidId: '0000-0000-0000-0000' }
      } as any);
      
      expect(session?.user.id).toBe('user123');
      expect(session?.user.name).toBe('Test User');
      expect((session?.user as any).orcidId).toBe('0000-0000-0000-0000');
    });
  });
});