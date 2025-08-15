# Accounting API Test Guide

## Quick Test Commands

### 1. Test Statement Endpoints

#### Get all statements
```bash
curl -X GET https://cadgrouptools.onrender.com/api/statements \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

#### Create a statement
```bash
curl -X POST https://cadgrouptools.onrender.com/api/statements \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "fileName": "test_statement.pdf",
    "fileSize": 1024000,
    "accountName": "Murphy Web Services - Bank Ozk 8979",
    "bankName": "Bank Ozk",
    "month": 1,
    "year": 2024,
    "status": "uploaded"
  }'
```

#### Get single statement
```bash
curl -X GET https://cadgrouptools.onrender.com/api/statements/STATEMENT_ID \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

#### Delete statement
```bash
curl -X DELETE https://cadgrouptools.onrender.com/api/statements/STATEMENT_ID \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

### 2. Test Transaction Endpoints

#### Get all transactions
```bash
curl -X GET https://cadgrouptools.onrender.com/api/transactions \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

#### Get transactions for a specific statement
```bash
curl -X GET "https://cadgrouptools.onrender.com/api/transactions?statement=STATEMENT_ID" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

#### Create transactions
```bash
curl -X POST https://cadgrouptools.onrender.com/api/transactions \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "statementId": "STATEMENT_ID",
    "transactions": [{
      "txnDate": "2024-01-15",
      "description": "Office Supplies",
      "amount": 150.00,
      "direction": "debit",
      "category": "office"
    }]
  }'
```

#### Delete transaction
```bash
curl -X DELETE https://cadgrouptools.onrender.com/api/transactions/TRANSACTION_ID \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

## Running the Automated Test Script

### Local Testing
```bash
cd portal
SESSION_COOKIE="your-session-cookie" node scripts/test-accounting-api.js
```

### Production Testing
```bash
cd portal
API_URL=https://cadgrouptools.onrender.com SESSION_COOKIE="your-session-cookie" node scripts/test-accounting-api.js
```

## Getting Your Session Cookie

1. Log into the application at https://cadgrouptools.onrender.com
2. Open Developer Tools (F12)
3. Go to Application/Storage → Cookies
4. Find the cookie named `next-auth.session-token` or similar
5. Copy the entire cookie value

## Expected Results

### Statement API
- ✅ Create statement returns 200 with statement data
- ✅ Get statements returns list with pagination
- ✅ Get single statement includes transaction summary
- ✅ Delete statement removes statement and associated transactions

### Transaction API
- ✅ Create transactions accepts single or bulk
- ✅ Get transactions returns filtered results with summary
- ✅ Get single transaction includes statement reference
- ✅ Delete transaction removes single transaction

## Common Issues and Solutions

### 401 Unauthorized
- Make sure you're logged in and using a valid session cookie
- Check that the cookie hasn't expired

### 404 Not Found
- Verify the statement/transaction ID exists
- Check that you're using MongoDB ObjectId format

### 500 Internal Server Error
- Check MongoDB connection
- Verify environment variables are set correctly
- Check server logs for detailed error messages