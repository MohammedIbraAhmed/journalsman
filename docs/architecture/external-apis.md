# External APIs

Based on the Synfind brief requirements and component design, here are the critical external service integrations:

## OpenAI API

- **Purpose:** AI-powered manuscript content analysis, quality evaluation, and language processing
- **Documentation:** https://platform.openai.com/docs/api-reference
- **Base URL(s):** https://api.openai.com/v1
- **Authentication:** Bearer token (API key)
- **Rate Limits:** 3,000 RPM for GPT-4, 10,000 RPM for embedding models

**Key Endpoints Used:**
- `POST /chat/completions` - Manuscript quality evaluation and content analysis
- `POST /embeddings` - Text similarity and duplicate detection
- `POST /moderations` - Content safety and policy compliance checking

**Integration Notes:** Primary AI service for manuscript evaluation with fallback to Anthropic. Requires content chunking for large documents and careful prompt engineering for academic evaluation criteria.

## Anthropic Claude API

- **Purpose:** Fallback AI service for manuscript analysis with enhanced reasoning capabilities
- **Documentation:** https://docs.anthropic.com/claude/reference
- **Base URL(s):** https://api.anthropic.com/v1
- **Authentication:** API key header
- **Rate Limits:** 5,000 RPM for Claude-3.5-Sonnet

**Key Endpoints Used:**
- `POST /messages` - Advanced manuscript analysis and evaluation
- `POST /messages/streaming` - Real-time evaluation progress for large documents

**Integration Notes:** Used as backup for OpenAI and for complex academic reasoning tasks. Provides better handling of long-form academic content and nuanced evaluation.

## Turnitin API

- **Purpose:** Professional plagiarism detection and similarity checking for academic manuscripts
- **Documentation:** https://developers.turnitin.com/docs
- **Base URL(s):** https://api.turnitin.com/v1
- **Authentication:** OAuth 2.0 with client credentials
- **Rate Limits:** 100 submissions per hour per institution

**Key Endpoints Used:**
- `POST /submissions` - Submit manuscript for plagiarism analysis
- `GET /submissions/{id}/similarity-report` - Retrieve detailed similarity report
- `GET /submissions/{id}/status` - Check analysis progress

**Integration Notes:** Premium service requiring institutional licensing. Implements webhook callbacks for async processing. Critical for academic integrity requirements.

## ORCID API

- **Purpose:** Author identification, verification, and profile integration for academic publishing
- **Documentation:** https://info.orcid.org/documentation/api-tutorials/
- **Base URL(s):** https://pub.orcid.org/v3.0, https://api.orcid.org/v3.0
- **Authentication:** OAuth 2.0 for user authorization, client credentials for public data
- **Rate Limits:** 24 requests per second for public API

**Key Endpoints Used:**
- `GET /v3.0/{orcid}/person` - Retrieve author profile and affiliation data
- `GET /v3.0/{orcid}/works` - Fetch author's publication history
- `POST /v3.0/{orcid}/work` - Add publication to author's ORCID record

**Integration Notes:** Essential for author verification and academic credibility. Supports both sandbox and production environments for testing.

## Crossref API

- **Purpose:** DOI registration, citation metadata, and academic publication indexing
- **Documentation:** https://www.crossref.org/documentation/
- **Base URL(s):** https://api.crossref.org, https://api.crossref.org/deposits
- **Authentication:** API key for deposits, public access for queries
- **Rate Limits:** 50 requests per second with etiquette headers

**Key Endpoints Used:**
- `POST /deposits` - Register DOIs for accepted publications
- `GET /works/{doi}` - Retrieve citation metadata for reference validation
- `GET /journals/{issn}` - Validate journal information and indexing status

**Integration Notes:** Critical for academic publishing workflow. Requires Crossref membership for DOI registration. Implements citation formatting and validation.

## Stripe Connect API

- **Purpose:** Payment processing, subscription management, and revenue sharing for the credit marketplace
- **Documentation:** https://stripe.com/docs/connect
- **Base URL(s):** https://api.stripe.com/v1
- **Authentication:** Secret key for server operations, publishable key for client-side
- **Rate Limits:** 100 requests per second per account

**Key Endpoints Used:**
- `POST /payment_intents` - Process credit package purchases
- `POST /accounts` - Create connected accounts for service providers
- `POST /transfers` - Distribute revenue shares to reviewers and service providers
- `GET /subscription` - Manage publisher subscription billing

**Integration Notes:** Handles complex revenue sharing between platform, publishers, reviewers, and service providers. Requires webhook handling for async payment updates.

## Cloudflare R2 API

- **Purpose:** Scalable document storage with global CDN delivery and security controls
- **Documentation:** https://developers.cloudflare.com/r2/api/
- **Base URL(s):** Custom endpoint per account (e.g., https://synfind.r2.cloudflarestorage.com)
- **Authentication:** AWS Signature Version 4 (S3-compatible)
- **Rate Limits:** 1,000 operations per second per bucket

**Key Endpoints Used:**
- `PUT /{bucket}/{key}` - Upload manuscript files with metadata
- `GET /{bucket}/{key}` - Download files with signed URL authentication
- `DELETE /{bucket}/{key}` - Remove files when submissions are withdrawn

**Integration Notes:** S3-compatible API with Cloudflare's global edge network. Implements presigned URLs for direct browser uploads and time-limited access for reviewers.

## SendGrid Email API

- **Purpose:** Transactional email delivery for notifications, invitations, and system communications
- **Documentation:** https://docs.sendgrid.com/api-reference
- **Base URL(s):** https://api.sendgrid.com/v3
- **Authentication:** Bearer token (API key)
- **Rate Limits:** 10,000 emails per day on free tier, unlimited on paid plans

**Key Endpoints Used:**
- `POST /mail/send` - Send individual notification emails
- `POST /mail/batch` - Send bulk notifications for editorial workflows
- `GET /suppression/bounces` - Manage email deliverability and bounces

**Integration Notes:** Supports HTML templates, internationalization, and tracking. Implements email preference management and unsubscribe handling.

## OJS (Open Journal Systems) API

- **Purpose:** Integration with existing OJS installations for migration and synchronization
- **Documentation:** https://docs.pkp.sfu.ca/dev/api/
- **Base URL(s):** Variable per OJS installation (e.g., https://journal.institution.edu/index.php/journal/api/v1)
- **Authentication:** API token or OAuth depending on OJS version
- **Rate Limits:** Varies by institution configuration

**Key Endpoints Used:**
- `GET /submissions` - Import existing manuscript data during migration
- `GET /users` - Migrate user accounts and editorial board information
- `POST /submissions` - Sync published articles back to OJS if required

**Integration Notes:** Varies significantly by OJS version (2.x vs 3.x). Requires custom adapters for different installations. Critical for publisher migration strategy.
