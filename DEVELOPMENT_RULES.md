# Development Rules and Guidelines

## Overview

This document establishes development rules and guidelines for the JournalsMan project, including proper usage of MCP tools, development workflows, and quality assurance processes.

## MCP Tool Usage Guidelines

### 1. MCP Context7 - Documentation and Library References

**When to Use:**
- Working with new libraries or frameworks
- Need latest documentation for existing dependencies  
- API changes or version updates
- Best practices and implementation patterns

**Usage Rules:**
```bash
# Always resolve library ID first before getting documentation
1. Use resolve-library-id to get correct Context7-compatible library ID
2. Use get-library-docs with the resolved library ID
3. Specify topic when focusing on specific functionality
```

**Examples:**
```javascript
// ✅ CORRECT: Resolve library ID first
const libraryId = await resolveLibraryId("next.js");
const docs = await getLibraryDocs(libraryId, { topic: "routing" });

// ❌ INCORRECT: Using assumed library ID
const docs = await getLibraryDocs("/vercel/nextjs"); // May be wrong format
```

**Best Practices:**
- Always check for latest documentation before implementing new features
- Use Context7 for API reference during implementation
- Consult Context7 when debugging library-specific issues
- Reference official documentation patterns in code comments

### 2. MCP shadcn/ui - UI Component Development

**When to Use:**
- Creating new UI components
- Styling and theming decisions
- Component architecture planning
- Accessibility compliance

**Usage Rules:**
```bash
# Component development workflow
1. Use list_components to see available shadcn components
2. Use get_component to get source code for similar components
3. Use get_component_demo to understand usage patterns
4. Use get_component_metadata for dependency information
```

**Examples:**
```javascript
// ✅ CORRECT: Check available components first
const components = await listComponents();
const buttonComponent = await getComponent("button");
const buttonDemo = await getComponentDemo("button");

// ❌ INCORRECT: Assuming component exists
const customButton = await getComponent("custom-complex-button"); // May not exist
```

**Best Practices:**
- Always use shadcn/ui MCP before creating custom components
- Follow shadcn patterns for consistency
- Use component demos as implementation reference
- Maintain accessibility standards from shadcn components

### 3. MCP Sequential Thinking - Complex Problem Solving

**When to Use:**
- Multi-step feature planning
- Complex architectural decisions
- Debugging intricate issues
- Performance optimization strategies
- Integration between multiple systems

**Usage Rules:**
```bash
# Problem-solving workflow
1. Use sequential thinking for problems requiring 3+ steps
2. Break down complex tasks into manageable thoughts
3. Revise previous thoughts when new information emerges
4. Generate and verify hypotheses systematically
```

**Examples:**
```javascript
// ✅ CORRECT: Use for complex planning
sequentialThinking({
  thought: "Planning authentication system integration with multiple providers",
  thoughtNumber: 1,
  totalThoughts: 8,
  nextThoughtNeeded: true
});

// ❌ INCORRECT: Use for simple tasks
sequentialThinking({
  thought: "Adding a single CSS class",
  // Overkill for simple tasks
});
```

**Best Practices:**
- Use when problem scope is unclear initially
- Allow for thought revision and branching
- Generate hypotheses and verify systematically
- Document decision-making process for future reference

## Development Workflow

### Story Development Process

1. **Story Planning Phase**
   ```bash
   # Use sequential thinking for complex stories
   - Break down acceptance criteria
   - Identify technical dependencies
   - Plan implementation approach
   - Estimate complexity and timeline
   ```

2. **Research Phase**
   ```bash
   # Use MCP Context7 for documentation
   - Research required libraries/frameworks
   - Check latest API documentation
   - Review best practices and patterns
   - Identify potential issues or limitations
   ```

3. **Implementation Phase**
   ```bash
   # Use shadcn/ui MCP for UI components
   - Create components following shadcn patterns
   - Implement business logic
   - Add error handling and validation
   - Ensure accessibility compliance
   ```

4. **Quality Assurance Phase**
   ```bash
   # Mandatory QA process
   - Run all existing tests: npm test
   - Run linting: npm run lint
   - Run type checking: npm run type-check
   - Run integration tests for the story
   - Verify acceptance criteria completion
   ```

5. **Git Workflow Phase**
   ```bash
   # Version control process
   - Create feature branch: git checkout -b story-[number]-[description]
   - Commit implementation: git commit -m "feat: implement story [number] - [description]"
   - Run QA tests before push
   - Push to GitHub: git push origin story-[number]-[description]
   - Create pull request with story details
   ```

### Mandatory QA Testing Rules

**Before Each Commit:**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Linting passes without errors
- [ ] TypeScript compilation succeeds
- [ ] Manual testing of new functionality

**Before Each Push:**
- [ ] Full test suite passes
- [ ] Story acceptance criteria verified
- [ ] No console errors or warnings
- [ ] Performance benchmarks met
- [ ] Accessibility standards maintained

**Test Categories:**
1. **Unit Tests**: Individual component/function testing
2. **Integration Tests**: Feature workflow testing
3. **E2E Tests**: Complete user journey testing
4. **Performance Tests**: Load time and responsiveness
5. **Accessibility Tests**: WCAG 2.1 AA compliance

## Git Workflow Standards

### Branch Naming Convention
```
story-[number]-[short-description]
fix-[issue-number]-[short-description]
refactor-[component-name]
docs-[section-name]
```

### Commit Message Format
```
type(scope): description

feat(auth): implement ORCID OAuth provider
fix(dashboard): resolve analytics data loading issue
test(branding): add comprehensive branding system tests
docs(readme): update installation instructions
refactor(components): extract reusable form components
```

### Required Checks Before Push
1. **Code Quality**
   ```bash
   npm run lint          # ESLint checks
   npm run type-check    # TypeScript validation
   npm run format        # Prettier formatting
   ```

2. **Testing**
   ```bash
   npm test              # Unit tests
   npm run test:integration  # Integration tests
   npm run test:e2e      # End-to-end tests
   ```

3. **Build Verification**
   ```bash
   npm run build         # Production build
   npm run build:check   # Build verification
   ```

## Code Quality Standards

### TypeScript Requirements
- Strict mode enabled
- No `any` types without justification
- Proper interface definitions
- Generic types where appropriate

### Testing Requirements
- Minimum 80% code coverage
- Test all user-facing functionality
- Mock external dependencies
- Test error conditions

### Performance Standards
- Page load times < 2 seconds
- Interactive elements respond < 100ms
- Bundle size monitoring
- Core Web Vitals compliance

### Accessibility Standards
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast validation

## Story Completion Checklist

Before marking any story as complete:

- [ ] All acceptance criteria implemented
- [ ] QA tests written and passing
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Accessibility validated
- [ ] Code reviewed and approved
- [ ] Integration tests passing
- [ ] Pushed to GitHub with proper commits
- [ ] Story marked as complete in tracking system

## Emergency Procedures

### Failed QA Tests
1. Identify failing tests
2. Fix issues systematically
3. Re-run full test suite
4. Do not bypass QA requirements

### Git Issues
1. Never force push to main branch
2. Create recovery branch if needed
3. Consult team before major git operations
4. Maintain clean commit history

### MCP Tool Issues
1. Verify MCP server connections
2. Check tool availability and versions
3. Fall back to manual processes if needed
4. Document issues for future reference

## Continuous Improvement

This document should be updated as:
- New MCP tools become available
- Development patterns emerge
- Team feedback is received
- Project requirements evolve

---

**Last Updated**: 2025-01-30
**Version**: 1.0
**Maintained By**: Development Team