#!/usr/bin/env node

/**
 * Test OCR functionality locally
 * Usage: node scripts/test-ocr-local.js [path-to-pdf-or-image]
 */

const fs = require('fs');
const path = require('path');

// Test the Tesseract OCR service
async function testOCR() {
  console.log('🔍 Testing OCR Service...\n');

  try {
    // Import the OCR service
    const { tesseractOCRService } = await import('../src/lib/ocr-tesseract.ts');

    // Get test file path from command line or use a default
    const testFilePath = process.argv[2];
    
    if (!testFilePath) {
      console.log('Usage: node scripts/test-ocr-local.js [path-to-pdf-or-image]');
      console.log('\nExample:');
      console.log('  node scripts/test-ocr-local.js ~/Downloads/bank-statement.pdf');
      console.log('  node scripts/test-ocr-local.js ~/Downloads/statement-scan.jpg');
      process.exit(1);
    }

    // Check if file exists
    if (!fs.existsSync(testFilePath)) {
      console.error(`❌ File not found: ${testFilePath}`);
      process.exit(1);
    }

    // Read the file
    const buffer = fs.readFileSync(testFilePath);
    const fileName = path.basename(testFilePath);
    const ext = path.extname(fileName).toLowerCase();

    // Determine MIME type
    let mimeType = 'application/octet-stream';
    if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.tiff' || ext === '.tif') mimeType = 'image/tiff';

    console.log(`📄 Testing file: ${fileName}`);
    console.log(`📦 File size: ${(buffer.length / 1024).toFixed(2)} KB`);
    console.log(`🎯 MIME type: ${mimeType}`);
    console.log('\n⏳ Processing with Tesseract OCR...\n');

    // Test OCR extraction
    const startTime = Date.now();
    const result = await tesseractOCRService.extractTextFromImage(buffer, mimeType);
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    if (result.error) {
      console.error(`❌ OCR Error: ${result.error}`);
      process.exit(1);
    }

    console.log(`✅ OCR completed in ${processingTime} seconds`);
    console.log(`📊 Provider: ${result.provider}`);
    if (result.confidence) {
      console.log(`🎯 Confidence: ${result.confidence.toFixed(2)}%`);
    }
    console.log(`📝 Extracted ${result.text.length} characters`);

    // Show first 500 characters of extracted text
    console.log('\n--- First 500 characters of extracted text ---');
    console.log(result.text.substring(0, 500));
    console.log('...\n');

    // Test parsing if it's a bank statement
    console.log('🏦 Attempting to parse as bank statement...\n');
    const statementData = tesseractOCRService.parseBankStatement(result.text);

    console.log('--- Parsed Bank Statement Data ---');
    console.log(`Bank Name: ${statementData.bankName || 'Not detected'}`);
    console.log(`Account Number: ${statementData.accountNumber || 'Not detected'}`);
    console.log(`Period: ${statementData.period || 'Not detected'}`);
    console.log(`Opening Balance: ${statementData.openingBalance || 'Not detected'}`);
    console.log(`Closing Balance: ${statementData.closingBalance || 'Not detected'}`);
    console.log(`Transactions Found: ${statementData.transactions.length}`);

    if (statementData.transactions.length > 0) {
      console.log('\n--- First 5 Transactions ---');
      statementData.transactions.slice(0, 5).forEach((txn, index) => {
        console.log(`${index + 1}. ${txn.date} | ${txn.description} | $${txn.amount} (${txn.type})`);
      });
    }

    console.log('\n✅ OCR test completed successfully!');

    // Clean up
    await tesseractOCRService.terminate();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testOCR().catch(console.error);