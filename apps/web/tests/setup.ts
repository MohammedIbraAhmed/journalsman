/**
 * Test Setup Configuration
 * 
 * Global setup for Vitest testing environment including
 * DOM polyfills, mock configurations, and test utilities
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';
import { setupTestEnvironment } from './utils/test-helpers';

// Global test environment setup
setupTestEnvironment();

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    pathname: '/test',
    query: {},
    asPath: '/test',
  }),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test',
}));

// Mock Next.js headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: () => ({
    get: vi.fn(),
  }),
}));

// Mock Next.js image
vi.mock('next/image', () => ({
  default: (props: any) => {
    const { src, alt, ...rest } = props;
    return React.createElement('img', { src, alt, ...rest });
  },
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

// Mock MongoDB operations
vi.mock('mongodb', () => ({
  MongoClient: vi.fn(() => ({
    connect: vi.fn(),
    close: vi.fn(),
    db: vi.fn(() => ({
      collection: vi.fn(),
    })),
  })),
  ObjectId: vi.fn(() => ({
    toString: () => 'mock-object-id',
  })),
}));

// Mock database connection
vi.mock('@synfind/database', () => ({
  connectToDatabase: vi.fn(() => Promise.resolve({
    db: {
      collection: vi.fn(),
    },
  })),
}));

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substring(2),
  },
});

// Mock TextEncoder/TextDecoder
Object.defineProperty(global, 'TextEncoder', {
  value: class TextEncoder {
    encode(input: string) {
      return new Uint8Array(Buffer.from(input, 'utf8'));
    }
  },
});

Object.defineProperty(global, 'TextDecoder', {
  value: class TextDecoder {
    decode(input: Uint8Array) {
      return Buffer.from(input).toString('utf8');
    }
  },
});

// Mock fetch for API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  } as Response)
);

// Mock window location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/test',
    origin: 'http://localhost:3000',
    pathname: '/test',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
});

// Mock matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock clipboard API
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn(),
      readText: vi.fn(),
    },
    writable: true,
    configurable: true,
  });
}

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  writable: true,
});

// Mock touch events for mobile testing
Object.defineProperty(window, 'TouchEvent', {
  value: class TouchEvent extends Event {
    touches: any[] = [];
    changedTouches: any[] = [];
    targetTouches: any[] = [];
    
    constructor(type: string, eventInitDict?: any) {
      super(type, eventInitDict);
      if (eventInitDict) {
        this.touches = eventInitDict.touches || [];
        this.changedTouches = eventInitDict.changedTouches || [];
        this.targetTouches = eventInitDict.targetTouches || [];
      }
    }
  },
});

// Mock console methods in test environment (optional)
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Test performance monitoring (optional)
const performanceMarks: Record<string, number> = {};

global.markTestStart = (testName: string) => {
  performanceMarks[testName] = performance.now();
};

global.markTestEnd = (testName: string) => {
  const startTime = performanceMarks[testName];
  if (startTime) {
    const duration = performance.now() - startTime;
    if (duration > 5000) { // Warn if test takes longer than 5 seconds
      console.warn(`⚠️  Slow test detected: ${testName} took ${duration.toFixed(2)}ms`);
    }
    delete performanceMarks[testName];
  }
};

// Export test utilities for global access
declare global {
  function markTestStart(testName: string): void;
  function markTestEnd(testName: string): void;
}

console.log('🧪 Test environment setup complete');