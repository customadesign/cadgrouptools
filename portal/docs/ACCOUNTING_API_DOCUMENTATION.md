# Accounting API Documentation

## Overview
This document describes the comprehensive accounting API endpoints that provide real-time financial data from MongoDB. These endpoints replace all mock data with actual transaction and statement data.

## Base URL
```
/api/accounting
```

## Authentication
All endpoints require authentication via NextAuth session. Ensure the user is logged in before making requests.

## Endpoints

### 1. Accounting Overview
**GET** `/api/accounting/overview`

Fetches comprehensive accounting overview data including key metrics, recent transactions, cash flow trends, and expense categories.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| startDate | string (YYYY-MM-DD) | Start of current month | Beginning of date range |
| endDate | string (YYYY-MM-DD) | End of current month | End of date range |
| includeBalances | boolean | false | Include account balance information |

#### Response Structure
```json
{
  "success": true,
  "dateRange": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-31T23:59:59.999Z"
  },
  "keyMetrics": {
    "totalIncome": 50000,
    "totalExpenses": 30000,
    "netIncome": 20000,
    "profitMargin": 40,
    "transactionCounts": {
      "income": 15,
      "expense": 45
    }
  },
  "recentTransactions": [
    {
      "id": "transaction_id",
      "date": "2024-01-15T00:00:00.000Z",
      "description": "Client Payment",
      "category": "Income",
      "amount": 5000,
      "type": "income",
      "status": "completed",
      "account": "Business Checking"
    }
  ],
  "cashFlowTrend": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "datasets": [
      {
        "label": "Income",
        "data": [45000, 52000, 48000, 61000, 58000, 65000],
        "borderColor": "#52c41a",
        "backgroundColor": "rgba(82, 196, 26, 0.1)"
      },
      {
        "label": "Expenses",
        "data": [32000, 28000, 35000, 30000, 33000, 31000],
        "borderColor": "#ff4d4f",
        "backgroundColor": "rgba(255, 77, 79, 0.1)"
      }
    ]
  },
  "expenseCategories": [
    {
      "name": "Technology",
      "amount": 5000,
      "percentage": 16.67,
      "count": 10
    }
  ],
  "monthlyComparison": {
    "thisMonth": {
      "income": 65000,
      "expenses": 31000,
      "net": 34000
    },
    "lastMonth": {
      "income": 58000,
      "expenses": 33000,
      "net": 25000
    },
    "percentageChange": {
      "income": 12.07,
      "expenses": -6.06,
      "net": 36
    }
  },
  "accountBalances": [
    {
      "accountName": "Business Checking",
      "balance": 125000,
      "lastUpdated": "2024-01-31T00:00:00.000Z",
      "bankName": "Chase"
    }
  ],
  "additionalStats": {
    "totalTransactions": 60,
    "avgTransactionAmount": {
      "income": 3333.33,
      "expense": 666.67
    },
    "largestIncome": {
      "amount": 15000,
      "description": "Enterprise Client Payment",
      "txnDate": "2024-01-15T00:00:00.000Z"
    },
    "largestExpense": {
      "amount": 5000,
      "description": "Office Rent",
      "txnDate": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 2. Generate Reports
**POST** `/api/accounting/overview`

Generates detailed financial reports for a specified period.

#### Request Body
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "reportType": "summary|profit_loss|cash_flow",
  "includeDetails": false
}
```

#### Report Types

##### Summary Report
Provides a high-level overview of financial metrics grouped by direction, category, and month.

##### Profit & Loss Report
Detailed income and expense breakdown by category with totals and net income calculation.

##### Cash Flow Report
Shows cash inflows and outflows over time with weekly/monthly groupings.

#### Response Structure
```json
{
  "success": true,
  "report": {
    "type": "profit_loss",
    "period": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-31T23:59:59.999Z"
    },
    "income": {
      "categories": [
        {
          "category": "Services",
          "amount": 50000,
          "count": 10
        }
      ],
      "total": 50000
    },
    "expenses": {
      "categories": [
        {
          "category": "Technology",
          "amount": 5000,
          "count": 15
        }
      ],
      "total": 30000
    },
    "netIncome": 20000
  },
  "generated": "2024-01-31T12:00:00.000Z"
}
```

### 3. Category Statistics
**GET** `/api/accounting/categories`

Fetches detailed statistics for transaction categories.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| startDate | string | None | Filter start date |
| endDate | string | None | Filter end date |
| direction | string | Both | Filter by 'debit' or 'credit' |

#### Response Structure
```json
{
  "success": true,
  "categories": ["Technology", "Rent", "Meals", "Transport"],
  "statistics": [
    {
      "category": "Technology",
      "expenses": {
        "totalAmount": 5000,
        "transactionCount": 15,
        "avgAmount": 333.33,
        "minAmount": 50,
        "maxAmount": 2000,
        "percentage": 16.67
      },
      "income": null
    }
  ],
  "totals": {
    "expenses": 30000,
    "income": 50000
  },
  "monthlyTrend": {
    "Technology": {
      "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      "income": [0, 0, 0, 0, 0, 0],
      "expenses": [2500, 2000, 3000, 2500, 2800, 3200]
    }
  }
}
```

### 4. Bulk Categorization
**POST** `/api/accounting/categories`

Automatically categorize transactions based on pattern matching rules.

#### Request Body
```json
{
  "rules": [
    {
      "pattern": "AWS|Amazon Web Services",
      "category": "Technology",
      "caseSensitive": false
    },
    {
      "pattern": "Rent|Lease",
      "category": "Rent",
      "caseSensitive": false
    }
  ],
  "applyToUncategorized": true,
  "applyToAll": false
}
```

#### Response
```json
{
  "success": true,
  "totalUpdated": 25,
  "results": [
    {
      "rule": "AWS|Amazon Web Services",
      "category": "Technology",
      "matched": 15,
      "updated": 15
    }
  ]
}
```

### 5. Account Balances
**GET** `/api/accounting/balances`

Fetches current account balances and balance history.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| account | string | All | Filter by specific account name |
| includeHistory | boolean | false | Include balance history |
| historyDays | number | 30 | Days of history to include |

#### Response Structure
```json
{
  "success": true,
  "accounts": [
    {
      "accountName": "Business Checking",
      "currentBalance": 125000,
      "lastTransaction": {
        "date": "2024-01-31T00:00:00.000Z",
        "description": "Client Payment",
        "amount": 5000,
        "direction": "credit"
      },
      "bankName": "Chase",
      "currency": "USD",
      "statistics": {
        "totalDebits": 30000,
        "totalCredits": 50000,
        "debitCount": 45,
        "creditCount": 15,
        "avgDebitAmount": 666.67,
        "avgCreditAmount": 3333.33,
        "netFlow": 20000
      }
    }
  ],
  "balanceHistory": {
    "Business Checking": [
      {
        "date": "2024-01-01",
        "balance": 105000,
        "transactions": 5,
        "debits": 2000,
        "credits": 7000,
        "netChange": 5000
      }
    ]
  },
  "recentChanges": [
    {
      "account": "Business Checking",
      "date": "2024-01-31T00:00:00.000Z",
      "description": "Client Payment",
      "amount": 5000,
      "direction": "credit",
      "balance": 125000
    }
  ],
  "trends": [
    {
      "accountName": "Business Checking",
      "currentBalance": 125000,
      "trend": {
        "last30Days": 20000,
        "last7Days": 5000,
        "direction": "up",
        "percentage": 19.05
      }
    }
  ],
  "summary": {
    "totalAccounts": 3,
    "totalBalance": 218250,
    "lastUpdated": "2024-01-31T00:00:00.000Z"
  }
}
```

### 6. Reconcile Balance
**POST** `/api/accounting/balances`

Reconciles account balance by creating an adjustment transaction if needed.

#### Request Body
```json
{
  "accountName": "Business Checking",
  "actualBalance": 125500,
  "reconcileDate": "2024-01-31",
  "notes": "Monthly reconciliation"
}
```

#### Response
```json
{
  "success": true,
  "reconciled": true,
  "transaction": {
    "_id": "transaction_id",
    "description": "Balance Reconciliation: Monthly reconciliation",
    "amount": 500,
    "direction": "credit",
    "balance": 125500
  },
  "previousBalance": 125000,
  "newBalance": 125500,
  "adjustment": 500
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "status": 400
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request (invalid parameters)
- 401: Unauthorized (not authenticated)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error

## Integration with Frontend

### Example: Fetching Overview Data
```javascript
const fetchAccountingData = async () => {
  const params = new URLSearchParams({
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    includeBalances: 'true'
  });

  const response = await fetch(`/api/accounting/overview?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch accounting data');
  }
  
  const data = await response.json();
  return data;
};
```

### Example: Categorizing Transactions
```javascript
const categorizeTransactions = async () => {
  const response = await fetch('/api/accounting/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      rules: [
        {
          pattern: 'AWS|Google Cloud',
          category: 'Cloud Services'
        }
      ],
      applyToUncategorized: true
    })
  });
  
  const result = await response.json();
  console.log(`Categorized ${result.totalUpdated} transactions`);
};
```

## Performance Considerations

1. **Date Ranges**: Use specific date ranges to limit data fetched
2. **Caching**: Consider implementing client-side caching for frequently accessed data
3. **Pagination**: For large datasets, use pagination parameters where available
4. **Batch Operations**: Use bulk endpoints for multiple operations

## Testing

Use the provided test script to verify all endpoints:

```bash
node scripts/test-accounting-overview-api.js
```

This will test all endpoints and provide a comprehensive report of their functionality.