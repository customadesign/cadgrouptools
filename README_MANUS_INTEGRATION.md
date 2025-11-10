# CAD Group Tools - Manus AI Integration

## 🎯 Overview

This document describes the complete Manus AI integration for CAD Group Internal Tools, enabling automated proposal generation and accounting analysis.

## 🚀 Features

### 1. Automated Proposal Generation

#### Murphy Consulting
- **Trigger**: GoHighLevel form submissions from "Get Estimate" folder
- **Processing**: Manus AI researches website, industry, competitors, SEO
- **Output**: Google Slides presentation with pricing at $35/hour
- **Delivery**: Automated email via SendGrid

#### E-Systems Management  
- **Trigger**: E-Systems form submission (form ID: `Dencs4XQEHrrOmkLPuCz`)
- **Processing**: Manus AI performs product research
- **Output**: Google Slides with product specifications and pricing
- **Delivery**: Automated email via SendGrid

### 2. Intelligent Accounting Automation

#### Multi-Company Support
- Murphy Web Services Incorporated
- E-Systems Management Incorporated
- M&M Secretarial Services Incorporated
- DPM Incorporated
- Linkage Web Solutions Enterprise Incorporated
- WDDS
- M&M Leasing Services
- Hardin Bar & Grill
- MPHI

#### Automated Processing
- **Upload**: Documents to Supabase storage
- **OCR**: Manus AI extracts text from PDFs/images
- **Analysis**: Transaction parsing and categorization
- **P&L**: Automatic monthly profit & loss generation
- **Persistence**: ONE reusable Manus task per company

### 3. Claude-Powered Chat Assistant

- **Floating Widget**: Always accessible from any page
- **Context-Aware**: Knows current company and financial data
- **Quick Questions**: Pre-generated relevant questions
- **Chat History**: Persistent across sessions
- **Export**: Download conversation transcripts
- **Real-time**: Streaming responses from Claude 3.5 Sonnet

## 📁 Project Structure

```
portal/
├── src/
│   ├── models/
│   │   ├── ManusTask.ts              # Tracks Manus AI tasks
│   │   ├── AccountingDocument.ts     # Uploaded accounting docs
│   │   └── GoHighLevelSubmission.ts  # Form submissions
│   │
│   ├── services/
│   │   ├── manusService.ts           # Manus AI API client
│   │   ├── ghlService.ts             # GoHighLevel API client
│   │   └── claudeService.ts          # Claude SDK integration
│   │
│   ├── app/
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   ├── manus/route.ts    # Manus webhook handler
│   │   │   │   └── ghl/route.ts      # GoHighLevel webhook handler
│   │   │   ├── proposals/
│   │   │   │   ├── route.ts          # List/create proposals
│   │   │   │   ├── [id]/route.ts     # Get/update/delete proposal
│   │   │   │   └── [id]/send/route.ts # Email proposal
│   │   │   └── accounting/
│   │   │       ├── upload/route.ts   # Upload documents
│   │   │       ├── [company]/route.ts # Get company data
│   │   │       └── chat/
│   │   │           ├── route.ts      # Chat with Claude
│   │   │           └── suggestions/route.ts # Quick questions
│   │   │
│   │   ├── proposals/
│   │   │   ├── page.tsx              # Unified dashboard
│   │   │   ├── murphy/
│   │   │   │   ├── page.tsx          # Murphy list
│   │   │   │   └── [id]/page.tsx     # Murphy detail
│   │   │   └── esystems/
│   │   │       ├── page.tsx          # E-Systems list
│   │   │       └── [id]/page.tsx     # E-Systems detail
│   │   │
│   │   └── accounting-manus/
│   │       ├── page.tsx              # Upload interface
│   │       └── [company]/page.tsx    # Company analysis
│   │
│   └── components/
│       └── AccountingChatWidget.tsx  # Floating chat
│
└── scripts/
    ├── register-webhooks.js          # Register webhooks
    └── test-webhooks.js              # Test endpoints
```

## 🔧 Configuration

### Environment Variables

```bash
# Manus AI
MANUS_API_KEY=sk-84mJtNODf1nezQJLbmbOmoKhe4aQVb2GZCbCjdkioPsIAFXwSbL_K_qrjop3dcDD_9n67thIrNoxy-YStjm3k3qX8bHx
MANUS_BASE_URL=https://api.manus.ai/v1
MANUS_WEBHOOK_SECRET=<generate-random-string>

# GoHighLevel
GHL_API_KEY=pit-b1a70f52-ef61-4e6e-a439-22d836a23563
GHL_LOCATION_ID=62kZ0CQqMotRWvdIjMZS
GHL_WEBHOOK_SECRET=<generate-random-string>

# Claude SDK
ANTHROPIC_API_KEY=<your-anthropic-api-key>

# Company Configuration
MURPHY_HOURLY_RATE=35
```

### Webhook Registration

After deployment:

```bash
cd portal
node scripts/register-webhooks.js
```

This registers:
- Manus AI webhook: `https://cadgrouptools.onrender.com/api/webhooks/manus`
- GoHighLevel webhook: `https://cadgrouptools.onrender.com/api/webhooks/ghl`

## 📊 Data Flow

### Proposal Generation Flow

```
GoHighLevel Form Submission
         ↓
    GHL Webhook
         ↓
  CAD Group Tools
    (Store submission)
         ↓
   Create Manus Task
   (Research instructions)
         ↓
     Manus AI
  (Research & Generate)
         ↓
  Create Google Slides
         ↓
   Manus Webhook
         ↓
  CAD Group Tools
  (Update proposal)
         ↓
    View in UI
         ↓
  Send to Client
   (SendGrid)
```

### Accounting Processing Flow

```
  Upload Document
         ↓
 Supabase Storage
         ↓
  CAD Group Tools
 (Create record)
         ↓
Find/Create Manus Task
  (Persistent per company)
         ↓
Upload to Manus Task
         ↓
     Manus AI
(OCR → Parse → Analyze)
         ↓
  Generate P&L
         ↓
   Manus Webhook
         ↓
  CAD Group Tools
  (Update analysis)
         ↓
    View in UI
         ↓
  Chat with Claude
  (Ask questions)
```

## 🎯 Key Concepts

### Persistent Accounting Tasks

Each company gets ONE reusable Manus task that:
- Accumulates knowledge over time
- Learns from all uploaded documents
- Maintains complete financial history
- Generates comprehensive analysis

This approach:
- ✅ More context-aware over time
- ✅ Better insights with more data
- ✅ Reduces API calls
- ✅ Maintains continuity

### Webhook Security

All webhooks use HMAC-SHA256 signatures:
- Prevents unauthorized requests
- Timing-safe comparison
- Environment-based secrets
- Logs all verification attempts

### Context-Aware Chat

Claude chat widget knows:
- Current company being viewed
- Recent documents uploaded
- Latest P&L statements
- Current page location
- User's role and permissions

## 📱 User Workflows

### For Proposals (Automated)

1. Client fills out GoHighLevel form
2. System automatically:
   - Receives webhook
   - Creates proposal record
   - Triggers Manus research
   - Generates Google Slides
   - Notifies staff
3. Staff reviews in UI
4. Staff sends to client via email
5. Client views Google Slides

### For Accounting (Manual Upload)

1. Staff navigates to Accounting
2. Selects company, month, year
3. Uploads document (PDF/image)
4. System automatically:
   - Stores in Supabase
   - Sends to Manus AI
   - Waits for processing
   - Updates with results
5. Staff views:
   - Extracted transactions
   - P&L statements
   - Insights and trends
6. Staff asks Claude:
   - "What should I focus on?"
   - "How's cash flow?"
   - "Any unusual expenses?"

## 🔍 Monitoring & Debugging

### Check Webhook Status

```bash
# Test endpoints
node scripts/test-webhooks.js

# Check recent logs
# Via Render dashboard or MCP tools
```

### Database Queries

```javascript
// Check Manus tasks
db.manustasks.find({ status: 'processing' })

// Check proposals
db.proposals.find({ status: 'draft' }).sort({ createdAt: -1 })

// Check accounting docs
db.accountingdocuments.find({ processingStatus: 'processing' })

// Check GHL submissions
db.gohighlevelsubmissions.find({ status: 'received' }).sort({ createdAt: -1 })
```

### View Logs

```bash
# Via Render MCP
# Filter by type: 'build', 'app'
# Filter by level: 'info', 'error'
```

## 🚨 Troubleshooting

### Proposals Not Generating

1. Check GHL webhook is registered
2. Verify MANUS_API_KEY is valid
3. Check Render logs for webhook receipts
4. Verify MongoDB connection
5. Test form submission manually

### Accounting Not Processing

1. Check file uploaded to Supabase
2. Verify Manus task was created/found
3. Check file size (< 25MB)
4. Verify MANUS_API_KEY is valid
5. Check webhook receipts

### Chat Not Responding

1. Verify ANTHROPIC_API_KEY is set
2. Check browser console for errors
3. Verify API route is accessible
4. Check MongoDB for document data

## 📈 Performance

### Expected Processing Times

- **Form to Proposal**: 3-6 minutes
- **Document to Analysis**: 5-10 minutes
- **Chat Response**: 2-5 seconds
- **Webhook Delivery**: < 1 second

### Resource Usage

- **Manus API**: Pay-per-task
- **Claude API**: Pay-per-token
- **Supabase Storage**: ~1-5 MB per document
- **MongoDB**: ~1-10 KB per record

## 🔐 Security

### API Keys
- Stored in environment variables
- Never exposed to client
- Rotated periodically

### Webhooks
- Signature verification required
- HTTPS only
- Rate limited

### File Uploads
- Type validation (PDF, images only)
- Size limits (25MB max)
- Supabase RLS policies
- Antivirus scanning recommended

### Chat
- Authentication required
- Context limited to user's permissions
- No PII in logs

## 📚 API Documentation

### Webhook Endpoints

**POST /api/webhooks/manus**
- Receives Manus AI task completion events
- Verifies X-Webhook-Signature header
- Updates proposals and accounting documents

**POST /api/webhooks/ghl**
- Receives GoHighLevel form submissions
- Verifies X-GHL-Signature header
- Creates proposals and triggers Manus tasks

### Proposal Endpoints

**GET /api/proposals?company={murphy|esystems}**
- Lists proposals filtered by company
- Returns enriched data with Manus status

**GET /api/proposals/[id]**
- Gets detailed proposal data
- Includes Manus task and GHL submission

**POST /api/proposals/[id]/send**
- Sends proposal to client via SendGrid
- Updates proposal status to 'sent'

### Accounting Endpoints

**POST /api/accounting/upload**
- Uploads document to Supabase
- Creates/finds Manus task
- Uploads to Manus for processing

**GET /api/accounting/[company]**
- Gets all documents for company
- Returns P&L statements
- Includes processing status

**POST /api/accounting/chat**
- Sends message to Claude with context
- Returns AI-generated response

**POST /api/accounting/chat/suggestions**
- Gets quick question suggestions
- Based on current context

## 🎓 Best Practices

### For Staff Users

1. **Proposals**
   - Check daily for new submissions
   - Review proposals before sending
   - Track client responses

2. **Accounting**
   - Upload documents monthly
   - Review P&L statements
   - Use chat to understand trends
   - Export data for tax prep

3. **Chat**
   - Ask specific questions
   - Reference specific months/years
   - Save important conversations

### For Administrators

1. **Monitor** webhook receipts
2. **Check** Manus task completion rates
3. **Review** error logs weekly
4. **Update** environment variables as needed
5. **Rotate** API keys quarterly
6. **Backup** MongoDB regularly

## 📞 Support

For issues or questions:
1. Check this README
2. Review TESTING_GUIDE.md
3. Check DEPLOYMENT.md
4. Review Render logs
5. Check MongoDB data

## 🗺️ Roadmap

### Phase 2 (Future)
- [ ] Real-time proposal editing
- [ ] Advanced P&L visualizations
- [ ] Multi-year trend analysis
- [ ] Budget forecasting
- [ ] Expense categorization training
- [ ] Automated report scheduling
- [ ] Mobile app support
- [ ] Multi-user collaboration

### Phase 3 (Future)
- [ ] Custom report templates
- [ ] Advanced analytics dashboard
- [ ] Integration with QuickBooks
- [ ] Tax document generation
- [ ] Audit trail reporting
- [ ] Compliance checking
- [ ] Predictive analytics

## 📄 License

Proprietary - CAD Group Management Internal Use Only

