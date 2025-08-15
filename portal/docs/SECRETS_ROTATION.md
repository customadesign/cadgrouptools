# Secrets Rotation Runbook

## Overview
This document outlines the process for rotating secrets and API keys for the CADGroup Internal Tools Portal.

## Rotation Schedule

| Secret Type | Rotation Frequency | Last Rotated | Next Rotation |
|------------|-------------------|--------------|---------------|
| NEXTAUTH_SECRET | Quarterly | - | - |
| Database Passwords | Quarterly | - | - |
| API Keys | Monthly | - | - |
| OAuth Secrets | Annually | - | - |
| Encryption Keys | Annually | - | - |

## Pre-Rotation Checklist

- [ ] Schedule maintenance window
- [ ] Notify team members
- [ ] Backup current configuration
- [ ] Prepare new credentials
- [ ] Test in staging environment
- [ ] Have rollback plan ready

## Rotation Procedures

### 1. NEXTAUTH_SECRET

**Impact**: All active sessions will be invalidated

1. Generate new secret:
   ```bash
   openssl rand -base64 32
   ```

2. Update in Render:
   - Go to Environment Variables
   - Update `NEXTAUTH_SECRET`
   - Save changes

3. Deploy changes:
   - Trigger manual deploy
   - Monitor logs for errors

4. Verify:
   - Test login functionality
   - Check existing sessions

### 2. MongoDB Connection String

**Impact**: Database connectivity

1. In MongoDB Atlas:
   - Navigate to Database Access
   - Edit user password
   - Generate new password

2. Update connection string:
   - Build new connection string with new password
   - Update `MONGODB_URI` in Render

3. Test connection:
   - Verify app can connect
   - Check for connection errors

### 3. SendGrid API Key

**Impact**: Email functionality

1. In SendGrid:
   - Settings > API Keys
   - Create new API key
   - Copy key (shown only once)

2. Update in Render:
   - Update `SENDGRID_API_KEY`
   - Save changes

3. Test:
   - Send test email
   - Verify delivery

4. Revoke old key in SendGrid

### 4. Supabase Keys

**Impact**: File storage functionality

1. In Supabase Dashboard:
   - Settings > API
   - Regenerate service role key

2. Update in Render:
   - Update `SUPABASE_SERVICE_ROLE`
   - Keep `SUPABASE_URL` (doesn't change)

3. Test:
   - Upload test file
   - Verify storage access

### 5. Google Cloud Credentials

**Impact**: OCR functionality

1. In Google Cloud Console:
   - IAM & Admin > Service Accounts
   - Create new key for service account
   - Download JSON key file

2. Update credentials:
   - Convert to base64 if needed
   - Update `GOOGLE_APPLICATION_CREDENTIALS`

3. Test OCR functionality

### 6. Push Notification Keys (VAPID)

**Impact**: Push notifications

1. Generate new VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. Update in Render:
   - Update `VAPID_PUBLIC_KEY`
   - Update `VAPID_PRIVATE_KEY`

3. Update client-side:
   - Deploy new public key
   - Re-subscribe users

## Post-Rotation Steps

1. **Verify All Services**:
   - [ ] Authentication works
   - [ ] Database queries succeed
   - [ ] Emails send successfully
   - [ ] File uploads work
   - [ ] OCR processes correctly
   - [ ] Push notifications deliver

2. **Update Documentation**:
   - [ ] Update this runbook with rotation dates
   - [ ] Update team password manager
   - [ ] Update deployment docs

3. **Monitor**:
   - [ ] Check error logs
   - [ ] Monitor Sentry for issues
   - [ ] Watch for failed authentications

## Rollback Procedure

If issues occur after rotation:

1. **Immediate Rollback**:
   - Revert to previous secret values in Render
   - Trigger new deployment
   - Monitor for stabilization

2. **Troubleshooting**:
   - Check deployment logs
   - Verify environment variables
   - Test each service individually

3. **Communication**:
   - Notify team of issues
   - Update status page if needed
   - Document issues for post-mortem

## Emergency Contacts

- **Team Lead**: [Contact Info]
- **DevOps**: [Contact Info]
- **On-Call**: [Contact Info]

## Best Practices

1. **Never commit secrets to Git**
2. **Use strong, unique passwords**
3. **Rotate immediately if compromised**
4. **Test in staging first**
5. **Document all changes**
6. **Use secret scanning tools**
7. **Implement least privilege access**

## Automation Opportunities

Consider implementing:
- Automated rotation with HashiCorp Vault
- AWS Secrets Manager integration
- Automated testing post-rotation
- Notification system for upcoming rotations
