# 8Ball RFID Branching Strategy & Git Workflow

> **Objective:** Prevent merge disasters and maintain production stability through disciplined branching practices.

## 🌳 Branch Structure

### Main Branches

#### `main` (Production)
- **Purpose:** Production-ready code only
- **Protection:** ✅ Protected branch
- **Deployment:** Auto-deploys to Vercel production
- **Requirements:**
  - ✅ TypeScript compilation passes
  - ✅ All tests pass
  - ✅ Code review approved
  - ✅ Feature fully complete and tested

#### `develop` (Integration) - *To Be Created*
- **Purpose:** Integration branch for feature testing
- **Protection:** ✅ Protected branch
- **Deployment:** Auto-deploys to staging environment
- **Requirements:**
  - ✅ TypeScript compilation passes
  - ✅ Basic functionality verified

### Feature Branches

#### Naming Convention
```bash
feature/[issue-number]-[short-description]
feature/123-admin-panel
feature/456-variance-detection
feature/789-pos-integration

# Bugfix branches
bugfix/[issue-number]-[short-description]
bugfix/234-tier-constraint-fix

# Hotfix branches (emergency production fixes)
hotfix/[issue-number]-[short-description]
hotfix/567-critical-auth-fix
```

## 🔄 Git Workflow

### 1. Feature Development Workflow

```bash
# Start new feature
git checkout main
git pull origin main
git checkout -b feature/123-new-feature

# Work on feature with atomic commits
git add .
git commit -m "feat: Add initial feature scaffold"
git commit -m "feat: Implement core functionality"
git commit -m "test: Add unit tests for feature"
git commit -m "docs: Update feature documentation"

# Keep feature branch updated
git checkout main
git pull origin main
git checkout feature/123-new-feature
git rebase main  # Rebase instead of merge to keep history clean

# Push feature branch
git push origin feature/123-new-feature

# Create Pull Request through GitHub
# - Target: main
# - Reviewers: Required
# - Checks: All must pass
```

### 2. Pull Request Requirements

#### Mandatory Checks
- [ ] **TypeScript compilation passes** (`npm run build`)
- [ ] **Linting passes** (`npm run lint`)
- [ ] **All existing functionality preserved**
- [ ] **New feature is fully complete** (no partial implementations)
- [ ] **Database migrations included** (if applicable)
- [ ] **Documentation updated** (if applicable)

#### Review Checklist
- [ ] **Code quality** meets project standards
- [ ] **Security considerations** addressed
- [ ] **Performance impact** evaluated
- [ ] **Mobile compatibility** verified
- [ ] **Multi-tenant data isolation** maintained

### 3. Commit Message Standards

```bash
# Format: type(scope): description

# Types:
feat: new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons, etc
refactor: code changes that neither fix a bug nor add a feature
test: add missing tests
chore: changes to build process or auxiliary tools

# Examples:
feat(inventory): add tier-based bottle classification
fix(auth): resolve RFID scanner permissions on mobile
docs(api): update bottle creation endpoint documentation
refactor(dashboard): optimize query performance for large datasets
```

## 🚫 What NOT to Do (Lessons Learned)

### ❌ Anti-Patterns to Avoid
1. **Never merge incomplete features** to main
2. **Never work directly on main branch**
3. **Never create long-lived feature branches** (>2 weeks)
4. **Never merge with TypeScript errors**
5. **Never skip the review process**
6. **Never force push to main** (`--force` is prohibited)
7. **Never merge without testing in staging environment**

### ❌ Backup Branch Disasters
The `backup-all-progress-20250927` branch disaster taught us:
- **Partial merges cause technical debt**
- **Incomplete admin features broke production builds**
- **Mixed experimental and stable code creates conflicts**
- **Large feature branches become unmaintainable**

## ✅ Best Practices

### 🎯 Feature Branch Guidelines
1. **Keep branches small and focused** (1 feature = 1 branch)
2. **Complete features before merging** (no partial implementations)
3. **Rebase regularly** to stay updated with main
4. **Delete branches after merging** to keep repository clean
5. **Use descriptive branch names** with issue numbers

### 🔒 Code Quality Gates
```bash
# Pre-commit checks (to be automated)
npm run lint          # ESLint passes
npm run type-check    # TypeScript compilation
npm run test          # Unit tests pass
npm run build         # Production build succeeds
```

### 📋 Definition of Done
A feature is only "done" when:
- [ ] **Functionality is 100% complete**
- [ ] **TypeScript compilation has zero errors**
- [ ] **All existing functionality still works**
- [ ] **Mobile responsiveness verified**
- [ ] **Multi-tenant data isolation tested**
- [ ] **Documentation updated**
- [ ] **Code reviewed and approved**

## 🏗️ Branch Protection Rules

### Main Branch Protection
```bash
# Settings to configure in GitHub:
- Require pull request reviews before merging
- Dismiss stale PR approvals when new commits are pushed
- Require status checks to pass before merging
  ✅ build (TypeScript compilation)
  ✅ lint (ESLint)
  ✅ test (if tests exist)
- Require branches to be up to date before merging
- Restrict pushes that create files larger than 100MB
- Restrict force pushes
- Restrict deletions
```

## 🚀 Release Process

### 1. Release Planning
```bash
# Create release branch from main
git checkout main
git pull origin main
git checkout -b release/v2.1.0

# Final testing and bug fixes only
# No new features in release branches
```

### 2. Release Deployment
```bash
# Tag the release
git tag -a v2.1.0 -m "Release v2.1.0: Enhanced RFID scanning"
git push origin v2.1.0

# Deploy to production (automatic via Vercel)
# Monitor deployment and rollback if needed
```

### 3. Hotfix Process
```bash
# Emergency fixes go directly from main
git checkout main
git checkout -b hotfix/critical-fix
# Make minimal fix
# Test thoroughly
# Create PR to main with expedited review
```

## 📊 Branch Lifecycle Management

### Active Branch Cleanup
```bash
# List all branches
git branch -a

# Delete local branches that are merged
git branch --merged main | grep -v "main" | xargs -n 1 git branch -d

# Delete remote tracking branches that no longer exist
git remote prune origin

# Check for stale branches (older than 30 days)
git for-each-ref --format='%(refname:short) %(committerdate)' refs/heads | \
  awk '$2 < "'$(date -d '30 days ago' -I)'"'
```

## 📝 Emergency Procedures

### Rollback Production
```bash
# If main branch is broken, immediately revert
git checkout main
git revert HEAD~1  # Revert last commit
git push origin main

# Or rollback to specific good commit
git reset --hard <good-commit-hash>
git push origin main --force-with-lease  # Only in emergencies!
```

### Recover Archived Features
```bash
# If you need something from the archived backup:
git checkout archive/backup-all-progress-20250927
git checkout -b feature/recover-specific-component
# Cherry-pick only what you need
git cherry-pick <specific-commit>
# Test thoroughly before merging
```

---

## 🏷️ Quick Reference

### Common Commands
```bash
# Start new feature
git checkout main && git pull && git checkout -b feature/123-new-thing

# Update feature branch
git checkout main && git pull && git checkout feature/123-new-thing && git rebase main

# Clean up after merge
git checkout main && git pull && git branch -d feature/123-new-thing

# Check branch status
git status && git log --oneline -5
```

### Branch Health Check
```bash
# Verify clean build
npm run build

# Check for uncommitted changes
git status

# Verify branch is up to date
git fetch && git status
```

This strategy ensures we never repeat the backup branch disaster and maintain a stable, production-ready main branch at all times.