#!/usr/bin/env node

/**
 * Test script for Accounting API endpoints
 * Tests statement and transaction CRUD operations
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const SESSION_COOKIE = process.env.SESSION_COOKIE || '';

// Test data
const testStatement = {
  fileName: 'test_statement.pdf',
  fileSize: 1024000,
  fileType: 'application/pdf',
  accountName: 'Test Business Checking',
  bankName: 'Test Bank',
  month: 1,
  year: 2024,
  status: 'uploaded',
};

const testTransaction = {
  txnDate: new Date('2024-01-15'),
  description: 'Test Transaction',
  amount: 100.50,
  direction: 'debit',
  category: 'office',
};

// Helper function to make authenticated requests
async function makeRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (SESSION_COOKIE) {
    headers['Cookie'] = SESSION_COOKIE;
  }

  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    return { response, data };
  } catch (error) {
    console.error(`Error making request to ${url}:`, error);
    throw error;
  }
}

// Test functions
async function testStatements() {
  console.log('\n=== Testing Statement Endpoints ===\n');

  // 1. Create a statement
  console.log('1. Creating a statement...');
  const { response: createRes, data: createData } = await makeRequest('/api/statements', {
    method: 'POST',
    body: JSON.stringify(testStatement),
  });

  if (!createRes.ok) {
    console.error('❌ Failed to create statement:', createData);
    return null;
  }

  console.log('✅ Statement created successfully');
  const statementId = createData.data._id;
  console.log(`   Statement ID: ${statementId}`);

  // 2. Get all statements
  console.log('\n2. Fetching all statements...');
  const { response: listRes, data: listData } = await makeRequest('/api/statements');

  if (!listRes.ok) {
    console.error('❌ Failed to fetch statements:', listData);
  } else {
    console.log(`✅ Fetched ${listData.data.length} statements`);
  }

  // 3. Get single statement
  console.log('\n3. Fetching single statement...');
  const { response: getRes, data: getData } = await makeRequest(`/api/statements/${statementId}`);

  if (!getRes.ok) {
    console.error('❌ Failed to fetch statement:', getData);
  } else {
    console.log('✅ Statement fetched successfully');
    console.log(`   Account: ${getData.data.accountName}`);
    console.log(`   Period: ${getData.data.month}/${getData.data.year}`);
    console.log(`   Transaction Count: ${getData.data.transactionCount || 0}`);
  }

  // 4. Update statement
  console.log('\n4. Updating statement status...');
  const { response: updateRes, data: updateData } = await makeRequest(`/api/statements/${statementId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'processing' }),
  });

  if (!updateRes.ok) {
    console.error('❌ Failed to update statement:', updateData);
  } else {
    console.log('✅ Statement updated successfully');
    console.log(`   New status: ${updateData.data.status}`);
  }

  return statementId;
}

async function testTransactions(statementId) {
  console.log('\n=== Testing Transaction Endpoints ===\n');

  if (!statementId) {
    console.log('⚠️  No statement ID available, skipping transaction tests');
    return;
  }

  // 1. Create transactions
  console.log('1. Creating transactions...');
  const transactions = [
    { ...testTransaction, description: 'Office Supplies' },
    { ...testTransaction, description: 'Client Payment', direction: 'credit', amount: 500 },
    { ...testTransaction, description: 'Rent Payment', amount: 1500 },
  ];

  const { response: createRes, data: createData } = await makeRequest('/api/transactions', {
    method: 'POST',
    body: JSON.stringify({
      statementId,
      transactions,
    }),
  });

  if (!createRes.ok) {
    console.error('❌ Failed to create transactions:', createData);
    return;
  }

  console.log(`✅ Created ${createData.count} transactions`);
  const transactionId = createData.data[0]._id;

  // 2. Get all transactions
  console.log('\n2. Fetching all transactions...');
  const { response: listRes, data: listData } = await makeRequest(`/api/transactions?statement=${statementId}`);

  if (!listRes.ok) {
    console.error('❌ Failed to fetch transactions:', listData);
  } else {
    console.log(`✅ Fetched ${listData.data.length} transactions`);
    console.log(`   Total Debits: $${listData.summary.totalDebits}`);
    console.log(`   Total Credits: $${listData.summary.totalCredits}`);
    console.log(`   Net Amount: $${listData.summary.netAmount}`);
  }

  // 3. Get single transaction
  console.log('\n3. Fetching single transaction...');
  const { response: getRes, data: getData } = await makeRequest(`/api/transactions/${transactionId}`);

  if (!getRes.ok) {
    console.error('❌ Failed to fetch transaction:', getData);
  } else {
    console.log('✅ Transaction fetched successfully');
    console.log(`   Description: ${getData.data.description}`);
    console.log(`   Amount: $${getData.data.amount}`);
    console.log(`   Direction: ${getData.data.direction}`);
  }

  // 4. Update transaction
  console.log('\n4. Updating transaction...');
  const { response: updateRes, data: updateData } = await makeRequest(`/api/transactions/${transactionId}`, {
    method: 'PUT',
    body: JSON.stringify({ category: 'technology', description: 'Updated Description' }),
  });

  if (!updateRes.ok) {
    console.error('❌ Failed to update transaction:', updateData);
  } else {
    console.log('✅ Transaction updated successfully');
    console.log(`   New category: ${updateData.data.category}`);
    console.log(`   New description: ${updateData.data.description}`);
  }

  // 5. Delete transaction
  console.log('\n5. Deleting single transaction...');
  const { response: deleteRes, data: deleteData } = await makeRequest(`/api/transactions/${transactionId}`, {
    method: 'DELETE',
  });

  if (!deleteRes.ok) {
    console.error('❌ Failed to delete transaction:', deleteData);
  } else {
    console.log('✅ Transaction deleted successfully');
  }

  return true;
}

async function cleanupTestData(statementId) {
  if (!statementId) return;

  console.log('\n=== Cleaning up test data ===\n');

  // Delete the test statement (this will also delete associated transactions)
  const { response, data } = await makeRequest(`/api/statements/${statementId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    console.error('❌ Failed to delete test statement:', data);
  } else {
    console.log('✅ Test statement and transactions deleted successfully');
    console.log(`   Deleted ${data.deletedTransactions} transactions`);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Accounting API Tests');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Session: ${SESSION_COOKIE ? 'Provided' : 'Not provided (tests may fail)'}`);

  let statementId = null;

  try {
    // Run statement tests
    statementId = await testStatements();

    // Run transaction tests
    if (statementId) {
      await testTransactions(statementId);
    }

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    // Clean up test data
    if (statementId) {
      await cleanupTestData(statementId);
    }
  }

  console.log('\n🎉 Test suite completed!');
}

// Run tests
runTests().catch(console.error);