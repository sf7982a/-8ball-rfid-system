# Vercel Deployment Guide - 8Ball RFID System

Complete step-by-step guide to deploy your optimized 8Ball RFID system to Vercel for production.

## Prerequisites

### 1. Accounts Required
- ✅ [Vercel Account](https://vercel.com) (free tier sufficient for testing)
- ✅ [GitHub Account](https://github.com) (for repository hosting)
- ✅ [Supabase Account](https://supabase.com) (production database)

### 2. Repository Setup
- ✅ Push your code to GitHub repository
- ✅ Ensure all optimization files are committed:
  - `vite.config.ts` (optimized)
  - `vercel.json` (caching configuration)
  - `.env.production` (template)

## Step 1: Supabase Production Setup

### Create Production Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and region (closest to users)
4. Name: "8ball-rfid-production"
5. Strong database password (save it!)

### Configure Database
1. Wait for project initialization (~2 minutes)
2. Go to **Settings > Database**
3. Copy connection string (you'll need this)
4. Go to **Settings > API**
5. Copy:
   - Project URL
   - `anon` public key

### Import Schema
1. Go to **SQL Editor**
2. Run your production schema:
   ```sql
   -- Copy from your existing schema
   -- Include all tables, enums, indexes, and RLS policies
   ```

### Set Up Row Level Security (RLS)
Ensure your production database has proper security:
```sql
-- Enable RLS on all tables
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Continue for all tables...

-- Add your existing RLS policies
```

## Step 2: Vercel Project Setup

### Option A: GitHub Integration (Recommended)

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import from GitHub
   - Select your `8ball-rfid` repository

2. **Configure Build Settings**
   - Framework Preset: "Vite"
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`

3. **Set Environment Variables**
   Click "Environment Variables" and add:

   ```bash
   NODE_ENV=production
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project-id.supabase.co:5432/postgres?sslmode=require
   VITE_APP_URL=https://your-app-name.vercel.app
   VITE_ENABLE_REAL_RFID=false
   VITE_ENABLE_ADVANCED_ANALYTICS=true
   VITE_DEBUG_MODE=false
   VITE_SHOW_DEBUG_AUTH=false
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build completion (~2-5 minutes)

### Option B: CLI Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Root**
   ```bash
   # First deployment
   vercel --prod

   # Follow prompts:
   # Set up and deploy? Yes
   # Which scope? Your username/team
   # Link to existing project? No
   # Project name: 8ball-rfid
   # Directory: ./
   # Want to override settings? Yes
   # Build Command: npm run build
   # Output Directory: dist
   # Development Command: npm run dev
   ```

## Step 3: Environment Variables Setup

### Production Variables (Required)
```bash
# Core Application
NODE_ENV=production
VITE_APP_URL=https://your-domain.vercel.app

# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres?sslmode=require

# Security
VITE_DEBUG_MODE=false
VITE_SHOW_DEBUG_AUTH=false
VITE_VERBOSE_LOGGING=false
```

### Optional Variables
```bash
# Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Features
VITE_ENABLE_ADVANCED_ANALYTICS=true
VITE_ENABLE_POS_INTEGRATIONS=false
VITE_ENABLE_NOTIFICATIONS=true

# Performance
VITE_ENABLE_SW=true
VITE_ENABLE_COMPRESSION=true
```

### Add via Vercel Dashboard
1. Go to your project settings
2. Click "Environment Variables"
3. Add each variable for "Production" environment
4. Click "Save"

### Add via CLI
```bash
# Set production environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add DATABASE_URL production
# Continue for all variables...
```

## Step 4: Custom Domain (Optional)

### Add Custom Domain
1. **Purchase Domain** (GoDaddy, Namecheap, etc.)
2. **In Vercel Dashboard:**
   - Go to Project Settings > Domains
   - Add your domain: `yourdomain.com`
   - Add www subdomain: `www.yourdomain.com`

3. **Configure DNS:**
   ```bash
   # Add these DNS records at your domain provider:
   Type: A     | Name: @   | Value: 76.76.19.61
   Type: CNAME | Name: www | Value: cname.vercel-dns.com
   ```

4. **SSL Certificate:**
   - Vercel automatically provisions SSL
   - Takes 5-10 minutes to activate

## Step 5: Production Authentication

### Update Supabase Auth Settings
1. **In Supabase Dashboard > Authentication > Settings:**

2. **Site URL:**
   ```
   https://your-domain.vercel.app
   ```

3. **Additional Redirect URLs:**
   ```
   https://your-domain.vercel.app/auth/callback
   https://your-domain.vercel.app/login
   https://your-domain.vercel.app/dashboard
   ```

4. **Auth Providers:**
   - Enable Email/Password
   - Configure any OAuth providers (Google, GitHub, etc.)

### Update Auth Context
Update your `AuthContext.tsx` for production:
```typescript
// Remove development-only auth refresh
useEffect(() => {
  // Only auto-refresh in development
  if (import.meta.env.DEV) {
    // ... existing refresh logic
  }
}, [])
```

## Step 6: Performance Verification

### Speed Test
After deployment, verify performance:

1. **Core Web Vitals:**
   ```bash
   # Install Lighthouse CLI
   npm install -g lighthouse

   # Test your production site
   lighthouse https://your-domain.vercel.app --view
   ```

2. **Target Metrics:**
   - **LCP (Largest Contentful Paint):** <2.5s
   - **FID (First Input Delay):** <100ms
   - **CLS (Cumulative Layout Shift):** <0.1
   - **TTFB (Time to First Byte):** <800ms

3. **Bundle Analysis:**
   ```bash
   # Test gzip sizes
   curl -H "Accept-Encoding: gzip" -I https://your-domain.vercel.app

   # Check chunk loading
   curl -H "Accept-Encoding: gzip" -I https://your-domain.vercel.app/js/vendor-*.js
   ```

### Database Performance
Verify your 0.085ms database performance is maintained:
```typescript
// Add timing to your API calls
const start = performance.now()
const result = await supabase.from('bottles').select('*').limit(100)
const duration = performance.now() - start
console.log(`Query took ${duration.toFixed(3)}ms`)
```

## Step 7: Monitoring & Maintenance

### Vercel Analytics
1. **Enable Analytics:**
   - Go to Project Settings > Analytics
   - Enable Web Analytics (free tier)
   - Monitor Core Web Vitals

2. **Set Up Alerts:**
   - Go to Project Settings > Functions
   - Set up error notifications

### Database Monitoring
1. **Supabase Monitoring:**
   - Check Database > Logs regularly
   - Monitor API usage in Settings > Usage
   - Set up log alerts for errors

### Automated Deployments
1. **Production Branch Protection:**
   ```bash
   # Only deploy from main branch
   git checkout main
   git push origin main  # Auto-deploys to production
   ```

2. **Preview Deployments:**
   ```bash
   # Feature branches create preview URLs
   git checkout feature/new-feature
   git push origin feature/new-feature  # Creates preview URL
   ```

## Step 8: Rollback Strategy

### Quick Rollback
```bash
# Via CLI - rollback to previous deployment
vercel --prod rollback

# Via dashboard - go to deployments and promote previous version
```

### Staging Environment
```bash
# Create staging branch deployment
vercel --target staging
```

## Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Check build logs in Vercel dashboard
# Common fixes:
npm ci --legacy-peer-deps
npm run build  # Test locally first
```

**Environment Variables:**
```bash
# Verify variables are set
vercel env ls

# Pull production env for testing
vercel env pull .env.production.local
```

**Authentication Issues:**
1. Check Supabase redirect URLs
2. Verify CORS settings
3. Check environment variables

**Performance Issues:**
1. Check bundle size in build logs
2. Verify CDN caching headers
3. Test database query performance

## Success Metrics

### Deployment Complete When:
- ✅ Site loads at your production URL
- ✅ Authentication works correctly
- ✅ Database queries complete in <100ms total (including network)
- ✅ Bundle size <500KB initial load
- ✅ Lighthouse score >90
- ✅ RFID scanning interface responsive
- ✅ All routes protected and working

### Production Ready Checklist:
- [ ] All environment variables configured
- [ ] Database RLS policies active
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Monitoring enabled
- [ ] Backup strategy implemented
- [ ] Team access configured

Your 8Ball RFID system is now production-ready with performance matching your 0.085ms database optimization!