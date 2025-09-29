# 8Ball RFID Development Workflow Guide

> **Purpose:** Step-by-step instructions for safe feature development that prevents merge disasters and maintains production stability.

## 🚀 Quick Start for New Features

### 1. Pre-Development Setup
```bash
# Ensure you're on main and up-to-date
git checkout main
git pull origin main

# Verify clean working directory
git status  # Should show "working tree clean"

# Verify build passes
npm run build  # Must complete without errors
```

### 2. Create Feature Branch
```bash
# Create feature branch with descriptive name
git checkout -b feature/[issue-number]-[short-description]

# Examples:
git checkout -b feature/101-tier-selection-ui
git checkout -b feature/102-admin-organization-mgmt
git checkout -b feature/103-variance-alerts-system

# Push branch to remote for backup
git push -u origin feature/101-tier-selection-ui
```

## 📋 Development Process

### Phase 1: Planning & Scaffolding
```bash
# Create initial commit with scaffold
git add .
git commit -m "feat: Add initial scaffold for [feature-name]

- Create component structure
- Add basic types and interfaces
- Set up routing (if needed)
- Add placeholder UI components"

# Push early and often
git push origin feature/101-tier-selection-ui
```

### Phase 2: Core Implementation
```bash
# Implement feature in small, atomic commits
git add src/components/NewFeature.tsx
git commit -m "feat: Implement core NewFeature component logic"

git add src/lib/api/newfeature.ts
git commit -m "feat: Add API service for NewFeature operations"

git add src/types/newfeature.ts
git commit -m "feat: Add TypeScript types for NewFeature"

# Test each commit builds successfully
npm run build  # After each significant change
```

### Phase 3: Integration & Testing
```bash
# Integrate with existing components
git add src/pages/SomePage.tsx
git commit -m "feat: Integrate NewFeature into SomePage"

# Add comprehensive error handling
git add src/components/NewFeature.tsx
git commit -m "feat: Add error handling and loading states to NewFeature"

# Update documentation
git add docs/features/new-feature.md
git commit -m "docs: Add NewFeature documentation and usage examples"
```

### Phase 4: Final Polish
```bash
# Mobile responsiveness
git commit -m "feat: Add mobile responsiveness to NewFeature"

# Accessibility improvements
git commit -m "feat: Add accessibility attributes to NewFeature"

# Performance optimizations
git commit -m "perf: Optimize NewFeature queries and rendering"
```

## ✅ Pre-Merge Checklist

### Technical Requirements
```bash
# 1. TypeScript compilation passes
npm run build
# ✅ Should complete with "Build completed successfully"

# 2. Linting passes
npm run lint
# ✅ Should show no errors or warnings

# 3. Feature is fully functional
# ✅ Test all user flows manually
# ✅ Test on mobile/tablet devices
# ✅ Test with real RFID hardware (if applicable)
# ✅ Test multi-tenant data isolation

# 4. No regressions in existing features
# ✅ Test core RFID scanning still works
# ✅ Test dashboard and reports still function
# ✅ Test authentication flows still work
```

### Code Quality Check
```bash
# Check for console.log statements (remove or make conditional)
grep -r "console.log" src/components/NewFeature.tsx

# Check for any TODO comments
grep -r "TODO\|FIXME" src/components/NewFeature.tsx

# Verify no hardcoded values (use environment variables)
grep -r "localhost\|127.0.0.1" src/

# Check for proper error handling
# ✅ All async operations have try/catch
# ✅ User-friendly error messages displayed
# ✅ Loading states implemented
```

## 🔄 Keeping Feature Branch Updated

### Regular Sync with Main
```bash
# Do this at least daily for long-running features
git checkout main
git pull origin main
git checkout feature/101-tier-selection-ui

# Use rebase to keep history clean
git rebase main

# Resolve any conflicts carefully
# Test after rebase to ensure nothing broke
npm run build

# Force push after rebase (only to feature branch!)
git push origin feature/101-tier-selection-ui --force-with-lease
```

### Handling Merge Conflicts
```bash
# During rebase, if conflicts occur:
# 1. Open conflicted files in your editor
# 2. Look for conflict markers (<<<<<<<, =======, >>>>>>>)
# 3. Resolve conflicts by choosing correct code
# 4. Remove conflict markers
# 5. Test the resolution

# Mark conflicts as resolved
git add src/components/ConflictedFile.tsx
git rebase --continue

# If rebase gets too complex, abort and ask for help
git rebase --abort  # Start over if needed
```

## 📬 Pull Request Process

### 1. Create Pull Request
```bash
# Push final changes
git push origin feature/101-tier-selection-ui

# Go to GitHub and create PR with:
# - Title: "feat: Add tier selection UI for bottle creation"
# - Description: Detailed explanation of changes
# - Target branch: main
# - Assignees: Yourself
# - Labels: enhancement, frontend
```

### 2. PR Description Template
```markdown
## 🎯 Feature Description
Brief description of what this feature does and why it's needed.

## 🧪 Testing Performed
- [ ] TypeScript compilation passes
- [ ] Manual testing on desktop
- [ ] Manual testing on mobile/tablet
- [ ] Testing with real RFID hardware
- [ ] No regressions in existing features

## 📸 Screenshots
[Add screenshots of new UI components]

## 🔄 Breaking Changes
None / [List any breaking changes]

## 📋 Checklist
- [ ] Code follows project conventions
- [ ] Documentation updated
- [ ] Mobile responsive
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] TypeScript types properly defined
```

### 3. Code Review Process
- **Review required:** At least one approved review
- **Self-review:** Review your own PR before requesting review
- **Address feedback:** Make requested changes promptly
- **Re-request review:** After making changes

## 🚨 Emergency Hotfix Process

### For Critical Production Issues
```bash
# Create hotfix directly from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-auth-issue

# Make minimal fix only
git add src/lib/auth.ts
git commit -m "hotfix: Fix critical authentication issue

- Resolve null pointer exception in auth flow
- Add proper error handling for edge case
- Tested on production replica"

# Create PR immediately with expedited review
git push origin hotfix/critical-auth-issue

# Deploy as soon as PR is approved
```

## 🔧 Common Development Tasks

### Adding New UI Components
```bash
# 1. Create component file
touch src/components/NewComponent.tsx

# 2. Add to barrel export (if using)
echo "export { NewComponent } from './NewComponent'" >> src/components/index.ts

# 3. Add Storybook story (if using)
touch src/components/NewComponent.stories.tsx

# 4. Update component tests
touch src/components/__tests__/NewComponent.test.tsx
```

### Adding New API Endpoints
```bash
# 1. Add to appropriate service file
# src/lib/api/bottles.ts (for bottle-related)
# src/lib/api/dashboard.ts (for dashboard-related)
# etc.

# 2. Add TypeScript types
# src/types/inventory.ts (for inventory-related)
# src/types/dashboard.ts (for dashboard-related)

# 3. Test API integration
# Verify with Supabase dashboard
# Test error scenarios
```

### Adding Database Migrations
```bash
# 1. Create migration file
touch database/migrations/004-new-feature.sql

# 2. Test migration on local database
# Apply migration
# Verify schema changes
# Test rollback if needed

# 3. Document migration in PR
# Explain what the migration does
# Note any data implications
```

## 📊 Development Metrics & Goals

### Target Performance
- **Build time:** < 30 seconds
- **TypeScript check:** < 10 seconds
- **Bundle size:** < 1.5MB (current: ~1MB)
- **First paint:** < 2 seconds on mobile

### Code Quality Goals
- **TypeScript coverage:** 100% (no `any` types)
- **Component reusability:** Prefer composable components
- **Mobile responsiveness:** All features work on tablets/phones
- **Accessibility:** WCAG 2.1 AA compliance

## 🎯 Definition of Done

A feature is considered "done" when:

### Functional Requirements
- [ ] **All user stories completed** as specified
- [ ] **Error handling** covers all edge cases
- [ ] **Loading states** provide user feedback
- [ ] **Mobile responsiveness** verified on devices
- [ ] **Multi-tenant isolation** maintained

### Technical Requirements
- [ ] **TypeScript compilation** passes with zero errors
- [ ] **ESLint** passes with zero warnings
- [ ] **Production build** succeeds without issues
- [ ] **No console errors** in browser dev tools
- [ ] **Performance** meets project standards

### Quality Assurance
- [ ] **Code review** completed and approved
- [ ] **Manual testing** performed thoroughly
- [ ] **Existing functionality** not broken (regression test)
- [ ] **Documentation** updated appropriately
- [ ] **Clean commit history** with descriptive messages

---

## 🏷️ Quick Reference Commands

```bash
# Start new feature
git checkout main && git pull && git checkout -b feature/123-new-feature

# Daily sync
git checkout main && git pull && git checkout feature/123-new-feature && git rebase main

# Pre-merge check
npm run build && npm run lint

# Clean up after merge
git checkout main && git pull && git branch -d feature/123-new-feature

# Emergency rollback
git revert HEAD && git push origin main
```

Following this workflow will prevent the merge disasters we experienced with the backup branch and ensure all features are production-ready before merging.