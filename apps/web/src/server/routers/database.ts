import { createTRPCRouter, publicProcedure } from '../trpc';
import { connectToDatabase } from '@synfind/database';

export const databaseRouter = createTRPCRouter({
  testConnection: publicProcedure
    .query(async () => {
      try {
        const { db } = await connectToDatabase();
        
        // Test basic connection
        await db.admin().ping();
        
        // Get database stats
        const stats = await db.stats();
        
        return {
          success: true as const,
          message: 'MongoDB connection successful',
          database: stats.db,
          collections: stats.collections,
          dataSize: stats.dataSize,
          indexSize: stats.indexSize,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Database connection test failed:', error);
        return {
          success: false as const,
          message: 'MongoDB connection failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        };
      }
    }),
});