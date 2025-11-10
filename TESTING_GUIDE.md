# CAD Group Tools - Testing Guide

## Pre-Deployment Testing (Local)

### 1. Environment Setup

Ensure your `.env` file has all required variables:

```bash
# Copy env.example to .env
cp portal/env.example portal/.env

# Add your actual API keys:
MANUS_API_KEY=sk-84mJtNODf1nezQJLbmbOmoKhe4aQVb2GZCbCjdkioPsIAFXwSbL_K_qrjop3dcDD_9n67thIrNoxy-YStjm3k3qX8bHx
GHL_API_KEY=pit-b1a70f52-ef61-4e6e-a439-22d836a23563
GHL_LOCATION_ID=62kZ0CQqMotRWvdIjMZS
ANTHROPIC_API_KEY=<your-key>
MANUS_WEBHOOK_SECRET=<generate-random-string>
GHL_WEBHOOK_SECRET=<generate-random-string>
```

### 2. Test Webhook Endpoints

```bash
cd portal
npm run dev

# In another terminal:
node scripts/test-webhooks.js
```

Expected output: Both endpoints should return 405 Method Not Allowed (correct behavior).

### 3. Test Database Models

Start the dev server and verify models are loading:

```bash
cd portal
npm run dev
```

Check console for any MongoDB connection errors.

## Post-Deployment Testing (Production)

### 1. Verify Deployment

Check Render dashboard: https://dashboard.render.com/web/srv-d2dibgje5dus7382l99g

Ensure:
- ✅ Build completed successfully
- ✅ Service is live
- ✅ All environment variables are set

### 2. Test Health Endpoints

```bash
curl https://cadgrouptools.onrender.com/api/health
curl https://cadgrouptools.onrender.com/api/health/db
```

### 3. Register Webhooks

```bash
cd portal
node scripts/register-webhooks.js
```

This will:
- Register webhook with Manus AI
- Register webhook with GoHighLevel
- Display webhook IDs for reference

### 4. Test Webhook Endpoints

```bash
NEXTAUTH_URL=https://cadgrouptools.onrender.com node scripts/test-webhooks.js
```

## Feature Testing Workflows

### Murphy Consulting Proposal Workflow

**Test Steps:**

1. **Submit Test Form**
   - Go to a Murphy Consulting "Get Estimate" form in GoHighLevel
   - Fill out form with test data:
     ```
     Company: Test Company Inc
     Website: https://testcompany.com
     Email: test@testcompany.com
     Services: Website Design, SEO
     ```
   - Submit form

2. **Verify Webhook Receipt**
   - Check Render logs: `https://dashboard.render.com/web/srv-d2dibgje5dus7382l99g`
   - Look for: "Received GoHighLevel webhook"
   - Should see: "Created GHL submission record"

3. **Check Database Records**
   ```bash
   # Access MongoDB and check:
   db.gohighlevelsubmissions.findOne({ company: 'murphy' }).sort({ createdAt: -1 })
   db.manustasks.findOne({ taskType: 'proposal_murphy' }).sort({ createdAt: -1 })
   db.proposals.findOne().sort({ createdAt: -1 })
   ```

4. **Monitor Manus Task**
   - Log in to https://cadgrouptools.onrender.com
   - Navigate to Proposals → Murphy Consulting
   - Find the new proposal
   - Status should be "Processing"
   - Manus status should show "Processing"

5. **Wait for Completion**
   - Manus will send webhook when complete (may take 2-5 minutes)
   - Check Render logs for: "Received Manus webhook"
   - Refresh proposal page

6. **Verify Results**
   - Status should change to "Finalized"
   - Google Slides URL should be available
   - Click "View Slides" button
   - Verify slides contain:
     - Cover with Murphy Consulting branding
     - Current state analysis
     - Recommendations
     - Pricing breakdown

7. **Test Email Sending**
   - Click "Send to Client" button
   - Add optional message
   - Click "Send Email"
   - Verify:
     - Email sent via SendGrid
     - Proposal status changed to "Sent"
     - Client receives email with Google Slides link

**Expected Timeline:**
- Form submission → Webhook received: < 5 seconds
- Manus task created: < 10 seconds
- Manus processing: 2-5 minutes
- Webhook completion: < 5 seconds
- Total: ~3-6 minutes from form to proposal

### E-Systems Management Proposal Workflow

**Test Steps:**

1. **Submit E-Systems Form**
   - Go to: https://link.esystemsmanagement.com/widget/form/Dencs4XQEHrrOmkLPuCz
   - Fill out form with product requirements
   - Submit

2. **Verify Processing**
   - Follow same steps as Murphy workflow
   - Check `/proposals/esystems` instead
   - Verify E-Systems branding in slides

3. **Verify Product Focus**
   - Slides should focus on products, not hourly services
   - Should include product specifications
   - Should include implementation timeline

### Accounting Document Upload Workflow

**Test Steps:**

1. **Upload Test Document**
   - Log in to https://cadgrouptools.onrender.com
   - Navigate to Accounting
   - Select company: "Murphy Web Services Incorporated"
   - Select month: Current month
   - Select year: Current year
   - Select type: "Bank Statement"
   - Upload a test PDF (bank statement)
   - Click "Upload & Process with Manus AI"

2. **Verify Upload**
   - Check Supabase storage bucket
   - Verify file exists at: `murphy_web_services/2025/November/[timestamp].pdf`
   - Get public URL and verify file is accessible

3. **Check Database**
   ```bash
   db.accountingdocuments.findOne({ company: 'murphy_web_services' }).sort({ createdAt: -1 })
   ```
   
   Should show:
   - processingStatus: "processing"
   - manusTaskId: exists
   - supabasePath: correct path

4. **Monitor Manus Task**
   - Check if company already had a persistent task:
     ```bash
     db.manustasks.findOne({ 
       company: 'murphy_web_services', 
       taskType: 'accounting' 
     })
     ```
   - Should be ONE task (reusable)
   - Status should be "processing"

5. **Wait for Analysis**
   - Manus processes document (OCR + analysis)
   - May take 3-10 minutes depending on document size
   - Webhook will fire when complete

6. **Verify Results**
   - Navigate to `/accounting-manus/murphy_web_services`
   - Document should show "Completed" status
   - P&L statement should be generated
   - Click "View Analysis" to see:
     - Extracted transactions
     - Revenue/expense breakdown
     - Insights

7. **Test Second Upload**
   - Upload another document for the same company
   - Verify it uses the SAME Manus task (reusable)
   - Check that analysis accumulates knowledge

### Claude Chat Widget Workflow

**Test Steps:**

1. **Access Chat**
   - Log in to CAD Group Tools
   - Look for floating chat button (bottom-right)
   - Click to open chat drawer

2. **Test Context Awareness**
   - Navigate to a company accounting page
   - Open chat widget
   - Should show current company context
   - Quick question buttons should appear

3. **Ask Questions**
   - Try quick questions:
     - "What are the key insights from October 2024?"
     - "How does this month compare to last month?"
     - "What are the major expense categories?"
   
4. **Verify Responses**
   - Responses should reference actual data
   - Should cite specific numbers from P&L
   - Should be contextually relevant

5. **Test Chat Features**
   - Send multiple messages (conversation flow)
   - Export conversation (download .txt file)
   - Clear conversation (reset chat)
   - Verify persistence (refresh page, chat history remains)

6. **Test Across Companies**
   - Navigate to different company pages
   - Chat should update context automatically
   - Context indicator should show current company

## Integration Testing

### Complete Murphy Flow (End-to-End)

```
1. Submit GoHighLevel form
   ↓
2. GHL webhook fires → CAD Tools receives
   ↓
3. Create GHL submission, client, proposal records
   ↓
4. Create Manus task with research instructions
   ↓
5. Manus researches and generates proposal
   ↓
6. Manus webhook fires → CAD Tools receives
   ↓
7. Update proposal with Google Slides URL
   ↓
8. User views proposal in UI
   ↓
9. User sends to client via SendGrid
   ↓
10. Client receives email with Slides link
```

**Test Checklist:**
- [ ] Form submission received
- [ ] Database records created
- [ ] Manus task created
- [ ] Proposal shows "Processing"
- [ ] Webhook completion received
- [ ] Google Slides URL available
- [ ] Proposal viewable in UI
- [ ] Email sends successfully
- [ ] Client receives email

### Complete Accounting Flow (End-to-End)

```
1. Upload document via UI
   ↓
2. Upload to Supabase storage
   ↓
3. Create AccountingDocument record
   ↓
4. Check for existing Manus task (or create new)
   ↓
5. Upload file to Manus task
   ↓
6. Manus performs OCR and analysis
   ↓
7. Manus generates P&L statement
   ↓
8. Manus webhook fires → CAD Tools receives
   ↓
9. Update AccountingDocument with results
   ↓
10. User views analysis and P&L in UI
   ↓
11. User asks Claude about the data
   ↓
12. Claude provides contextual insights
```

**Test Checklist:**
- [ ] Document uploads to Supabase
- [ ] AccountingDocument created
- [ ] Manus task created/reused
- [ ] File sent to Manus
- [ ] OCR extraction completed
- [ ] P&L statement generated
- [ ] Webhook received
- [ ] Analysis visible in UI
- [ ] Chat widget works
- [ ] Chat provides accurate insights

## Error Testing

### Test Error Scenarios

1. **Invalid Form Data**
   - Submit form with missing fields
   - Verify graceful error handling

2. **Manus API Failure**
   - Temporarily use invalid API key
   - Verify error is logged and status updated

3. **Webhook Signature Failure**
   - Send webhook with invalid signature
   - Should return 401 Unauthorized

4. **Large File Upload**
   - Upload 30MB file (exceeds limit)
   - Should show error message

5. **Duplicate Uploads**
   - Upload same document twice
   - Verify no duplicate processing

## Performance Testing

### Load Testing

Test with:
- 5 simultaneous form submissions
- 10 document uploads at once
- Multiple chat sessions

Monitor:
- Response times
- Memory usage
- Database connections
- API rate limits

## Security Testing

### Webhook Security

1. **Signature Verification**
   - Send webhook without signature → Should reject
   - Send webhook with wrong signature → Should reject
   - Send webhook with correct signature → Should accept

2. **Authentication**
   - Try accessing APIs without auth → Should return 401
   - Try accessing with valid session → Should work

3. **File Upload Security**
   - Try uploading executable files → Should reject
   - Try uploading oversized files → Should reject
   - Verify Supabase permissions are correct

## Monitoring

### What to Monitor

1. **Webhook Receipts**
   - Check Render logs for webhook events
   - Verify all webhooks are processed

2. **Manus Task Status**
   - Monitor task completion rates
   - Track average processing time
   - Alert on failures

3. **Database Growth**
   - Monitor collection sizes
   - Check for orphaned records
   - Verify cleanup processes

4. **Error Rates**
   - Track API errors
   - Monitor webhook failures
   - Alert on high error rates

## Success Criteria

✅ All tests pass
✅ No errors in Render logs
✅ Webhooks registered successfully
✅ Forms create proposals automatically
✅ Documents upload and process correctly
✅ Chat provides accurate insights
✅ Emails send successfully
✅ UI is responsive and bug-free

## Known Limitations

- Manus processing time: 2-10 minutes per task
- Google Slides generation depends on Manus capabilities
- Chat widget requires ANTHROPIC_API_KEY
- Webhooks require public HTTPS endpoints
- File uploads limited to 25MB

## Support

If tests fail:
1. Check Render logs
2. Verify environment variables
3. Check MongoDB connection
4. Verify Supabase permissions
5. Test webhook endpoints individually
6. Review error messages in UI

