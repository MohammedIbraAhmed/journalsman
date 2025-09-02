import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { connectToDatabase } from '@synfind/database';
import { PublisherModel } from '@synfind/database';
import { createPublisherSchema, publisherSchema } from '@synfind/shared';

export const publisherRouter = createTRPCRouter({
  // Get all publishers for a user
  getPublishersByUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const publisherModel = new PublisherModel(db);
        
        const publishers = await publisherModel.findByAdminUser(input.userId);
        
        return {
          success: true,
          data: publishers,
        };
      } catch (error) {
        console.error('Failed to fetch publishers for user:', error);
        return {
          success: false,
          error: 'Failed to fetch publishers',
        };
      }
    }),

  // Get publisher by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const publisherModel = new PublisherModel(db);
        
        const publisher = await publisherModel.findById(input.id);
        
        if (!publisher) {
          return {
            success: false,
            error: 'Publisher not found',
          };
        }
        
        return {
          success: true,
          data: publisher,
        };
      } catch (error) {
        console.error('Failed to fetch publisher:', error);
        return {
          success: false,
          error: 'Failed to fetch publisher',
        };
      }
    }),

  // Create new publisher
  create: publicProcedure
    .input(createPublisherSchema.extend({
      adminUserId: z.string(), // User ID who will be the initial admin
    }))
    .mutation(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const publisherModel = new PublisherModel(db);
        
        const { adminUserId, ...publisherData } = input;
        
        const publisherDoc = {
          ...publisherData,
          adminUsers: [adminUserId],
          journals: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const publisher = await publisherModel.create(publisherDoc);
        
        return {
          success: true,
          data: publisher,
        };
      } catch (error) {
        console.error('Failed to create publisher:', error);
        return {
          success: false,
          error: 'Failed to create publisher',
        };
      }
    }),

  // Update publisher
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      updates: publisherSchema.partial().omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      }),
    }))
    .mutation(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const publisherModel = new PublisherModel(db);
        
        const publisher = await publisherModel.updateById(input.id, input.updates);
        
        if (!publisher) {
          return {
            success: false,
            error: 'Publisher not found',
          };
        }
        
        return {
          success: true,
          data: publisher,
        };
      } catch (error) {
        console.error('Failed to update publisher:', error);
        return {
          success: false,
          error: 'Failed to update publisher',
        };
      }
    }),

  // Add admin user to publisher
  addAdminUser: publicProcedure
    .input(z.object({
      publisherId: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const publisherModel = new PublisherModel(db);
        
        const success = await publisherModel.addAdminUser(input.publisherId, input.userId);
        
        return {
          success: success,
          message: success ? 'Admin user added successfully' : 'Failed to add admin user',
        };
      } catch (error) {
        console.error('Failed to add admin user:', error);
        return {
          success: false,
          error: 'Failed to add admin user',
        };
      }
    }),

  // Remove admin user from publisher
  removeAdminUser: publicProcedure
    .input(z.object({
      publisherId: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const publisherModel = new PublisherModel(db);
        
        const success = await publisherModel.removeAdminUser(input.publisherId, input.userId);
        
        return {
          success,
          message: success ? 'Admin user removed successfully' : 'Failed to remove admin user',
        };
      } catch (error) {
        console.error('Failed to remove admin user:', error);
        return {
          success: false,
          error: 'Failed to remove admin user',
        };
      }
    }),

  // Get publisher statistics and summary
  getPublisherSummary: publicProcedure
    .input(z.object({ publisherId: z.string() }))
    .query(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const publisherModel = new PublisherModel(db);
        
        // Get publisher
        const publisher = await publisherModel.findById(input.publisherId);
        
        if (!publisher) {
          return {
            success: false,
            error: 'Publisher not found',
          };
        }
        
        // Get journal count (this would need the journal model)
        const journalCount = publisher.journals.length;
        
        return {
          success: true,
          data: {
            publisher,
            statistics: {
              totalJournals: journalCount,
              activeJournals: journalCount, // TODO: Filter by active status
              adminUserCount: publisher.adminUsers.length,
              verificationStatus: publisher.institutionalDetails.verification.status,
              billingStatus: publisher.billingInfo.isActive ? 'active' : 'inactive',
            },
          },
        };
      } catch (error) {
        console.error('Failed to fetch publisher summary:', error);
        return {
          success: false,
          error: 'Failed to fetch publisher summary',
        };
      }
    }),

  // Delete publisher (soft delete by changing status)
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const publisherModel = new PublisherModel(db);
        
        // TODO: Implement soft delete or actual delete with journal cleanup
        const success = await publisherModel.deleteById(input.id);
        
        return {
          success,
          message: success ? 'Publisher deleted successfully' : 'Failed to delete publisher',
        };
      } catch (error) {
        console.error('Failed to delete publisher:', error);
        return {
          success: false,
          error: 'Failed to delete publisher',
        };
      }
    }),
});