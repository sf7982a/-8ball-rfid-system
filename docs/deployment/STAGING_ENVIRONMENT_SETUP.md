# 8Ball RFID Staging Environment Setup Guide

> **Purpose:** Prevent production deployment failures by testing all changes in a staging environment that mirrors production.

## 🎯 Staging Environment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging     │    │   Production    │
│                 │    │                 │    │                 │
│ Local Database  │───▶│ Staging Database│───▶│ Prod Database   │
│ localhost:5173  │    │ staging.app.com │    │ app.com         │
│ Feature Branches│    │ develop branch  │    │ main branch     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Step 1: Create Staging Branch

```bash
# Create dedicated staging branch from main
git checkout main
git pull origin main
git checkout -b develop
git push -u origin develop

# This branch will be the staging deployment target
```

## ☁️ Step 2: Vercel Staging Environment Setup

### 2.1 Vercel Project Configuration

1. **In Vercel Dashboard:**
   - Go to your existing 8Ball RFID project
   - Navigate to **Settings** → **Git**
   - Add new **Production Branch**: Keep as `main`
   - Add **Preview Deployments**: Enable for `develop` branch

2. **Environment-specific Configuration:**

Create updated `vercel.json` with environment awareness:

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app/api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### 2.2 Custom Domains Setup

**In Vercel Dashboard → Domains:**

- **Production**: `your-app.com` (points to `main` branch)
- **Staging**: `staging.your-app.com` (points to `develop` branch)

```bash
# If you don't have custom domains, Vercel provides:
# Production: your-project-name.vercel.app
# Staging: your-project-name-git-develop.vercel.app
```

## 🗄️ Step 3: Separate Supabase Staging Database

### 3.1 Create Staging Project in Supabase

1. **In Supabase Dashboard:**
   - Create new project: `8ball-rfid-staging`
   - Choose same region as production
   - Use different database password

2. **Copy Production Schema to Staging:**

```bash
# Export production schema (from Supabase SQL Editor)
# Save as: database/staging/staging-schema.sql
```

### 3.2 Apply Schema to Staging Database

```sql
-- In Supabase SQL Editor for STAGING project:

-- 1. Create all tables (copy from production)
-- 2. Create all functions (copy from production)
-- 3. Set up RLS policies (copy from production)
-- 4. Insert test data (see test data section below)
```

### 3.3 Staging Test Data

Create realistic test data for staging:

```sql
-- Insert test organizations
INSERT INTO organizations (id, name, slug, settings) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Test Org Staging', 'test-org-staging', '{}'),
  ('22222222-2222-2222-2222-222222222222', 'Demo Bar Staging', 'demo-bar-staging', '{}');

-- Insert test tiers
INSERT INTO tiers (name, display_name, description, sort_order) VALUES
  ('rail', 'Rail', 'Basic tier liquor', 1),
  ('call', 'Call', 'Mid-tier, recognizable brands', 2),
  ('premium', 'Premium', 'Higher quality spirits', 3),
  ('super_premium', 'Super Premium', 'Top shelf selections', 4),
  ('ultra_premium', 'Ultra Premium', 'Luxury spirits', 5);

-- Insert test users
INSERT INTO profiles (id, email, role, organization_id, first_name, last_name) VALUES
  ('33333333-3333-3333-3333-333333333333', 'staging-admin@test.com', 'company_admin', '11111111-1111-1111-1111-111111111111', 'Staging', 'Admin'),
  ('44444444-4444-4444-4444-444444444444', 'staging-user@test.com', 'staff', '11111111-1111-1111-1111-111111111111', 'Staging', 'User');

-- Insert test locations
INSERT INTO locations (organization_id, name, code, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Staging Bar', 'BAR01', true),
  ('11111111-1111-1111-1111-111111111111', 'Staging Storage', 'STORE01', true);

-- Insert test bottles (get tier_id from tiers table)
INSERT INTO bottles (organization_id, tier_id, rfid_tag, brand, product, type, size, cost_price, retail_price, current_quantity, status)
SELECT
  '11111111-1111-1111-1111-111111111111',
  t.id,
  'TEST' || generate_series(1,20),
  'Test Brand ' || generate_series(1,20),
  'Test Product ' || generate_series(1,20),
  'vodka',
  '750ml',
  '25.00',
  '50.00',
  '1.00',
  'active'
FROM tiers t WHERE t.name = 'call';
```

## 🔐 Step 4: Environment Variables Configuration

### 4.1 Staging Environment Variables

**In Vercel Dashboard → Settings → Environment Variables:**

| Variable Name | Production Value | Staging Value | Preview |
|---------------|------------------|---------------|---------|
| `VITE_SUPABASE_URL` | `https://your-prod.supabase.co` | `https://your-staging.supabase.co` | ✅ |
| `VITE_SUPABASE_ANON_KEY` | `prod_anon_key` | `staging_anon_key` | ✅ |
| `VITE_APP_ENV` | `production` | `staging` | ✅ |
| `VITE_APP_NAME` | `8Ball RFID` | `8Ball RFID (Staging)` | ✅ |
| `NODE_ENV` | `production` | `production` | ✅ |

### 4.2 Environment-Specific Configuration

Update your app to show staging indicators:

```typescript
// src/lib/config.ts
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  app: {
    env: import.meta.env.VITE_APP_ENV || 'development',
    name: import.meta.env.VITE_APP_NAME || '8Ball RFID',
    isStaging: import.meta.env.VITE_APP_ENV === 'staging',
    isProduction: import.meta.env.VITE_APP_ENV === 'production',
  }
}

// src/components/layout/Header.tsx
import { config } from '../../lib/config'

export function Header() {
  return (
    <header className="border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-bold">
          {config.app.name}
          {config.app.isStaging && (
            <span className="ml-2 px-2 py-1 text-xs bg-yellow-500 text-black rounded">
              STAGING
            </span>
          )}
        </h1>
        {/* Rest of header */}
      </div>
    </header>
  )
}
```

### 4.3 Local Environment Setup

Create environment files for different environments:

```bash
# .env.local (for local development)
VITE_SUPABASE_URL=https://your-local.supabase.co
VITE_SUPABASE_ANON_KEY=your_local_anon_key
VITE_APP_ENV=development
VITE_APP_NAME=8Ball RFID (Local)

# .env.staging (for reference, not used by Vercel)
VITE_SUPABASE_URL=https://your-staging.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_anon_key
VITE_APP_ENV=staging
VITE_APP_NAME=8Ball RFID (Staging)

# .env.production (for reference, not used by Vercel)
VITE_SUPABASE_URL=https://your-prod.supabase.co
VITE_SUPABASE_ANON_KEY=your_prod_anon_key
VITE_APP_ENV=production
VITE_APP_NAME=8Ball RFID
```

Add to `.gitignore`:
```bash
# Environment files
.env.local
.env.staging
.env.production
```

## 🔄 Step 5: Updated Git Workflow for Staging

### 5.1 New Branch Strategy

```
main (production)
├── develop (staging)
    ├── feature/123-new-feature
    ├── feature/124-another-feature
    └── bugfix/125-staging-fix
```

### 5.2 Feature Development Workflow

```bash
# 1. Start feature from develop (not main)
git checkout develop
git pull origin develop
git checkout -b feature/123-new-feature

# 2. Develop feature
# ... make changes ...
git add .
git commit -m "feat: Add new feature"

# 3. Keep updated with develop
git checkout develop
git pull origin develop
git checkout feature/123-new-feature
git rebase develop

# 4. Create PR to develop (staging)
git push origin feature/123-new-feature
# Create PR: feature/123-new-feature → develop

# 5. After merge, test in staging
# Visit staging.your-app.com
# Verify feature works correctly

# 6. Promote to production
git checkout main
git pull origin main
git merge develop  # Only after staging testing passes
git push origin main
```

### 5.3 Staging Testing Checklist

Before promoting to production, verify in staging:

**Functional Testing:**
- [ ] All new features work as expected
- [ ] Existing features not broken (regression test)
- [ ] RFID scanning functionality intact
- [ ] Database operations successful
- [ ] Authentication flows working
- [ ] Mobile responsiveness maintained

**Technical Testing:**
- [ ] No console errors in browser
- [ ] TypeScript compilation clean
- [ ] Performance acceptable (< 3s load time)
- [ ] All API endpoints responding
- [ ] Real-time features working
- [ ] Data isolation between staging/production confirmed

**User Acceptance Testing:**
- [ ] User flows complete successfully
- [ ] Error handling appropriate
- [ ] Loading states informative
- [ ] Data export/import working
- [ ] Reports generating correctly

## 🚨 Step 6: Emergency Procedures

### 6.1 Rollback Staging

```bash
# If staging breaks, quickly rollback
git checkout develop
git reset --hard HEAD~1  # Rollback one commit
git push origin develop --force-with-lease

# Vercel will auto-deploy the rollback
```

### 6.2 Hotfix Process

```bash
# For urgent production fixes
git checkout main
git checkout -b hotfix/urgent-fix

# Make minimal fix
git add .
git commit -m "hotfix: Fix critical issue"

# Deploy to staging first (even for hotfixes)
git checkout develop
git merge hotfix/urgent-fix
git push origin develop

# Test in staging, then promote to production
git checkout main
git merge hotfix/urgent-fix
git push origin main

# Clean up
git branch -d hotfix/urgent-fix
```

### 6.3 Database Migration Testing

```bash
# Test database migrations in staging first
# 1. Apply migration to staging database
# 2. Verify application works with new schema
# 3. Test rollback procedure
# 4. Only then apply to production
```

## 📊 Step 7: Monitoring & Alerts

### 7.1 Vercel Deployment Monitoring

**Set up Vercel integrations:**
- **Slack/Discord**: Get notified of deployments
- **GitHub**: Link deployments to commits
- **Monitoring**: Track staging vs production performance

### 7.2 Database Monitoring

**Supabase Dashboard monitoring:**
- **Staging**: Monitor for test data integrity
- **Production**: Monitor for performance and errors
- **Alerts**: Set up alerts for database issues

### 7.3 Performance Comparison

Monitor both environments:
```bash
# Lighthouse audits
npx lighthouse https://staging.your-app.com --output=json > staging-lighthouse.json
npx lighthouse https://your-app.com --output=json > production-lighthouse.json

# Compare bundle sizes
npm run build  # Check build output
```

## 📋 Step 8: Staging Usage Guidelines

### 8.1 When to Use Staging

**Always test in staging first:**
- New features before production deploy
- Database schema changes
- Third-party integrations
- Performance optimizations
- Security updates
- Major refactoring

### 8.2 Staging Data Management

**Keep staging data realistic but separate:**
- Refresh staging data weekly from production (anonymized)
- Use realistic test scenarios
- Don't use real customer data
- Keep test data documented

### 8.3 Team Access

**Staging environment access:**
- Developers: Full access for testing
- QA: Testing and validation access
- Stakeholders: Review and acceptance testing
- Customers: No access (staging is internal only)

---

## 🏷️ Quick Reference Commands

```bash
# Deploy to staging
git checkout develop && git pull && git merge feature/branch && git push origin develop

# Test staging deployment
curl -I https://staging.your-app.com

# Promote staging to production
git checkout main && git pull && git merge develop && git push origin main

# Rollback staging
git checkout develop && git reset --hard HEAD~1 && git push origin develop --force-with-lease

# Check deployment status
vercel ls  # If you have Vercel CLI installed
```

This staging environment will catch deployment failures before they reach production, preventing the issues you experienced today!