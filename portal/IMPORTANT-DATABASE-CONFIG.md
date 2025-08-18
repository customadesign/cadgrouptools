# IMPORTANT: Database Configuration

## Current Database Setup

Your MongoDB data is stored in the `test` database, NOT `cadtools`.

### Data Found:
- **Database**: `test`
- **Statement ID**: `68a2c214cbd5e89a14d81326`
- **Account**: Murphy Web Services - Bank OZK
- **Transactions**: 133 transactions with correct amounts (in thousands of dollars)

### Sample Transaction Amounts:
- INTUIT: $6,911.45
- STRIPE TRANSFER: $930.08
- CHASE CREDIT CRD EPAY: $8,292.26
- INTUIT: $8,556.68
- MICHAEL JARVIS NICOL IAT PAYPAL: $1,041.24

## Required Environment Variables

### For Local Development (.env.local):
```
MONGODB_URI=mongodb+srv://marketing:TaNN6bttM920rEjL@cadtools.dvvdsg1.mongodb.net/?retryWrites=true&w=majority&appName=cadtools
DB_NAME=test
```

### For Production (Render.com):
You MUST set these environment variables in your Render dashboard:

1. `MONGODB_URI` - Your MongoDB connection string (same as above)
2. `DB_NAME` - **MUST BE SET TO: `test`** (not `cadtools`)
3. `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
4. `NEXTAUTH_URL` - Set to: `https://cadgrouptools.onrender.com`
5. `NODE_ENV` - Set to: `production`

## Why This Matters

The application was looking in the wrong database (`cadtools`) which is empty. All your data is in the `test` database. This is why the transactions page wasn't showing any data.

## To Fix Production:

1. Go to your Render dashboard
2. Navigate to Environment settings
3. Change or add `DB_NAME=test`
4. Redeploy the application

The transactions will then appear correctly at:
https://cadgrouptools.onrender.com/accounting/transactions?statement=68a2c214cbd5e89a14d81326