# Contributing to JournalsMan

Thank you for your interest in contributing to JournalsMan! This document provides guidelines and instructions for contributing to our academic journal management platform.

## 🎯 Development Philosophy

We follow a **story-driven development** approach where each feature is implemented as a complete "story" with:
- Clear acceptance criteria
- Comprehensive QA testing
- Complete documentation
- Performance validation

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- MongoDB 4.4+
- Git
- GitHub account

### Quick Setup
```bash
# Clone the repository
git clone https://github.com/MohammedIbraAhmed/journalsman.git
cd journalsman

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development
npm run dev
```

## 📋 Development Rules

Please read [`DEVELOPMENT_RULES.md`](./DEVELOPMENT_RULES.md) for comprehensive guidelines on:
- MCP tool usage (Context7, shadcn/ui, Sequential Thinking)
- Development workflow standards
- QA testing requirements
- Git workflow conventions

## 🚀 Story Development Process

### 1. Story Planning
Before starting any development:

```bash
# Use Sequential Thinking MCP for complex stories
# Plan implementation approach
# Identify technical dependencies
# Estimate complexity and timeline
```

### 2. Branch Creation
Create a feature branch following our naming convention:

```bash
git checkout -b story-X.Y-short-description
```

Where:
- `X.Y` is the story number (e.g., 1.1, 2.3)
- `short-description` is a brief description

### 3. Implementation Guidelines

#### Research Phase
- **Use MCP Context7** for latest documentation
- Check API references and best practices
- Review similar implementations

#### UI Development
- **Use shadcn/ui MCP** for all component development
- Follow shadcn patterns and accessibility standards
- Maintain design system consistency

#### Complex Problem Solving
- **Use Sequential Thinking MCP** for multi-step planning
- Document architectural decisions
- Break down complex tasks systematically

### 4. Quality Assurance (Mandatory)

Before any commit or push, ensure:

```bash
# All tests pass
npm test
npm run test:integration

# Code quality checks
npm run lint
npm run type-check

# Build succeeds
npm run build
```

#### Story-Specific QA Tests
Each story must have comprehensive integration tests:
- Located in `apps/web/tests/integration/`
- Named as `{story-description}.test.tsx`
- Cover all acceptance criteria
- Include performance and accessibility validation

### 5. Documentation Updates
- Update story documentation in `docs/stories/`
- Mark acceptance criteria as complete `[x]`
- Update implementation status
- Add QA test results

### 6. Pull Request Process
1. Create PR using the provided template
2. Automated GitHub Actions validation runs
3. All checks must pass before review
4. Code review by team members
5. Automated merge after approval

## 🧪 Testing Standards

### Test Categories
1. **Unit Tests**: Individual component/function testing
2. **Integration Tests**: Story workflow testing
3. **E2E Tests**: Complete user journey testing
4. **Performance Tests**: Load time and responsiveness
5. **Accessibility Tests**: WCAG 2.1 AA compliance

### Coverage Requirements
- **Minimum 80% code coverage**
- **All user-facing functionality tested**
- **Error conditions handled**
- **Performance benchmarks met**

### Writing Tests

#### Integration Tests Example
```typescript
describe('Story X.Y Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Feature Description', () => {
    it('should meet acceptance criteria 1', async () => {
      // Test implementation
      expect(result).toBe(expected);
    });

    it('should maintain performance standards', async () => {
      const startTime = Date.now();
      // Execute feature
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // <2 seconds
    });
  });
});
```

## 📝 Code Style Guidelines

### TypeScript Standards
- Use strict mode
- No `any` types without justification
- Proper interface definitions
- Generic types where appropriate

### React/Next.js Standards
- Functional components with hooks
- Proper error boundaries
- Server/client component separation in App Router
- Accessibility-first development

### tRPC Standards
- Type-safe procedures
- Proper input validation with Zod
- Error handling with appropriate codes
- Performance optimization

## 🔄 Git Workflow

### Commit Message Format
```
type(scope): description

Examples:
feat(auth): implement ORCID OAuth provider
fix(dashboard): resolve analytics data loading issue
test(branding): add comprehensive branding system tests
docs(readme): update installation instructions
```

### Branch Protection Rules
- All pushes to `main` require PR approval
- GitHub Actions checks must pass
- Story-specific tests must pass
- Documentation must be updated

## 🎨 Design System

### UI Components
- Use shadcn/ui components as base
- Maintain consistency with design tokens
- Follow accessibility guidelines (WCAG 2.1 AA)
- Support dark/light themes

### Branding Guidelines
- Academic-focused color schemes
- Professional typography choices
- Accessible contrast ratios
- Responsive design principles

## 🔒 Security Guidelines

### Authentication
- Academic domain validation for Google OAuth
- Secure session management
- Proper CSRF protection
- Input sanitization

### Data Protection
- Tenant isolation enforced
- No sensitive data in logs
- Proper error handling without data leakage
- Regular security dependency updates

## 📊 Performance Standards

All contributions must meet:
- **Page load times**: < 2 seconds
- **Interactive elements**: < 100ms response
- **Core Web Vitals**: All metrics in green
- **Bundle size**: Monitored and optimized

## 🌐 Accessibility Requirements

### WCAG 2.1 AA Compliance
- Color contrast ratios ≥ 4.5:1
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Semantic HTML structure

### Testing Accessibility
```bash
# Run accessibility tests
npm run test:a11y

# Use automated validation in components
<AccessibilityValidator colorScheme={colors} />
```

## 📚 Documentation Requirements

### Code Documentation
- TSDoc comments for public APIs
- Complex logic explanations
- Usage examples for components
- Performance considerations

### Story Documentation
- Implementation approach
- Technical decisions
- QA test results
- Performance metrics

## 🐛 Bug Reports

### Creating Issues
1. Use the issue template
2. Provide minimal reproduction case
3. Include environment details
4. Add relevant labels

### Bug Fix Process
1. Create branch: `fix-issue-number-description`
2. Write failing test first
3. Implement fix
4. Ensure all tests pass
5. Update documentation if needed

## 🚀 Feature Requests

### New Story Proposals
1. Follow story template in `docs/stories/`
2. Define clear acceptance criteria
3. Estimate complexity
4. Consider integration points
5. Plan QA approach

## 📈 Performance Optimization

### Monitoring
- Bundle analyzer for size optimization
- Lighthouse CI for performance metrics
- Real User Monitoring (RUM) data
- Database query optimization

### Best Practices
- Code splitting and lazy loading
- Image optimization
- Caching strategies
- Database indexing

## 🤝 Code Review Guidelines

### For Authors
- Self-review before requesting review
- Provide context in PR description
- Respond to feedback constructively
- Test changes thoroughly

### For Reviewers
- Focus on story acceptance criteria
- Check test coverage and quality
- Verify documentation updates
- Consider performance impact
- Validate accessibility

## 🔧 Troubleshooting

### Common Issues

#### Development Setup
```bash
# Clear all caches
npm run clean
rm -rf node_modules
npm install

# Reset git state
git fetch origin
git reset --hard origin/main
```

#### Testing Issues
```bash
# Run specific test file
npm run test -- story-name.test.tsx

# Debug test failures
npm run test:debug
```

#### Build Problems
```bash
# Type checking
npm run type-check

# Lint fixes
npm run lint:fix

# Format code
npm run format
```

## 📞 Getting Help

- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bugs and feature requests
- **Development Chat**: [Link to team communication]
- **Documentation**: Check `docs/` directory first

## 🏆 Recognition

Contributors who follow our development standards and deliver high-quality stories will be:
- Recognized in release notes
- Added to contributors list
- Invited to technical discussions
- Considered for maintainer roles

## 📄 License

By contributing to JournalsMan, you agree that your contributions will be licensed under the MIT License.

---

**Questions?** Open an issue or discussion - we're here to help! 🎓