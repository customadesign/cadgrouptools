#!/usr/bin/env node

/**
 * Test script for the accounting overview API endpoints
 * Tests all the new endpoints created for the accounting overview page
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dayjs from 'dayjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'admin@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'password123';

let authToken = null;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log(`${'='.repeat(60)}`, 'cyan');
  log(title, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logResult(success, message) {
  if (success) {
    log(`✓ ${message}`, 'green');
  } else {
    log(`✗ ${message}`, 'red');
  }
}

async function authenticate() {
  logSection('Authentication');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (response.ok) {
      // In a real scenario, we'd need to handle session cookies
      // For testing purposes, we'll use a mock token
      authToken = 'test-token';
      logResult(true, 'Authentication successful');
      return true;
    } else {
      logResult(false, `Authentication failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    logResult(false, `Authentication error: ${error.message}`);
    return false;
  }
}

async function testEndpoint(name, url, options = {}) {
  log(`\nTesting: ${name}`, 'yellow');
  
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // In production, use proper session cookie
        'Cookie': `next-auth.session-token=${authToken}`,
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (response.ok && data.success !== false) {
      logResult(true, `Status: ${response.status}`);
      
      // Log key data points
      if (data.keyMetrics) {
        log(`  Total Income: $${data.keyMetrics.totalIncome?.toLocaleString() || 0}`, 'cyan');
        log(`  Total Expenses: $${data.keyMetrics.totalExpenses?.toLocaleString() || 0}`, 'cyan');
        log(`  Net Income: $${data.keyMetrics.netIncome?.toLocaleString() || 0}`, 'cyan');
        log(`  Profit Margin: ${data.keyMetrics.profitMargin?.toFixed(2) || 0}%`, 'cyan');
      }
      
      if (data.categories) {
        log(`  Categories found: ${data.categories.length}`, 'cyan');
      }
      
      if (data.statistics) {
        log(`  Category statistics: ${data.statistics.length} categories`, 'cyan');
      }
      
      if (data.accounts) {
        log(`  Accounts found: ${data.accounts.length}`, 'cyan');
        data.accounts.forEach(acc => {
          log(`    - ${acc.accountName}: $${acc.currentBalance?.toLocaleString() || 0}`, 'blue');
        });
      }
      
      if (data.recentTransactions) {
        log(`  Recent transactions: ${data.recentTransactions.length}`, 'cyan');
      }
      
      if (data.monthlyComparison) {
        log(`  Monthly comparison data available`, 'cyan');
      }
      
      return true;
    } else {
      logResult(false, `Status: ${response.status}`);
      if (data.error) {
        log(`  Error: ${data.error}`, 'red');
      }
      if (data.details) {
        log(`  Details: ${data.details}`, 'red');
      }
      return false;
    }
  } catch (error) {
    logResult(false, `Request failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  log('Starting Accounting API Tests', 'bright');
  log(`Testing against: ${BASE_URL}`, 'cyan');
  
  // Note: In a real environment, you'd need proper authentication
  // For now, we'll skip auth and assume the endpoints are accessible
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test 1: Overview endpoint with default parameters
  logSection('1. Accounting Overview - Default Parameters');
  totalTests++;
  if (await testEndpoint(
    'GET /api/accounting/overview',
    '/api/accounting/overview'
  )) {
    passedTests++;
  }
  
  // Test 2: Overview endpoint with date range
  logSection('2. Accounting Overview - With Date Range');
  totalTests++;
  const startDate = dayjs().subtract(30, 'days').format('YYYY-MM-DD');
  const endDate = dayjs().format('YYYY-MM-DD');
  if (await testEndpoint(
    'GET /api/accounting/overview with dates',
    `/api/accounting/overview?startDate=${startDate}&endDate=${endDate}&includeBalances=true`
  )) {
    passedTests++;
  }
  
  // Test 3: Categories endpoint
  logSection('3. Categories Statistics');
  totalTests++;
  if (await testEndpoint(
    'GET /api/accounting/categories',
    `/api/accounting/categories?startDate=${startDate}&endDate=${endDate}`
  )) {
    passedTests++;
  }
  
  // Test 4: Categories with direction filter
  logSection('4. Categories - Expenses Only');
  totalTests++;
  if (await testEndpoint(
    'GET /api/accounting/categories (expenses)',
    `/api/accounting/categories?direction=debit`
  )) {
    passedTests++;
  }
  
  // Test 5: Account Balances
  logSection('5. Account Balances');
  totalTests++;
  if (await testEndpoint(
    'GET /api/accounting/balances',
    '/api/accounting/balances?includeHistory=false'
  )) {
    passedTests++;
  }
  
  // Test 6: Account Balances with History
  logSection('6. Account Balances with History');
  totalTests++;
  if (await testEndpoint(
    'GET /api/accounting/balances with history',
    '/api/accounting/balances?includeHistory=true&historyDays=30'
  )) {
    passedTests++;
  }
  
  // Test 7: Generate Report - Summary
  logSection('7. Generate Summary Report');
  totalTests++;
  if (await testEndpoint(
    'POST /api/accounting/overview (summary report)',
    '/api/accounting/overview',
    {
      method: 'POST',
      body: JSON.stringify({
        startDate: startDate,
        endDate: endDate,
        reportType: 'summary',
        includeDetails: false,
      }),
    }
  )) {
    passedTests++;
  }
  
  // Test 8: Generate Report - Profit & Loss
  logSection('8. Generate P&L Report');
  totalTests++;
  if (await testEndpoint(
    'POST /api/accounting/overview (P&L report)',
    '/api/accounting/overview',
    {
      method: 'POST',
      body: JSON.stringify({
        startDate: startDate,
        endDate: endDate,
        reportType: 'profit_loss',
        includeDetails: false,
      }),
    }
  )) {
    passedTests++;
  }
  
  // Test 9: Generate Report - Cash Flow
  logSection('9. Generate Cash Flow Report');
  totalTests++;
  if (await testEndpoint(
    'POST /api/accounting/overview (cash flow)',
    '/api/accounting/overview',
    {
      method: 'POST',
      body: JSON.stringify({
        startDate: startDate,
        endDate: endDate,
        reportType: 'cash_flow',
        includeDetails: false,
      }),
    }
  )) {
    passedTests++;
  }
  
  // Summary
  logSection('Test Summary');
  log(`Total Tests: ${totalTests}`, 'bright');
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${totalTests - passedTests}`, totalTests - passedTests > 0 ? 'red' : 'green');
  
  const percentage = ((passedTests / totalTests) * 100).toFixed(1);
  if (passedTests === totalTests) {
    log(`\n✓ All tests passed! (${percentage}%)`, 'green');
  } else if (passedTests > totalTests / 2) {
    log(`\n⚠ Some tests passed (${percentage}%)`, 'yellow');
  } else {
    log(`\n✗ Most tests failed (${percentage}%)`, 'red');
  }
  
  // Provide recommendations
  if (passedTests < totalTests) {
    logSection('Recommendations');
    log('1. Ensure MongoDB is running and accessible', 'yellow');
    log('2. Check that test data exists in the database', 'yellow');
    log('3. Verify authentication is properly configured', 'yellow');
    log('4. Check server logs for detailed error messages', 'yellow');
  }
}

// Run tests
runTests().catch(error => {
  log(`\nUnexpected error: ${error.message}`, 'red');
  process.exit(1);
});