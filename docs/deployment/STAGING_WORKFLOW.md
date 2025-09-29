# Staging → Production Deployment Workflow

> **Purpose:** Prevent production deployment failures by testing all changes in staging environment first.

## 🎯 Three-Environment Strategy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │───▶│     Staging     │───▶│   Production    │
│                 │    │                 │    │                 │
│ Feature Branches│    │ develop branch  │    │ main branch     │
│ localhost:5173  │    │ staging.app.com │    │ app.com         │
│ Local Database  │    │ Staging DB      │    │ Production DB   │
│ RFID Simulation │    │ Safe Testing    │    │ Live System     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 Complete Development Workflow

### 1. Feature Development (Development → Staging)

```bash
# Start new feature from develop branch (not main!)
git checkout develop
git pull origin develop
git checkout -b feature/123-tier-selection-ui

# Develop your feature with commits
git add .
git commit -m "feat: Add tier selection dropdown to bottle form"
git commit -m "feat: Add tier validation and error handling"
git commit -m "test: Add tier selection component tests"

# Keep feature branch updated with develop
git checkout develop
git pull origin develop
git checkout feature/123-tier-selection-ui
git rebase develop

# Push feature branch
git push origin feature/123-tier-selection-ui

# Create Pull Request: feature/123-tier-selection-ui → develop
# ✅ This will deploy to STAGING for testing
```

### 2. Staging Testing & Validation

```bash
# After PR is merged to develop, automatic staging deployment occurs
# Staging URL: https://your-project-git-develop.vercel.app

# MANDATORY Staging Testing Checklist:
# [ ] Feature works as expected
# [ ] No existing functionality broken
# [ ] RFID simulation works correctly
# [ ] Database operations successful
# [ ] Mobile responsiveness verified
# [ ] No console errors
# [ ] Performance acceptable
# [ ] Authentication flows intact
# [ ] Real-time features working
```

### 3. Production Promotion (Staging → Production)

```bash
# ONLY after staging testing passes completely
git checkout main
git pull origin main
git merge develop  # Merge tested develop branch into main
git push origin main

# This triggers production deployment
# Production URL: https://your-project.vercel.app
```

## 🚨 Staging Testing Requirements

### Before Promoting to Production

**Functional Testing (Required):**
- [ ] **New features work completely** - no partial functionality
- [ ] **Existing features unaffected** - comprehensive regression test
- [ ] **RFID scanning operational** - both simulation and real hardware
- [ ] **Database CRUD operations** - create, read, update, delete bottles/locations
- [ ] **Authentication flows** - login, logout, role-based access
- [ ] **Real-time updates** - dashboard data updates live
- [ ] **Reports generation** - charts, exports, analytics work
- [ ] **Mobile interface** - touch-friendly, responsive design

**Technical Testing (Required):**
- [ ] **Zero console errors** - check browser developer tools
- [ ] **TypeScript compilation clean** - run `npm run build` locally
- [ ] **Performance acceptable** - page load < 3 seconds
- [ ] **API responses** - all endpoints responding correctly
- [ ] **Environment isolation** - staging data separate from production
- [ ] **Error handling** - graceful error messages, no crashes

**User Acceptance Testing (Required):**
- [ ] **Complete user flows** - end-to-end scenarios work
- [ ] **Data validation** - forms prevent invalid input
- [ ] **Loading states** - users see feedback during operations
- [ ] **Navigation** - all menu items and links functional
- [ ] **Export/Import** - data operations complete successfully

## 📋 Emergency Procedures

### Hotfix Process (Production Issues)

```bash
# For critical production bugs that can't wait for staging cycle
git checkout main
git checkout -b hotfix/critical-auth-fix

# Make minimal fix only - no new features!
git add src/components/auth/
git commit -m "hotfix: Fix authentication redirect loop

- Resolve infinite redirect in protected routes
- Add proper error handling for expired tokens
- Tested on local environment"

# Test hotfix in staging first (even for emergencies)
git checkout develop
git merge hotfix/critical-auth-fix
git push origin develop

# Wait for staging deployment, test quickly
# https://your-project-git-develop.vercel.app

# If staging test passes, deploy to production
git checkout main
git merge hotfix/critical-auth-fix
git push origin main

# Clean up hotfix branch
git branch -d hotfix/critical-auth-fix
git push origin --delete hotfix/critical-auth-fix
```

### Staging Rollback (If Staging Breaks)

```bash
# Quick rollback to previous working state
git checkout develop
git log --oneline -5  # Find last working commit

# Reset to previous working commit
git reset --hard <previous-good-commit>
git push origin develop --force-with-lease

# Vercel will auto-deploy the rollback
# Investigate issue in separate branch
```

### Production Rollback (If Production Breaks)

```bash
# Emergency production rollback
git checkout main
git log --oneline -5  # Find last working commit

# Method 1: Revert specific commit (preferred)
git revert HEAD  # Revert the problematic commit
git push origin main

# Method 2: Reset to previous commit (emergency only)
git reset --hard <previous-good-commit>
git push origin main --force-with-lease

# Immediately investigate issue
# Fix in develop branch and re-test in staging
```

## 🔒 Branch Protection & Safety Rules

### Mandatory Pre-Merge Checks

**For develop branch (staging):**
- [ ] Pull request review required
- [ ] TypeScript compilation passes
- [ ] No console errors in development
- [ ] Feature is complete (no partial implementations)

**For main branch (production):**
- [ ] Changes tested in staging environment
- [ ] All staging tests passed
- [ ] Pull request review completed
- [ ] Production deployment window approved

### Git Safety Commands

```bash
# Safe merge with verification
git checkout main
git pull origin main
git log develop --not main --oneline  # See what will be merged
git merge develop --no-ff  # Create merge commit for traceability
git push origin main

# Verify deployment before considering it complete
# Check production URL and basic functionality
```

## 🎯 Quality Gates

### Staging Quality Gate

**Automated Checks:**
- ✅ Build succeeds (Vercel automatic)
- ✅ No TypeScript errors (Vercel automatic)
- ✅ Bundle size acceptable (< 1.5MB)

**Manual Checks (Required):**
- ✅ Feature functionality verified
- ✅ Regression testing completed
- ✅ Performance acceptable
- ✅ Mobile testing completed
- ✅ Error scenarios tested

### Production Quality Gate

**Pre-Deployment:**
- ✅ All staging tests passed
- ✅ Stakeholder approval (if required)
- ✅ Deployment window confirmed
- ✅ Rollback plan ready

**Post-Deployment:**
- ✅ Production URL responding
- ✅ Basic functionality verified
- ✅ No error alerts triggered
- ✅ Performance metrics normal

## 📊 Monitoring & Alerts

### Staging Environment Monitoring

```bash
# Monitor staging deployments
# Set up Slack/Discord webhook for deployment notifications

# Basic health check
curl -I https://your-project-git-develop.vercel.app
# Should return 200 OK

# Check staging database connectivity
# Login to staging app and verify data loads
```

### Production Environment Monitoring

```bash
# Production health check
curl -I https://your-project.vercel.app
# Should return 200 OK

# Monitor error rates and performance
# Set up alerts for:
# - 5xx error rates > 1%
# - Response time > 3 seconds
# - Database connection failures
```

## 🚀 Feature Release Process

### Small Features (< 1 week development)

```bash
# Standard flow: Development → Staging → Production
feature/branch → develop → main
```

### Large Features (> 1 week development)

```bash
# Use feature flags or feature branches with regular rebasing
# Break large features into smaller, deployable chunks
# Each chunk follows standard flow independently
```

### Database Migrations

```bash
# Always test database changes in staging first
# 1. Apply migration to staging database
# 2. Verify application works with new schema
# 3. Test migration rollback procedure
# 4. Document migration in release notes
# 5. Apply to production during low-traffic window
```

## 📝 Staging Environment Management

### Weekly Staging Refresh

```bash
# Refresh staging data weekly to stay realistic
# 1. Export anonymized production data subset
# 2. Apply to staging database
# 3. Verify staging application works with fresh data
# 4. Document any issues discovered
```

### Staging Data Guidelines

- **Use realistic test data** that mirrors production scenarios
- **Don't use real customer data** - anonymize or use synthetic data
- **Keep test data documented** - what scenarios are covered
- **Refresh regularly** - don't let staging data get too stale

---

## 🏷️ Quick Reference

### Development Commands
```bash
# Start new feature
git checkout develop && git pull && git checkout -b feature/123-new-thing

# Deploy to staging
git checkout develop && git merge feature/123-new-thing && git push origin develop

# Deploy to production (after staging testing)
git checkout main && git merge develop && git push origin main

# Emergency hotfix
git checkout main && git checkout -b hotfix/fix && git merge develop && git push origin develop
```

### URLs to Bookmark
- **Staging:** `https://your-project-git-develop.vercel.app`
- **Production:** `https://your-project.vercel.app`
- **Vercel Dashboard:** `https://vercel.com/dashboard`
- **Staging Supabase:** `https://your-staging.supabase.co`
- **Production Supabase:** `https://your-production.supabase.co`

This workflow ensures that no untested code ever reaches production, preventing the deployment failures you experienced!