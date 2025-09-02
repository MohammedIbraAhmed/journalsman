# Security and Performance

## Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`
- XSS Prevention: Content sanitization with DOMPurify for rich text content
- Secure Storage: Encrypted localStorage for sensitive UI state, httpOnly cookies for auth tokens

**Backend Security:**
- Input Validation: Zod schema validation on all tRPC endpoints
- Rate Limiting: 100 requests/minute per IP, 1000 requests/minute per authenticated user
- CORS Policy: Strict origin policy for production domains only

**Authentication Security:**
- Token Storage: httpOnly cookies with secure flag and sameSite policy
- Session Management: NextAuth JWT with 24-hour expiration and refresh rotation
- Password Policy: N/A - OAuth-only authentication via ORCID/Google

## Performance Optimization

**Frontend Performance:**
- Bundle Size Target: <500KB gzipped for main bundle
- Loading Strategy: Progressive loading with React.lazy for route-based code splitting
- Caching Strategy: TanStack Query with 5-minute stale time for submission data

**Backend Performance:**
- Response Time Target: <200ms for API calls, <2s for AI evaluation triggers
- Database Optimization: Compound indexes on publisherId + status queries
- Caching Strategy: Redis caching for credit balances and user sessions with 15-minute TTL
