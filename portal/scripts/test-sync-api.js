#!/usr/bin/env node

/**
 * Test script for statement sync and cleanup APIs
 * 
 * Usage:
 *   node scripts/test-sync-api.js
 */

require('dotenv').config();
const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(50));
  log(title, 'bright');
  console.log('='.repeat(50));
}

async function getAuthToken() {
  // In a real scenario, you'd authenticate first
  // For testing, you might need to manually set a session cookie
  // or use a test authentication endpoint
  
  log('Note: You may need to be authenticated to use these endpoints', 'yellow');
  log('Make sure you are logged in to the application in your browser', 'yellow');
  
  // Return empty headers for now - you'll need to add authentication
  return {};
}

async function testSyncStatus() {
  logSection('Testing Sync Status Endpoint');
  
  try {
    const response = await fetch(`${API_BASE}/statements/sync`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...await getAuthToken()
      },
      credentials: 'include' // Include cookies for session
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log('✅ Sync status retrieved successfully', 'green');
      
      if (data.summary) {
        console.log('\nSummary:');
        console.log(`  Total Statements: ${data.summary.totalStatements}`);
        console.log(`  Total Files: ${data.summary.totalFiles}`);
        console.log(`  Orphaned Statements: ${data.summary.orphanedStatements}`);
        console.log(`  Orphaned Files: ${data.summary.orphanedFiles}`);
        console.log(`  Valid Records: ${data.summary.validRecords}`);
        console.log(`  Files in Supabase: ${data.summary.filesInSupabase}`);
      }
      
      if (data.data?.recommendations && data.data.recommendations.length > 0) {
        console.log('\nRecommendations:');
        data.data.recommendations.forEach(rec => {
          console.log(`  - ${rec}`);
        });
      }
      
      if (data.data?.orphanedStatements && data.data.orphanedStatements.length > 0) {
        console.log('\nSample Orphaned Statements:');
        data.data.orphanedStatements.slice(0, 5).forEach(stmt => {
          console.log(`  - ${stmt.accountName} (${stmt.month}/${stmt.year}): ${stmt.fileName}`);
        });
        if (data.data.orphanedStatements.length > 5) {
          console.log(`  ... and ${data.data.orphanedStatements.length - 5} more`);
        }
      }
      
      return data;
    } else {
      log(`❌ Failed to get sync status: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error testing sync status: ${error.message}`, 'red');
    return null;
  }
}

async function testBatchCleanupStatus() {
  logSection('Testing Batch Cleanup Status');
  
  try {
    const response = await fetch(`${API_BASE}/statements/batch-cleanup`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...await getAuthToken()
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log('✅ Batch cleanup status retrieved', 'green');
      
      if (data.stats) {
        console.log('\nCleanup Statistics:');
        console.log(`  Total Statements: ${data.stats.totalStatements}`);
        console.log(`  Total Files: ${data.stats.totalFiles}`);
        console.log(`  Sample Size: ${data.stats.sampleSize}`);
        console.log(`  Orphaned in Sample: ${data.stats.orphanedInSample}`);
        console.log(`  Estimated Orphaned Records: ${data.stats.estimatedOrphanedRecords}`);
      }
      
      if (data.message) {
        console.log(`\nStatus: ${data.message}`);
      }
      
      return data;
    } else {
      log(`❌ Failed to get batch cleanup status: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error testing batch cleanup status: ${error.message}`, 'red');
    return null;
  }
}

async function testDryRunCleanup() {
  logSection('Testing Dry Run Cleanup');
  
  try {
    const response = await fetch(`${API_BASE}/statements/batch-cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...await getAuthToken()
      },
      credentials: 'include',
      body: JSON.stringify({
        dryRun: true,
        batchSize: 10,
        maxRecords: 50,
        cleanupType: 'all'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log('✅ Dry run cleanup completed', 'green');
      
      if (data.progress) {
        console.log('\nDry Run Results:');
        console.log(`  Records Processed: ${data.progress.processed}`);
        console.log(`  Total Records: ${data.progress.total}`);
        console.log(`  Orphaned Records Found: ${data.progress.orphanedRecords.length}`);
        
        if (data.progress.orphanedRecords.length > 0) {
          console.log('\nSample Orphaned Records:');
          data.progress.orphanedRecords.slice(0, 5).forEach(record => {
            console.log(`  - Type: ${record.type}, ID: ${record.id}`);
            if (record.details) {
              console.log(`    Details: ${JSON.stringify(record.details)}`);
            }
          });
        }
      }
      
      if (data.recommendations && data.recommendations.length > 0) {
        console.log('\nRecommendations:');
        data.recommendations.forEach(rec => {
          console.log(`  - ${rec}`);
        });
      }
      
      return data;
    } else {
      log(`❌ Failed to run dry cleanup: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error testing dry run cleanup: ${error.message}`, 'red');
    return null;
  }
}

async function testStatementsWithVerification() {
  logSection('Testing Statements API with File Verification');
  
  try {
    const response = await fetch(`${API_BASE}/statements?verifyFiles=true&limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...await getAuthToken()
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log('✅ Statements retrieved with file verification', 'green');
      
      if (data.data && data.data.length > 0) {
        console.log('\nStatement File Verification:');
        data.data.forEach(stmt => {
          const fileStatus = stmt.fileExists ? '✅' : '❌';
          console.log(`  ${fileStatus} ${stmt.accountName} (${stmt.month}/${stmt.year})`);
          if (!stmt.fileExists) {
            console.log(`     Missing file: ${stmt.sourceFile?.originalName || 'Unknown'}`);
          }
        });
      }
      
      return data;
    } else {
      log(`❌ Failed to get statements: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error testing statements with verification: ${error.message}`, 'red');
    return null;
  }
}

async function runAllTests() {
  log('\n🚀 Starting Statement Sync API Tests', 'cyan');
  log(`Testing against: ${BASE_URL}`, 'dim');
  
  // Test 1: Check sync status
  const syncStatus = await testSyncStatus();
  
  // Test 2: Check batch cleanup status
  const cleanupStatus = await testBatchCleanupStatus();
  
  // Test 3: Run dry cleanup
  const dryRun = await testDryRunCleanup();
  
  // Test 4: Test statements with file verification
  const statements = await testStatementsWithVerification();
  
  // Summary
  logSection('Test Summary');
  
  const hasOrphaned = syncStatus?.summary?.orphanedStatements > 0 || 
                      syncStatus?.summary?.orphanedFiles > 0;
  
  if (hasOrphaned) {
    log('⚠️ Orphaned records detected!', 'yellow');
    log('Run the cleanup script to remove orphaned records:', 'yellow');
    log('  node scripts/cleanup-orphaned-records.js --execute', 'dim');
  } else {
    log('✅ All records are properly synchronized!', 'green');
  }
  
  console.log('\nNext Steps:');
  console.log('1. Review the orphaned records above');
  console.log('2. Run cleanup in dry-run mode first:');
  console.log('   node scripts/cleanup-orphaned-records.js --dry-run');
  console.log('3. If everything looks good, execute the cleanup:');
  console.log('   node scripts/cleanup-orphaned-records.js --execute');
  console.log('4. Monitor the sync status regularly to prevent future issues');
}

// Run all tests
runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});