#!/usr/bin/env ts-node

/**
 * Test script for OCR functionality
 * Usage: ts-node src/scripts/test-ocr.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { tesseractOCRService } from '../lib/ocr-tesseract';

async function testOCR() {
  console.log('=== OCR Test Script ===\n');

  // Test with a sample PDF buffer (you can replace this with an actual file)
  const testPdfPath = process.argv[2];
  
  if (!testPdfPath) {
    console.log('Usage: ts-node src/scripts/test-ocr.ts <path-to-pdf-or-image>');
    console.log('\nTesting with mock data instead...\n');
    
    // Test the parsing functionality with sample text
    const sampleText = `
CHASE BANK
Statement Period: 01/01/2024 - 01/31/2024
Account Number: ****1234

Previous Balance: $5,000.00

Transactions:
01/05/2024 GROCERY STORE PURCHASE 125.50 -
01/10/2024 DIRECT DEPOSIT PAYROLL 3,500.00 +
01/15/2024 UTILITY PAYMENT 285.75 -
01/20/2024 ATM WITHDRAWAL 200.00 -
01/25/2024 RESTAURANT PURCHASE 65.25 -

Ending Balance: $7,823.50
    `;

    console.log('Testing bank statement parser with sample text...');
    const parsedData = tesseractOCRService.parseBankStatement(sampleText);
    
    console.log('\nParsed Data:');
    console.log('-------------');
    console.log('Bank Name:', parsedData.bankName || 'Not found');
    console.log('Account Number:', parsedData.accountNumber || 'Not found');
    console.log('Period:', parsedData.period || 'Not found');
    console.log('Opening Balance:', parsedData.openingBalance || 'Not found');
    console.log('Closing Balance:', parsedData.closingBalance || 'Not found');
    console.log('\nTransactions Found:', parsedData.transactions.length);
    
    if (parsedData.transactions.length > 0) {
      console.log('\nTransaction Details:');
      parsedData.transactions.forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.date} - ${tx.description} - $${tx.amount} (${tx.type})`);
      });
    }
    
    console.log('\nTotal Debits:', parsedData.totalDebits || 0);
    console.log('Total Credits:', parsedData.totalCredits || 0);
    
    return;
  }

  // Test with actual file
  if (!fs.existsSync(testPdfPath)) {
    console.error(`File not found: ${testPdfPath}`);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(testPdfPath);
  const ext = path.extname(testPdfPath).toLowerCase();
  
  let mimeType = 'application/pdf';
  if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
  else if (ext === '.png') mimeType = 'image/png';
  else if (ext === '.tiff' || ext === '.tif') mimeType = 'image/tiff';

  console.log(`Testing OCR with file: ${testPdfPath}`);
  console.log(`File type: ${mimeType}`);
  console.log(`File size: ${(fileBuffer.length / 1024).toFixed(2)} KB\n`);

  try {
    console.log('Extracting text...');
    const result = await tesseractOCRService.extractTextFromImage(fileBuffer, mimeType);
    
    if (result.error) {
      console.error('OCR Error:', result.error);
      process.exit(1);
    }

    console.log('\nOCR Result:');
    console.log('------------');
    console.log('Provider:', result.provider);
    console.log('Confidence:', result.confidence ? `${result.confidence.toFixed(2)}%` : 'N/A');
    console.log('Text length:', result.text.length, 'characters');
    console.log('\nFirst 500 characters of extracted text:');
    console.log(result.text.substring(0, 500) + '...\n');

    // Parse the extracted text
    console.log('Parsing bank statement data...');
    const parsedData = tesseractOCRService.parseBankStatement(result.text);
    
    console.log('\nParsed Bank Statement:');
    console.log('----------------------');
    console.log('Bank Name:', parsedData.bankName || 'Not found');
    console.log('Account Number:', parsedData.accountNumber || 'Not found');
    console.log('Period:', parsedData.period || 'Not found');
    console.log('Opening Balance:', parsedData.openingBalance || 'Not found');
    console.log('Closing Balance:', parsedData.closingBalance || 'Not found');
    console.log('\nTransactions Found:', parsedData.transactions.length);
    
    if (parsedData.transactions.length > 0) {
      console.log('\nFirst 5 transactions:');
      parsedData.transactions.slice(0, 5).forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.date} - ${tx.description} - $${tx.amount} (${tx.type})`);
      });
    }
    
    console.log('\nTotal Debits:', parsedData.totalDebits || 0);
    console.log('Total Credits:', parsedData.totalCredits || 0);

    // Clean up
    await tesseractOCRService.terminate();
    console.log('\n✓ OCR test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    await tesseractOCRService.terminate();
    process.exit(1);
  }
}

// Run the test
testOCR().catch(console.error);