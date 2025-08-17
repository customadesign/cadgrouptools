const { tesseractOCRService } = require('./src/lib/ocr-tesseract.ts');

// Test the bank statement parser with a sample that should have more than 9 transactions
function testOCRParsing() {
  console.log('🔍 Testing OCR Parsing Logic...\n');
  
  // Create a sample bank statement with many transactions
  const sampleText = `
CHASE BANK
Statement Period: 01/01/2024 - 01/31/2024
Account Number: ****1234

Previous Balance: $5,000.00

Transactions:
01/01/2024 GROCERY STORE PURCHASE 125.50 -
01/02/2024 DIRECT DEPOSIT PAYROLL 3,500.00 +
01/03/2024 UTILITY PAYMENT 285.75 -
01/04/2024 ATM WITHDRAWAL 200.00 -
01/05/2024 RESTAURANT PURCHASE 65.25 -
01/06/2024 GAS STATION 45.00 -
01/07/2024 ONLINE SHOPPING 89.99 -
01/08/2024 PHONE BILL 95.00 -
01/09/2024 COFFEE SHOP 12.50 -
01/10/2024 PARKING FEE 15.00 -
01/11/2024 MOVIE TICKETS 25.00 -
01/12/2024 BOOKSTORE 45.75 -
01/13/2024 DRY CLEANING 35.00 -
01/14/2024 PHARMACY 28.50 -
01/15/2024 HAIR SALON 75.00 -
01/16/2024 GYM MEMBERSHIP 50.00 -
01/17/2024 SUBSCRIPTION SERVICE 19.99 -
01/18/2024 PET SUPPLIES 45.25 -
01/19/2024 HARDWARE STORE 125.00 -
01/20/2024 BAKERY 18.75 -
01/21/2024 FLORIST 65.00 -
01/22/2024 CLEANING SERVICE 120.00 -
01/23/2024 INSURANCE PAYMENT 250.00 -
01/24/2024 TAX PAYMENT 500.00 -
01/25/2024 INVESTMENT CONTRIBUTION 1000.00 +
01/26/2024 INTEREST EARNED 15.50 +
01/27/2024 REFUND PROCESSED 89.99 +
01/28/2024 TRANSFER IN 500.00 +
01/29/2024 DIVIDEND PAYMENT 25.00 +
01/30/2024 CASHBACK REWARD 12.50 +
01/31/2024 MONTHLY FEE 12.00 -

Ending Balance: $7,823.50
  `;

  console.log('📝 Sample Text Length:', sampleText.length, 'characters');
  console.log('📊 Expected Transactions: 30+ (based on text content)\n');
  
  // Parse the bank statement
  console.log('🔍 Parsing Bank Statement...');
  const parsedData = tesseractOCRService.parseBankStatement(sampleText);
  
  console.log('\n📊 Parsing Results:');
  console.log('==================');
  console.log('Bank Name:', parsedData.bankName || 'Not found');
  console.log('Account Number:', parsedData.accountNumber || 'Not found');
  console.log('Period:', parsedData.period || 'Not found');
  console.log('Opening Balance:', parsedData.openingBalance || 'Not found');
  console.log('Closing Balance:', parsedData.closingBalance || 'Not found');
  console.log('\n💰 Transactions Found:', parsedData.transactions.length);
  
  if (parsedData.transactions.length > 0) {
    console.log('\n📝 Transaction Details:');
    parsedData.transactions.forEach((tx, i) => {
      console.log(`  ${i + 1}. ${tx.date} - ${tx.description} - $${tx.amount} (${tx.type})`);
    });
  }
  
  console.log('\n📈 Totals:');
  console.log('Total Debits:', parsedData.totalDebits || 0);
  console.log('Total Credits:', parsedData.totalCredits || 0);
  
  // Analyze the text line by line to see what's being matched
  console.log('\n🔍 Line-by-Line Analysis:');
  console.log('========================');
  const lines = sampleText.split('\n').filter(line => line.trim());
  console.log('Total lines:', lines.length);
  
  let transactionLines = 0;
  let matchedLines = 0;
  
  lines.forEach((line, i) => {
    if (line.match(/^\d{1,2}[\/\-]\d{1,2}/)) {
      transactionLines++;
      console.log(`  Line ${i + 1}: ${line.trim()}`);
      
      // Test if this line would match our patterns
      const patterns = [
        /^(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+(.+?)\s+([\d,]+\.?\d{2})\s*([+-]?)/,
        /^(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+(.+?)\s+([\d,]+\.?\d{2})\s+([\d,]+\.?\d{2})/,
        /(.+?)\s+([\d,]+\.?\d{2})\s*([+-]?)\s*(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/,
        /^(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+(.+?)\s+\$([\d,]+\.?\d{2})/,
      ];
      
      let matched = false;
      patterns.forEach((pattern, j) => {
        if (pattern.test(line)) {
          matched = true;
          console.log(`    ✅ Matches pattern ${j + 1}`);
        }
      });
      
      if (matched) {
        matchedLines++;
      } else {
        console.log(`    ❌ No pattern match`);
      }
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`Lines that look like transactions: ${transactionLines}`);
  console.log(`Lines that match our patterns: ${matchedLines}`);
  console.log(`Transactions actually extracted: ${parsedData.transactions.length}`);
  
  if (parsedData.transactions.length !== matchedLines) {
    console.log('\n⚠️  DISCREPANCY DETECTED!');
    console.log('The parser is not extracting all matching transactions.');
    console.log('This suggests there might be a limit or bug in the extraction logic.');
  }
}

// Run the test
testOCRParsing();
