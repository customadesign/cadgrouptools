# Deployment Guide - CADGroup Internal Tools Portal

## Overview
This guide covers the deployment process for the CADGroup Internal Tools Portal using Render as the hosting platform and GitHub Actions for CI/CD.

## Current Deployment Status
- **Production URL**: https://cadgrouptools.onrender.com
- **Repository**: https://github.com/customadesign/cadgrouptools
- **Hosting**: Render.com
- **Database**: MongoDB Atlas
- **File Storage**: Supabase Storage
- **Email**: SendGrid

## CI/CD Pipeline

### GitHub Actions Workflow
The pipeline is triggered on:
- Push to `main` branch (production deploy)
- Push to `develop` branch (staging deploy)
- Pull requests to `main` (preview deploy)

### Pipeline Stages
1. **Lint & Type Check**: Ensures code quality
2. **Security Scan**: Vulnerability detection
3. **Tests**: Unit and integration tests
4. **Build**: Next.js production build
5. **Deploy**: Automatic deployment to Render
6. **Health Check**: Verifies deployment success

## Environment Variables

### Required for Production
```bash
# Authentication
NEXTAUTH_URL=https://cadgrouptools.onrender.com
NEXTAUTH_SECRET=<secure-random-string>

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net
DB_NAME=cadgroup_prod

# Storage (Supabase)
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SERVICE_ROLE=<service-role-key>
SUPABASE_BUCKET=uploads
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Email (SendGrid)
SENDGRID_API_KEY=<api-key>
SENDGRID_FROM_EMAIL=noreply@cadgroupmgt.com
SENDGRID_FROM_NAME=CADGroup Tools

# Push Notifications
VAPID_PUBLIC_KEY=<public-key>
VAPID_PRIVATE_KEY=<private-key>
VAPID_EMAIL=mailto:admin@cadgroupmgt.com

# OCR (Optional)
GOOGLE_APPLICATION_CREDENTIALS_JSON=<service-account-json>

# Feature Flags
STORAGE_DRIVER=supabase
NODE_ENV=production
```

## Deployment Steps

### Initial Setup (One-time)

1. **MongoDB Atlas Setup**
   ```bash
   # Create cluster
   # Add IP whitelist (0.0.0.0/0 for Render)
   # Create database user
   # Get connection string
   ```

2. **Supabase Setup**
   ```bash
   # Create project
   # Create storage bucket named 'uploads'
   # Set bucket to public (if needed)
   # Get API keys from settings
   ```

3. **Render Setup**
   ```bash
   # Connect GitHub repository
   # Set environment variables
   # Configure build command: npm ci && npm run build
   # Configure start command: npm start
   # Set Node version: 20
   ```

4. **SendGrid Setup**
   ```bash
   # Create API key
   # Verify sender domain
   # Configure sender identity
   ```

### Manual Deployment

1. **Deploy via Git Push**
   ```bash
   git add .
   git commit -m "feat: your changes"
   git push origin main
   # Render auto-deploys on push to main
   ```

2. **Deploy via Render Dashboard**
   - Navigate to Render dashboard
   - Click "Manual Deploy"
   - Select commit to deploy

### Rollback Procedure

1. **Via Render Dashboard**
   - Go to "Deploys" tab
   - Find previous successful deploy
   - Click "Rollback to this deploy"

2. **Via Git**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

## Monitoring

### Health Checks
- **Database**: `GET /api/health/db`
- **Storage**: `GET /api/test-supabase`
- **Auth**: `GET /api/test-auth`

### Logs
- Access via Render dashboard
- Filter by service: Web Service
- Search for errors or specific requests

### Performance Monitoring
- Render provides basic metrics
- Consider adding:
  - Sentry for error tracking
  - Google Analytics for usage
  - Custom performance monitoring

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node version (should be 20.x)
   - Verify all dependencies are in package.json
   - Check for TypeScript errors

2. **Database Connection Issues**
   - Verify MongoDB URI is correct
   - Check IP whitelist includes Render IPs
   - Ensure database user has correct permissions

3. **Authentication Issues**
   - Verify NEXTAUTH_URL matches deployment URL
   - Ensure NEXTAUTH_SECRET is set
   - Check session configuration

4. **File Upload Issues**
   - Verify Supabase credentials
   - Check bucket permissions
   - Ensure STORAGE_DRIVER=supabase

### Debug Mode
Enable debug logging:
```bash
# In Render environment variables
DEBUG=* # Enable all debug logs
TASKMASTER_LOG_LEVEL=debug
```

## Security Checklist

- [ ] All secrets in environment variables
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Database connection encrypted
- [ ] File uploads validated
- [ ] Admin routes protected
- [ ] CORS properly configured

## Backup & Recovery

### Database Backup
- MongoDB Atlas provides automated backups
- Configure backup schedule in Atlas
- Test restore procedure quarterly

### Code Backup
- All code in GitHub
- Protected main branch
- Require PR reviews

### Environment Backup
- Export Render environment variables
- Store securely in password manager
- Document all external service configurations

## Scaling Considerations

### Current Limits
- Render free tier: 512MB RAM
- MongoDB free tier: 512MB storage
- Supabase free tier: 1GB storage

### Upgrade Path
1. Upgrade Render to paid plan for:
   - More RAM and CPU
   - Zero downtime deploys
   - Custom domains

2. Upgrade MongoDB for:
   - More storage
   - Better performance
   - Advanced features

3. Consider adding:
   - Redis for caching
   - CDN for static assets
   - Load balancer for high availability

## Maintenance Windows

- Schedule updates during low-usage hours
- Notify users in advance
- Have rollback plan ready
- Test in staging first

## Contact & Support

- **Technical Issues**: dev@cadgroupmgt.com
- **Render Support**: https://render.com/support
- **MongoDB Support**: https://support.mongodb.com

---

Last Updated: November 2024
