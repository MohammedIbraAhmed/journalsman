import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import type { 
  JournalBrandingConfig,
  BrandingAsset,
  BrandingColorScheme,
  BrandingTypography,
  CustomDomainConfig,
  AccessibilityValidation,
  BrandingPreview,
  EditorialCustomization
} from '@shared/types';

export const brandingRouter = createTRPCRouter({
  // Get branding configuration for a journal
  getConfig: protectedProcedure
    .input(z.object({
      journalId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { journalId } = input;
      
      // Verify user has access to this journal
      const journal = await ctx.db.collection('journals').findOne({
        _id: journalId,
        $or: [
          { 'editorialBoard.userId': ctx.session.user.id },
          { publisherId: { $in: await getUserPublisherIds(ctx.db, ctx.session.user.id) } }
        ]
      });

      if (!journal) {
        throw new Error('Unauthorized: Cannot access branding for this journal');
      }

      // Get branding configuration
      const brandingConfig = await ctx.db.collection('journal_branding').findOne({
        journalId,
        isActive: true
      });

      return brandingConfig || createDefaultBrandingConfig(journalId);
    }),

  // Update branding configuration
  updateConfig: protectedProcedure
    .input(z.object({
      journalId: z.string(),
      config: z.object({
        colorScheme: z.object({
          primary: z.string(),
          secondary: z.string(),
          accent: z.string(),
          background: z.string(),
          surface: z.string(),
          text: z.object({
            primary: z.string(),
            secondary: z.string(),
            muted: z.string()
          }),
          borders: z.string(),
          hover: z.string(),
          focus: z.string(),
          success: z.string(),
          warning: z.string(),
          error: z.string()
        }).optional(),
        typography: z.object({
          headingFont: z.object({
            family: z.string(),
            weights: z.array(z.number()),
            styles: z.array(z.enum(['normal', 'italic'])),
            source: z.enum(['system', 'google', 'custom']),
            fallbacks: z.array(z.string())
          }),
          bodyFont: z.object({
            family: z.string(),
            weights: z.array(z.number()),
            styles: z.array(z.enum(['normal', 'italic'])),
            source: z.enum(['system', 'google', 'custom']),
            fallbacks: z.array(z.string())
          }),
          scale: z.object({
            baseSize: z.number(),
            scaleRatio: z.number(),
            lineHeight: z.object({
              tight: z.number(),
              normal: z.number(),
              loose: z.number()
            }),
            letterSpacing: z.object({
              tight: z.string(),
              normal: z.string(),
              wide: z.string()
            })
          })
        }).optional(),
        customCSS: z.string().optional()
      })
    }))
    .mutation(async ({ ctx, input }) => {
      const { journalId, config } = input;

      // Verify access
      const journal = await ctx.db.collection('journals').findOne({
        _id: journalId,
        $or: [
          { 'editorialBoard.userId': ctx.session.user.id },
          { publisherId: { $in: await getUserPublisherIds(ctx.db, ctx.session.user.id) } }
        ]
      });

      if (!journal) {
        throw new Error('Unauthorized: Cannot modify branding for this journal');
      }

      // Validate accessibility if color scheme is provided
      let accessibilityValidation: AccessibilityValidation | undefined;
      if (config.colorScheme) {
        accessibilityValidation = await validateAccessibility(config.colorScheme);
        
        if (!accessibilityValidation.isCompliant) {
          throw new Error(`Accessibility validation failed: WCAG ${accessibilityValidation.wcagLevel}. Violations: ${accessibilityValidation.violations.map(v => v.description).join(', ')}`);
        }
      }

      // Update or create branding configuration
      const updatedConfig = {
        journalId,
        ...config,
        accessibility: accessibilityValidation,
        updatedAt: new Date()
      };

      const result = await ctx.db.collection('journal_branding').updateOne(
        { journalId, isActive: true },
        { 
          $set: updatedConfig,
          $setOnInsert: {
            id: generateId(),
            createdAt: new Date(),
            isActive: true
          }
        },
        { upsert: true }
      );

      return await ctx.db.collection('journal_branding').findOne({
        journalId,
        isActive: true
      });
    }),

  // Upload branding asset (logo, favicon, etc.)
  uploadAsset: protectedProcedure
    .input(z.object({
      journalId: z.string(),
      type: z.enum(['logo', 'favicon', 'banner', 'watermark']),
      file: z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
        buffer: z.any() // In real implementation, this would be handled by file upload middleware
      })
    }))
    .mutation(async ({ ctx, input }) => {
      const { journalId, type, file } = input;

      // Verify access
      const journal = await ctx.db.collection('journals').findOne({
        _id: journalId,
        $or: [
          { 'editorialBoard.userId': ctx.session.user.id },
          { publisherId: { $in: await getUserPublisherIds(ctx.db, ctx.session.user.id) } }
        ]
      });

      if (!journal) {
        throw new Error('Unauthorized: Cannot upload assets for this journal');
      }

      // Validate file
      const validation = await validateBrandingAsset(file, type);
      if (!validation.isValid) {
        throw new Error(`Invalid file: ${validation.errors.join(', ')}`);
      }

      // Process and upload file (in real implementation, this would use cloud storage)
      const processedAsset = await processAndUploadAsset(file, type, journalId);

      // Save asset metadata to database
      const asset: BrandingAsset = {
        id: generateId(),
        type,
        url: processedAsset.url,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        dimensions: processedAsset.dimensions,
        variants: processedAsset.variants,
        uploadedAt: new Date()
      };

      await ctx.db.collection('branding_assets').insertOne(asset);

      // Update branding configuration to reference new asset
      await ctx.db.collection('journal_branding').updateOne(
        { journalId, isActive: true },
        { 
          $set: { 
            [type]: asset,
            updatedAt: new Date()
          } 
        },
        { upsert: true }
      );

      return asset;
    }),

  // Generate branding preview
  generatePreview: protectedProcedure
    .input(z.object({
      journalId: z.string(),
      config: z.any() // Temporary branding config for preview
    }))
    .mutation(async ({ ctx, input }) => {
      const { journalId, config } = input;

      // Verify access
      const journal = await ctx.db.collection('journals').findOne({
        _id: journalId,
        $or: [
          { 'editorialBoard.userId': ctx.session.user.id },
          { publisherId: { $in: await getUserPublisherIds(ctx.db, ctx.session.user.id) } }
        ]
      });

      if (!journal) {
        throw new Error('Unauthorized: Cannot generate preview for this journal');
      }

      // Generate preview screenshots
      const preview = await generateBrandingPreview(journalId, config);

      return preview;
    }),

  // Configure custom domain
  configureDomain: protectedProcedure
    .input(z.object({
      journalId: z.string(),
      subdomain: z.string().optional(),
      customDomain: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { journalId, subdomain, customDomain } = input;

      if (!subdomain && !customDomain) {
        throw new Error('Either subdomain or custom domain must be provided');
      }

      // Verify access
      const journal = await ctx.db.collection('journals').findOne({
        _id: journalId,
        $or: [
          { 'editorialBoard.userId': ctx.session.user.id },
          { publisherId: { $in: await getUserPublisherIds(ctx.db, ctx.session.user.id) } }
        ]
      });

      if (!journal) {
        throw new Error('Unauthorized: Cannot configure domain for this journal');
      }

      // Check domain availability
      if (subdomain) {
        const existing = await ctx.db.collection('custom_domains').findOne({
          subdomain,
          isActive: true
        });
        if (existing) {
          throw new Error('Subdomain is already taken');
        }
      }

      if (customDomain) {
        const existing = await ctx.db.collection('custom_domains').findOne({
          customDomain,
          isActive: true
        });
        if (existing) {
          throw new Error('Custom domain is already configured');
        }
      }

      // Create domain configuration
      const domainConfig: CustomDomainConfig = {
        id: generateId(),
        journalId,
        subdomain,
        customDomain,
        sslStatus: 'pending',
        sslProvider: 'lets_encrypt',
        dnsValidation: {
          isValid: false,
          requiredRecords: generateRequiredDnsRecords(subdomain, customDomain),
          currentRecords: [],
          validatedAt: new Date(),
          errors: []
        },
        setupStatus: 'pending',
        setupAttempts: 0,
        setupInstructions: await generateDnsSetupInstructions(customDomain),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await ctx.db.collection('custom_domains').insertOne(domainConfig);

      // Start domain setup process (in background)
      void initiateDomainSetup(domainConfig);

      return domainConfig;
    }),

  // Get domain setup status
  getDomainStatus: protectedProcedure
    .input(z.object({
      journalId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { journalId } = input;

      const domainConfig = await ctx.db.collection('custom_domains').findOne({
        journalId,
        isActive: true
      });

      return domainConfig;
    }),

  // Get editorial customization
  getEditorialConfig: protectedProcedure
    .input(z.object({
      journalId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { journalId } = input;

      // Verify access
      const journal = await ctx.db.collection('journals').findOne({
        _id: journalId,
        $or: [
          { 'editorialBoard.userId': ctx.session.user.id },
          { publisherId: { $in: await getUserPublisherIds(ctx.db, ctx.session.user.id) } }
        ]
      });

      if (!journal) {
        throw new Error('Unauthorized: Cannot access editorial config for this journal');
      }

      const config = await ctx.db.collection('editorial_customization').findOne({
        journalId,
        isActive: true
      });

      return config || createDefaultEditorialConfig(journalId);
    }),

  // Update editorial customization
  updateEditorialConfig: protectedProcedure
    .input(z.object({
      journalId: z.string(),
      config: z.object({
        submissionGuidelines: z.object({
          html: z.string(),
          markdown: z.string(),
          plainText: z.string()
        }).optional(),
        communicationTemplates: z.array(z.object({
          id: z.string(),
          type: z.string(),
          subject: z.string(),
          content: z.object({
            html: z.string(),
            markdown: z.string(),
            plainText: z.string()
          })
        })).optional()
      })
    }))
    .mutation(async ({ ctx, input }) => {
      const { journalId, config } = input;

      // Verify access
      const journal = await ctx.db.collection('journals').findOne({
        _id: journalId,
        $or: [
          { 'editorialBoard.userId': ctx.session.user.id },
          { publisherId: { $in: await getUserPublisherIds(ctx.db, ctx.session.user.id) } }
        ]
      });

      if (!journal) {
        throw new Error('Unauthorized: Cannot update editorial config for this journal');
      }

      // Update editorial configuration
      const updatedConfig = {
        journalId,
        ...config,
        updatedAt: new Date()
      };

      await ctx.db.collection('editorial_customization').updateOne(
        { journalId, isActive: true },
        { 
          $set: updatedConfig,
          $setOnInsert: {
            id: generateId(),
            createdAt: new Date(),
            isActive: true
          }
        },
        { upsert: true }
      );

      return await ctx.db.collection('editorial_customization').findOne({
        journalId,
        isActive: true
      });
    }),

  // Get branding analytics
  getAnalytics: protectedProcedure
    .input(z.object({
      journalId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { journalId } = input;

      // Verify access
      const journal = await ctx.db.collection('journals').findOne({
        _id: journalId,
        $or: [
          { 'editorialBoard.userId': ctx.session.user.id },
          { publisherId: { $in: await getUserPublisherIds(ctx.db, ctx.session.user.id) } }
        ]
      });

      if (!journal) {
        throw new Error('Unauthorized: Cannot access analytics for this journal');
      }

      return await calculateBrandingAnalytics(ctx.db, journalId);
    })
});

// Helper functions
async function getUserPublisherIds(db: any, userId: string): Promise<string[]> {
  const publishers = await db.collection('publishers').find({
    adminUsers: userId
  }).toArray();
  
  return publishers.map((p: any) => p._id);
}

function createDefaultBrandingConfig(journalId: string): JournalBrandingConfig {
  return {
    id: generateId(),
    journalId,
    colorScheme: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: {
        primary: '#0f172a',
        secondary: '#475569',
        muted: '#94a3b8'
      },
      borders: '#e2e8f0',
      hover: '#3b82f6',
      focus: '#2563eb',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      contrastValidation: {
        isValid: true,
        scores: {
          primaryOnBackground: 4.5,
          secondaryOnBackground: 3.2,
          textOnPrimary: 4.8,
          textOnSecondary: 4.2
        },
        wcagLevel: 'AA',
        validatedAt: new Date()
      }
    },
    typography: {
      headingFont: {
        family: 'Inter',
        weights: [400, 500, 600, 700],
        styles: ['normal'],
        source: 'google',
        fallbacks: ['system-ui', 'sans-serif']
      },
      bodyFont: {
        family: 'Inter',
        weights: [400, 500],
        styles: ['normal', 'italic'],
        source: 'google',
        fallbacks: ['system-ui', 'sans-serif']
      },
      monoFont: {
        family: 'Fira Code',
        weights: [400, 500],
        styles: ['normal'],
        source: 'google',
        fallbacks: ['Monaco', 'monospace']
      },
      scale: {
        baseSize: 16,
        scaleRatio: 1.25,
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          loose: 1.75
        },
        letterSpacing: {
          tight: '-0.025em',
          normal: '0em',
          wide: '0.025em'
        }
      }
    },
    accessibility: {
      isCompliant: true,
      wcagLevel: 'AA',
      violations: [],
      lastValidated: new Date(),
      autoFixSuggestions: []
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createDefaultEditorialConfig(journalId: string): EditorialCustomization {
  return {
    id: generateId(),
    journalId,
    submissionGuidelines: {
      html: '<p>Please follow our submission guidelines...</p>',
      markdown: 'Please follow our submission guidelines...',
      plainText: 'Please follow our submission guidelines...',
      wordCount: 6,
      lastEditedBy: 'system',
      lastEditedAt: new Date()
    },
    reviewCriteria: [],
    communicationTemplates: [],
    authorPortalConfig: {
      welcomeMessage: {
        html: '<h2>Welcome to our journal submission system</h2>',
        markdown: '## Welcome to our journal submission system',
        plainText: 'Welcome to our journal submission system',
        wordCount: 7,
        lastEditedBy: 'system',
        lastEditedAt: new Date()
      },
      supportContact: {
        primaryEmail: 'support@journal.com'
      },
      showProgress: true,
      showReviewTimeline: true,
      allowWithdrawals: true,
      customFields: []
    },
    institutionalCompliance: {
      dataRetentionPolicy: '7 years',
      privacyNotice: {
        html: '<p>We respect your privacy...</p>',
        markdown: 'We respect your privacy...',
        plainText: 'We respect your privacy...',
        wordCount: 4,
        lastEditedBy: 'system',
        lastEditedAt: new Date()
      },
      ethicsStatement: {
        html: '<p>We adhere to ethical publishing standards...</p>',
        markdown: 'We adhere to ethical publishing standards...',
        plainText: 'We adhere to ethical publishing standards...',
        wordCount: 7,
        lastEditedBy: 'system',
        lastEditedAt: new Date()
      },
      fundingDisclosure: {
        html: '<p>Please disclose funding sources...</p>',
        markdown: 'Please disclose funding sources...',
        plainText: 'Please disclose funding sources...',
        wordCount: 5,
        lastEditedBy: 'system',
        lastEditedAt: new Date()
      },
      conflictOfInterestPolicy: {
        html: '<p>Authors must declare conflicts of interest...</p>',
        markdown: 'Authors must declare conflicts of interest...',
        plainText: 'Authors must declare conflicts of interest...',
        wordCount: 7,
        lastEditedBy: 'system',
        lastEditedAt: new Date()
      },
      customPolicies: []
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Mock implementation functions
async function validateAccessibility(colorScheme: Partial<BrandingColorScheme>): Promise<AccessibilityValidation> {
  // Mock accessibility validation - in real implementation would use tools like axe-core
  return {
    isCompliant: true,
    wcagLevel: 'AA',
    violations: [],
    lastValidated: new Date(),
    autoFixSuggestions: []
  };
}

async function validateBrandingAsset(file: any, type: string) {
  // Mock file validation
  return {
    isValid: true,
    errors: []
  };
}

async function processAndUploadAsset(file: any, type: string, journalId: string) {
  // Mock asset processing and upload
  return {
    url: `https://cdn.example.com/${journalId}/${type}/${Date.now()}-${file.name}`,
    dimensions: { width: 200, height: 200 },
    variants: []
  };
}

async function generateBrandingPreview(journalId: string, config: any): Promise<BrandingPreview> {
  // Mock preview generation
  return {
    journalId,
    brandingConfig: config,
    previewUrl: `https://preview.example.com/${journalId}`,
    screenshotUrls: {
      desktop: `https://screenshots.example.com/${journalId}/desktop.png`,
      tablet: `https://screenshots.example.com/${journalId}/tablet.png`,
      mobile: `https://screenshots.example.com/${journalId}/mobile.png`
    },
    generatedAt: new Date(),
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  };
}

function generateRequiredDnsRecords(subdomain?: string, customDomain?: string) {
  // Mock DNS record generation
  return [
    {
      type: 'CNAME' as const,
      name: subdomain ? `${subdomain}.synfind.com` : customDomain || '',
      value: 'journals.synfind.com',
      ttl: 300
    }
  ];
}

async function generateDnsSetupInstructions(domain?: string) {
  // Mock DNS setup instructions
  return {
    provider: 'Generic DNS Provider',
    steps: [
      {
        stepNumber: 1,
        title: 'Add CNAME Record',
        description: 'Add a CNAME record pointing to our servers',
        action: 'add_record' as const,
        estimatedTime: 5
      }
    ],
    estimatedTime: 15
  };
}

async function initiateDomainSetup(config: CustomDomainConfig) {
  // Mock domain setup process
  console.log('Domain setup initiated for:', config.customDomain || config.subdomain);
}

async function calculateBrandingAnalytics(db: any, journalId: string) {
  // Mock analytics calculation
  return {
    journalId,
    completionRate: 75,
    setupTime: 45,
    customizationScores: {
      logo: 80,
      colors: 90,
      typography: 70,
      domain: 60,
      editorial: 85
    },
    accessibilityScore: 95,
    performanceImpact: 5, // 5% performance impact
    userSatisfactionRating: 4.2,
    lastUpdated: new Date()
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}