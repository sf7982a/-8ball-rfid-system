# Vercel Environment Variables Configuration

> **Important:** Configure these environment variables in your Vercel Dashboard to enable staging and production environments.

## 🚀 Vercel Dashboard Configuration

### 1. Access Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your 8Ball RFID project
3. Navigate to **Settings** → **Environment Variables**

### 2. Production Environment Variables

Configure these for **Production** (main branch):

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://your-prod-project.supabase.co` | Production |
| `VITE_SUPABASE_ANON_KEY` | `your_production_anon_key` | Production |
| `VITE_APP_ENV` | `production` | Production |
| `VITE_APP_NAME` | `8Ball RFID` | Production |
| `VITE_APP_VERSION` | `2.0.0` | Production |
| `VITE_ENABLE_RFID_SIMULATION` | `false` | Production |

### 3. Staging Environment Variables

Configure these for **Preview** (develop branch):

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://your-staging-project.supabase.co` | Preview |
| `VITE_SUPABASE_ANON_KEY` | `your_staging_anon_key` | Preview |
| `VITE_APP_ENV` | `staging` | Preview |
| `VITE_APP_NAME` | `8Ball RFID (Staging)` | Preview |
| `VITE_APP_VERSION` | `2.0.0-staging` | Preview |
| `VITE_ENABLE_RFID_SIMULATION` | `true` | Preview |

### 4. Development Environment Variables

For local development, create `.env.local`:

```bash
# .env.local (local development only)
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_dev_anon_key
VITE_APP_ENV=development
VITE_APP_NAME=8Ball RFID (Local)
VITE_APP_VERSION=2.0.0-dev
VITE_ENABLE_RFID_SIMULATION=true
```

## 📋 Step-by-Step Vercel Setup

### Step 1: Create Staging Supabase Project

1. **In Supabase Dashboard:**
   - Create new project: `8ball-rfid-staging`
   - Choose same region as production
   - Use different database password

2. **Copy Production Schema:**
   ```sql
   -- In production Supabase SQL Editor, export schema:
   -- Go to SQL Editor → New Query → Run this:

   SELECT pg_get_tabledef('public', table_name)
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_type = 'BASE TABLE';

   -- Copy all CREATE TABLE statements
   -- Apply to staging database
   ```

3. **Set Up Test Data:**
   ```sql
   -- Add realistic test data to staging
   -- See STAGING_ENVIRONMENT_SETUP.md for test data scripts
   ```

### Step 2: Configure Vercel Environment Variables

#### Production Variables:
```bash
# In Vercel Dashboard → Settings → Environment Variables
# Add each variable with Environment = "Production"

VITE_SUPABASE_URL → https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY → eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_ENV → production
VITE_APP_NAME → 8Ball RFID
VITE_APP_VERSION → 2.0.0
```

#### Staging Variables:
```bash
# In Vercel Dashboard → Settings → Environment Variables
# Add each variable with Environment = "Preview"

VITE_SUPABASE_URL → https://ijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY → eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_ENV → staging
VITE_APP_NAME → 8Ball RFID (Staging)
VITE_APP_VERSION → 2.0.0-staging
VITE_ENABLE_RFID_SIMULATION → true
```

### Step 3: Branch Configuration

1. **In Vercel Dashboard → Settings → Git:**
   - **Production Branch:** `main`
   - **Preview Deployments:** Enable for `develop` branch

2. **Branch Protection (Optional):**
   - Set up branch protection rules in GitHub
   - Require PR reviews for both `main` and `develop`

### Step 4: Custom Domains (Optional)

1. **Production Domain:**
   - Add custom domain: `app.yourdomain.com`
   - Point to `main` branch

2. **Staging Domain:**
   - Add custom domain: `staging.yourdomain.com`
   - Point to `develop` branch

## 🔍 Verification Steps

### 1. Check Environment Loading
```javascript
// Add to src/main.tsx for debugging:
console.log('🌍 Environment Check:', {
  env: import.meta.env.VITE_APP_ENV,
  name: import.meta.env.VITE_APP_NAME,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.substring(0, 20) + '...',
  hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
})
```

### 2. Test Deployments
```bash
# Deploy to staging
git checkout develop
git push origin develop
# Check: https://your-project-git-develop.vercel.app

# Deploy to production
git checkout main
git merge develop
git push origin main
# Check: https://your-project.vercel.app
```

### 3. Verify Environment Indicators
- **Staging:** Should show yellow "STAGING" badge in header
- **Production:** Should show no environment badge
- **Local:** Should show green "DEV" badge in header

## 🚨 Troubleshooting

### Environment Variables Not Loading
```bash
# Check Vercel build logs:
# 1. Go to Vercel Dashboard → Deployments
# 2. Click on failed deployment
# 3. Check "Build Logs" for environment variable issues
```

### Supabase Connection Issues
```bash
# Verify in browser console:
console.log('Supabase Config:', {
  url: supabase.supabaseUrl,
  key: supabase.supabaseKey.substring(0, 20) + '...'
})
```

### Branch Deployment Issues
```bash
# Verify branch configuration:
# 1. Check Vercel Dashboard → Settings → Git
# 2. Ensure correct branches are configured
# 3. Check GitHub webhook delivery
```

## 📊 Environment Monitoring

### Deployment Status
- **Production:** Monitor uptime and performance
- **Staging:** Monitor for testing and validation
- **Preview:** Automatic PR previews for feature branches

### Database Monitoring
- **Production DB:** Critical monitoring and alerts
- **Staging DB:** Performance testing and validation
- **Local DB:** Development and testing

### Error Tracking
```javascript
// Environment-aware error reporting
if (config.app.isProduction) {
  // Send to production error tracking
} else if (config.app.isStaging) {
  // Send to staging error tracking
} else {
  // Log to console for development
}
```

---

## 🏷️ Quick Reference

### Vercel CLI Commands (Optional)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to staging
vercel --target preview

# Deploy to production
vercel --target production

# Check deployments
vercel ls
```

### Environment URLs
- **Production:** `https://your-project.vercel.app`
- **Staging:** `https://your-project-git-develop.vercel.app`
- **Local:** `http://localhost:5173`

This configuration ensures that staging and production environments are completely isolated with separate databases and configurations.