import { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { connectToDatabase } from '@synfind/database';
import { config as envConfig } from '@synfind/shared';

// Academic email domains for validation
const ACADEMIC_DOMAINS = [
  '.edu',          // US universities
  '.ac.uk',        // UK universities
  '.ac.jp',        // Japanese universities
  '.edu.au',       // Australian universities
  '.edu.ca',       // Canadian universities
  '.university',   // Generic university domain
];

// Validate if email is from academic domain
const isAcademicEmail = (email: string): boolean => {
  return ACADEMIC_DOMAINS.some(domain => 
    email.toLowerCase().includes(domain.toLowerCase())
  );
};

// ORCID Provider configuration
const ORCIDProvider = {
  id: 'orcid',
  name: 'ORCID',
  type: 'oauth' as const,
  version: '2.0',
  authorization: {
    url: 'https://orcid.org/oauth/authorize',
    params: {
      scope: '/authenticate',
      response_type: 'code',
    },
  },
  token: 'https://orcid.org/oauth/token',
  userinfo: {
    url: 'https://pub.orcid.org/v3.0',
    async request({ tokens }: { tokens: { access_token: string; orcid: string } }) {
      const response = await fetch(`https://pub.orcid.org/v3.0/${tokens.orcid}/person`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch ORCID profile');
      }
      
      const profile = await response.json();
      return {
        id: tokens.orcid,
        orcidId: tokens.orcid,
        name: profile.name?.['given-names']?.value + ' ' + profile.name?.['family-name']?.value,
        email: profile.emails?.email?.[0]?.email || null,
      };
    },
  },
  profile(profile: { id: string; name: string; email: string | null; orcidId: string }) {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      orcidId: profile.orcidId,
    };
  },
  clientId: process.env.ORCID_CLIENT_ID,
  clientSecret: process.env.ORCID_CLIENT_SECRET,
};

export const authConfig: NextAuthConfig = {
  adapter: MongoDBAdapter(connectToDatabase().then(({ client }) => client)),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    ORCIDProvider as never,
  ],

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  callbacks: {
    async signIn({ user, account }) {
      // Allow ORCID sign-ins (they're inherently academic)
      if (account?.provider === 'orcid') {
        return true;
      }

      // For Google, validate academic email domain
      if (account?.provider === 'google' && user.email) {
        const isAcademic = isAcademicEmail(user.email);
        if (!isAcademic) {
          console.warn(`Non-academic email rejected: ${user.email}`);
          return '/auth/error?error=NonAcademicEmail';
        }
        return true;
      }

      return true;
    },

    async jwt({ token, user, account }) {
      // Persist ORCID ID to token
      if (account?.provider === 'orcid' && user) {
        token.orcidId = (user as { orcidId?: string }).orcidId;
      }
      
      // Add user ID to token
      if (user?.id) {
        token.userId = user.id;
      }
      
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        (session.user as { orcidId?: string }).orcidId = token.orcidId as string;
      }
      return session;
    },
  },

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  cookies: {
    sessionToken: {
      name: 'synfind-session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: envConfig.app.env === 'production',
      },
    },
  },

  debug: envConfig.app.env === 'development',

  trustHost: true,
};

// Create NextAuth instance
import NextAuth from 'next-auth';

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);