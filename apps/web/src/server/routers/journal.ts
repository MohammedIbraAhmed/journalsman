import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { connectToDatabase } from '@synfind/database';
import { JournalModel, PublisherModel } from '@synfind/database';
import { createJournalSchema, journalSchema } from '@synfind/shared';

export const journalRouter = createTRPCRouter({
  // Get all journals for a publisher
  getJournalsByPublisher: publicProcedure
    .input(z.object({ 
      publisherId: z.string(),
      status: z.enum(['draft', 'active', 'suspended', 'archived']).optional(),
      limit: z.number().default(50),
      skip: z.number().default(0),
    }))
    .query(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const journalModel = new JournalModel(db);
        
        const journals = await journalModel.findByPublisherId(
          input.publisherId, 
          input.status, 
          input.limit, 
          input.skip
        );
        
        return {
          success: true,
          data: journals,
        };
      } catch (error) {
        console.error('Failed to fetch journals for publisher:', error);
        return {
          success: false,
          error: 'Failed to fetch journals',
        };
      }
    }),

  // Get journal by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const journalModel = new JournalModel(db);
        
        const journal = await journalModel.findById(input.id);
        
        if (!journal) {
          return {
            success: false,
            error: 'Journal not found',
          };
        }
        
        return {
          success: true,
          data: journal,
        };
      } catch (error) {
        console.error('Failed to fetch journal:', error);
        return {
          success: false,
          error: 'Failed to fetch journal',
        };
      }
    }),

  // Get journal by short name (URL slug)
  getByShortName: publicProcedure
    .input(z.object({ shortName: z.string() }))
    .query(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const journalModel = new JournalModel(db);
        
        const journal = await journalModel.findByShortName(input.shortName);
        
        if (!journal) {
          return {
            success: false,
            error: 'Journal not found',
          };
        }
        
        return {
          success: true,
          data: journal,
        };
      } catch (error) {
        console.error('Failed to fetch journal by short name:', error);
        return {
          success: false,
          error: 'Failed to fetch journal',
        };
      }
    }),

  // Create new journal
  create: publicProcedure
    .input(createJournalSchema.extend({
      // Add default configurations
      useDefaultSettings: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const journalModel = new JournalModel(db);
        const publisherModel = new PublisherModel(db);
        
        const { useDefaultSettings, ...journalInput } = input;
        
        // Create default configuration if requested
        let configuration = journalInput.configuration;
        if (useDefaultSettings) {
          configuration = {
            submissionSettings: {
              acceptManuscripts: true,
              allowedFileTypes: ['pdf', 'docx', 'tex'],
              maxFileSize: 50,
              requireCoverLetter: true,
              requireAbstract: true,
              maxAbstractWords: 250,
              requireKeywords: true,
              maxKeywords: 6,
            },
            reviewSettings: {
              reviewType: 'double_blind',
              reviewerCount: 2,
              reviewTimeLimit: 30,
              autoAssignReviewers: false,
              requireReviewerComments: true,
            },
            publishingSettings: {
              openAccess: true,
              embargoPeriod: 0,
              licensingType: 'CC_BY',
              digitalObjectIdentifier: true,
            },
            workflowSettings: {
              autoAcknowledgeSubmission: true,
              plagiarismCheck: true,
              aiDetection: false,
              statisticalReview: false,
            },
          };
        }

        // Create default branding with theme
        const branding = journalInput.branding || {
          theme: 'default',
        };
        
        const journalDoc = {
          ...journalInput,
          configuration,
          branding,
          status: 'draft' as const,
          statistics: {
            totalSubmissions: 0,
            acceptedSubmissions: 0,
            rejectedSubmissions: 0,
            averageReviewTime: 0,
            currentActiveSubmissions: 0,
            publishedArticles: 0,
            totalViews: 0,
            totalDownloads: 0,
            lastUpdated: new Date(),
          },
          editorialBoard: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const journal = await journalModel.create(journalDoc);
        
        // Add journal to publisher's journal list
        await publisherModel.addJournal(journalInput.publisherId, journal.id);
        
        return {
          success: true,
          data: journal,
        };
      } catch (error) {
        console.error('Failed to create journal:', error);
        return {
          success: false,
          error: 'Failed to create journal',
        };
      }
    }),

  // Update journal
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      updates: journalSchema.partial().omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      }),
    }))
    .mutation(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const journalModel = new JournalModel(db);
        
        const journal = await journalModel.updateById(input.id, input.updates);
        
        if (!journal) {
          return {
            success: false,
            error: 'Journal not found',
          };
        }
        
        return {
          success: true,
          data: journal,
        };
      } catch (error) {
        console.error('Failed to update journal:', error);
        return {
          success: false,
          error: 'Failed to update journal',
        };
      }
    }),

  // Update journal status
  updateStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['draft', 'active', 'suspended', 'archived']),
    }))
    .mutation(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const journalModel = new JournalModel(db);
        
        const success = await journalModel.updateJournalStatus(input.id, input.status);
        
        return {
          success,
          message: success ? 'Journal status updated successfully' : 'Failed to update journal status',
        };
      } catch (error) {
        console.error('Failed to update journal status:', error);
        return {
          success: false,
          error: 'Failed to update journal status',
        };
      }
    }),

  // Add editorial board member
  addEditorialBoardMember: publicProcedure
    .input(z.object({
      journalId: z.string(),
      member: z.object({
        userId: z.string(),
        role: z.enum(['editor_in_chief', 'associate_editor', 'section_editor', 'reviewer', 'editorial_assistant']),
        specialization: z.array(z.string()).optional(),
        isActive: z.boolean().default(true),
      }),
    }))
    .mutation(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const journalModel = new JournalModel(db);
        
        const memberWithDate = {
          ...input.member,
          joinedAt: new Date(),
        };
        
        const success = await journalModel.addEditorialBoardMember(input.journalId, memberWithDate);
        
        return {
          success,
          message: success ? 'Editorial board member added successfully' : 'Failed to add editorial board member',
        };
      } catch (error) {
        console.error('Failed to add editorial board member:', error);
        return {
          success: false,
          error: 'Failed to add editorial board member',
        };
      }
    }),

  // Remove editorial board member
  removeEditorialBoardMember: publicProcedure
    .input(z.object({
      journalId: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const journalModel = new JournalModel(db);
        
        const success = await journalModel.removeEditorialBoardMember(input.journalId, input.userId);
        
        return {
          success,
          message: success ? 'Editorial board member removed successfully' : 'Failed to remove editorial board member',
        };
      } catch (error) {
        console.error('Failed to remove editorial board member:', error);
        return {
          success: false,
          error: 'Failed to remove editorial board member',
        };
      }
    }),

  // Search journals by name
  searchByName: publicProcedure
    .input(z.object({
      searchTerm: z.string(),
      publisherId: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const journalModel = new JournalModel(db);
        
        const journals = await journalModel.searchJournalsByName(
          input.searchTerm,
          input.publisherId,
          input.limit
        );
        
        return {
          success: true,
          data: journals,
        };
      } catch (error) {
        console.error('Failed to search journals:', error);
        return {
          success: false,
          error: 'Failed to search journals',
        };
      }
    }),

  // Get journal count for publisher
  getJournalCount: publicProcedure
    .input(z.object({
      publisherId: z.string(),
      status: z.enum(['draft', 'active', 'suspended', 'archived']).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const journalModel = new JournalModel(db);
        
        const count = await journalModel.getJournalCount(input.publisherId, input.status);
        
        return {
          success: true,
          data: { count },
        };
      } catch (error) {
        console.error('Failed to get journal count:', error);
        return {
          success: false,
          error: 'Failed to get journal count',
        };
      }
    }),

  // Update journal statistics
  updateStatistics: publicProcedure
    .input(z.object({
      journalId: z.string(),
      statistics: z.object({
        totalSubmissions: z.number().optional(),
        acceptedSubmissions: z.number().optional(),
        rejectedSubmissions: z.number().optional(),
        averageReviewTime: z.number().optional(),
        currentActiveSubmissions: z.number().optional(),
        publishedArticles: z.number().optional(),
        totalViews: z.number().optional(),
        totalDownloads: z.number().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const journalModel = new JournalModel(db);
        
        const success = await journalModel.updateStatistics(input.journalId, input.statistics);
        
        return {
          success,
          message: success ? 'Statistics updated successfully' : 'Failed to update statistics',
        };
      } catch (error) {
        console.error('Failed to update journal statistics:', error);
        return {
          success: false,
          error: 'Failed to update journal statistics',
        };
      }
    }),

  // Delete journal
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const { db } = await connectToDatabase();
        const journalModel = new JournalModel(db);
        const publisherModel = new PublisherModel(db);
        
        // Get journal to find publisher ID
        const journal = await journalModel.findById(input.id);
        if (journal) {
          // Remove journal from publisher's journal list
          await publisherModel.removeJournal(journal.publisherId, input.id);
        }
        
        const success = await journalModel.deleteById(input.id);
        
        return {
          success,
          message: success ? 'Journal deleted successfully' : 'Failed to delete journal',
        };
      } catch (error) {
        console.error('Failed to delete journal:', error);
        return {
          success: false,
          error: 'Failed to delete journal',
        };
      }
    }),
});