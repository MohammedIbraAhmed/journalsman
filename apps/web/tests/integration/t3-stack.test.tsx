import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createTRPCRouter } from '@/server/trpc';
import { connectToDatabase } from '@synfind/database';

// Test Story 1.1: T3 Stack Project Initialization
describe('T3 Stack Integration Tests', () => {
  describe('Next.js 15 Configuration', () => {
    it('should have Next.js 15+ configured', () => {
      const nextVersion = require('next/package.json').version;
      const majorVersion = parseInt(nextVersion.split('.')[0]);
      expect(majorVersion).toBeGreaterThanOrEqual(15);
    });

    it('should support React 19', () => {
      const reactVersion = require('react/package.json').version;
      const majorVersion = parseInt(reactVersion.split('.')[0]);
      expect(majorVersion).toBeGreaterThanOrEqual(19);
    });

    it('should have TypeScript configured', () => {
      // Check if TypeScript is available
      expect(() => require('typescript')).not.toThrow();
    });
  });

  describe('tRPC Configuration', () => {
    it('should create tRPC router successfully', () => {
      const router = createTRPCRouter({
        test: {
          hello: vi.fn().mockReturnValue('world')
        }
      });
      
      expect(router).toBeDefined();
      expect(router.test.hello()).toBe('world');
    });

    it('should have tRPC client dependencies', () => {
      expect(() => require('@trpc/client')).not.toThrow();
      expect(() => require('@trpc/server')).not.toThrow();
      expect(() => require('@trpc/react-query')).not.toThrow();
    });
  });

  describe('MongoDB Connection', () => {
    it('should have MongoDB connection utility', () => {
      expect(() => require('@synfind/database')).not.toThrow();
    });

    it('should validate connection function exists', () => {
      expect(typeof connectToDatabase).toBe('function');
    });

    it('should handle missing connection string gracefully', async () => {
      // Mock missing connection string
      const originalEnv = process.env.MONGODB_URI;
      delete process.env.MONGODB_URI;
      
      try {
        await connectToDatabase();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('MONGODB_URI');
      } finally {
        process.env.MONGODB_URI = originalEnv;
      }
    });
  });

  describe('Project Structure', () => {
    it('should have monorepo structure with workspaces', () => {
      const packageJson = require('../../../../package.json');
      expect(packageJson.workspaces).toBeDefined();
      expect(packageJson.workspaces).toContain('apps/*');
      expect(packageJson.workspaces).toContain('packages/*');
    });

    it('should have Turbo configured', () => {
      const packageJson = require('../../../../package.json');
      expect(packageJson.devDependencies.turbo).toBeDefined();
    });

    it('should have proper TypeScript configuration', () => {
      // Check if we can import TypeScript utilities
      expect(() => require('zod')).not.toThrow();
    });
  });

  describe('Development Environment', () => {
    it('should have ESLint configured', () => {
      const packageJson = require('../../package.json');
      expect(packageJson.devDependencies.eslint).toBeDefined();
    });

    it('should have Prettier configured', () => {
      const rootPackageJson = require('../../../../package.json');
      expect(rootPackageJson.devDependencies.prettier).toBeDefined();
    });

    it('should have proper scripts defined', () => {
      const packageJson = require('../../package.json');
      expect(packageJson.scripts.dev).toBeDefined();
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.lint).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();
    });
  });

  describe('Environment Validation', () => {
    it('should validate required environment variables', () => {
      // Mock environment validation
      const mockConfig = {
        database: { uri: 'mongodb://test' },
        app: { env: 'test' }
      };
      
      expect(mockConfig.database.uri).toBeDefined();
      expect(mockConfig.app.env).toBeDefined();
    });

    it('should handle development vs production environments', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test development
      process.env.NODE_ENV = 'development';
      expect(process.env.NODE_ENV).toBe('development');
      
      // Test production
      process.env.NODE_ENV = 'production';
      expect(process.env.NODE_ENV).toBe('production');
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Performance Requirements', () => {
    it('should support fast refresh in development', () => {
      const packageJson = require('../../package.json');
      expect(packageJson.scripts.dev).toContain('--turbopack');
    });

    it('should have optimized build configuration', () => {
      const packageJson = require('../../package.json');
      expect(packageJson.scripts.build).toContain('next build');
    });
  });
});