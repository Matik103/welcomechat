
# Deployment Guide

This document outlines the process for deploying this application to production environments.

## Environment Setup

### 1. Local Testing with Production Settings

```bash
# Copy production environment template locally
cp .env.production .env.local

# Update with actual production values
nano .env.local

# Build and preview locally
npm run build
npm run preview
```

### 2. Production Environment Setup

Configure these environment variables in your hosting platform (Vercel, Netlify, etc.):

```
VITE_SUPABASE_URL=https://mgjodiqecnnltsgorife.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-supabase-anon-key
VITE_RAPIDAPI_KEY=your-rapidapi-key
NODE_ENV=production
```

### 3. Database Migration

```bash
# Run migrations on production Supabase instance
supabase db push --db-url=your-production-db-url
```

Or run individual migration scripts:

```bash
# Run from project root
node scripts/run_migration.js
```

## Deployment Process

### 1. Production Build

```bash
# Clean install dependencies
npm ci

# Build for production
npm run build
```

### 2. Deployment Checklist

- [ ] Verify all environment variables are set in production
- [ ] Test PDF file upload with small file (< 1MB)
- [ ] Test PDF file upload with medium file (~ 10MB)
- [ ] Test PDF file upload with large file (~ 50MB)
- [ ] Test PDF file upload with very large file (~ 200MB)
- [ ] Verify error handling works
- [ ] Check database logging is working
- [ ] Monitor RapidAPI quota usage

### 3. Post-Deployment Verification

Run these checks in your browser console on production:

```javascript
console.log(import.meta.env.VITE_SUPABASE_URL) // Should be production URL
console.log(import.meta.env.PROD) // Should be true
console.log(window.app.version) // Should match APP_VERSION
```

## Rollback Procedures

If issues occur:

```bash
# 1. Revert to last working commit
git revert HEAD

# 2. Redeploy
npm run build && npm run deploy

# 3. Revert database if needed
supabase db reset --db-url=your-production-db-url
```

## Monitoring Setup

- Set up error tracking (e.g., Sentry)
- Monitor RapidAPI usage through their dashboard
- Set up database performance monitoring in Supabase Dashboard
- Configure alerts for:
  - Failed PDF processing
  - High error rates
  - API quota limits

## Performance Optimization

- Enable caching for processed PDFs using STORAGE_CONFIG settings
- Configure CDN for large file uploads
- Set up proper CORS headers in Supabase Storage
- Enable compression in hosting platform

## Large PDF Processing

When processing large PDF files (over 50MB), keep these considerations in mind:

- API timeouts are set to 15 minutes in production for processing large files
- Maximum file size is set to 250MB
- Progress indicators may stay at the "Processing PDF text" stage for several minutes with large files
- The RapidAPI service may have its own limitations - monitor usage and rate limits
- Consider splitting very large PDFs into smaller chunks if processing consistently fails
- For production use with many large files, consider upgrading the RapidAPI plan

To test large PDF processing capabilities:

```bash
# Run the test script for large PDFs
./scripts/test-large-pdf.sh
```

This will generate and process a large test PDF to verify the system's capacity.

