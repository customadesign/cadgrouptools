// Debug the regex patterns to see why transactions aren't being extracted
function debugRegexPatterns() {
  console.log('🔍 Debugging Regex Patterns...\n');
  
  // Test transaction line
  const testLine = "01/01/2024 GROCERY STORE PURCHASE 125.50 -";
  console.log('Test Line:', testLine);
  console.log('');
  
  // Define the patterns from the OCR service
  const transactionPatterns = [
    // Pattern 1: Standard: MM/DD or MM/DD/YY or MM/DD/YYYY followed by description and amount
    /^(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+(.+?)\s+([\d,]+\.?\d{2})\s*([+-]?)/,
    // Pattern 2: With balance: date, description, amount, balance
    /^(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+(.+?)\s+([\d,]+\.?\d{2})\s+([\d,]+\.?\d{2})/,
    // Pattern 3: Alternative format: date at end
    /(.+?)\s+([\d,]+\.?\d{2})\s*([+-]?)\s*(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/,
    // Pattern 4: Amount with dollar sign
    /^(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+(.+?)\s+\$([\d,]+\.?\d{2})/,
  ];
  
  console.log('Testing each pattern:');
  console.log('=====================');
  
  transactionPatterns.forEach((pattern, index) => {
    console.log(`\nPattern ${index + 1}: ${pattern.source}`);
    
    const match = testLine.match(pattern);
    if (match) {
      console.log(`  ✅ MATCHED!`);
      console.log(`  Groups:`, match);
      console.log(`  Group 1 (date): "${match[1]}"`);
      console.log(`  Group 2 (description): "${match[2]}"`);
      console.log(`  Group 3 (amount): "${match[3]}"`);
      console.log(`  Group 4 (sign): "${match[4]}"`);
      
      // Test the pattern.source.includes logic
      const hasAlternativeFormat = pattern.source.includes('(.+?)\\s+(');
      console.log(`  Alternative format check: ${hasAlternativeFormat}`);
      
      if (hasAlternativeFormat) {
        console.log(`  Using alternative format: [description, amount, sign, date]`);
        const [, description, amountStr, sign, date] = match;
        console.log(`    Description: "${description}"`);
        console.log(`    Amount: "${amountStr}"`);
        console.log(`    Sign: "${sign}"`);
        console.log(`    Date: "${date}"`);
      } else {
        console.log(`  Using standard format: [date, description, amount, sign]`);
        const [, date, description, amountStr, sign] = match;
        console.log(`    Date: "${date}"`);
        console.log(`    Description: "${description}"`);
        console.log(`    Amount: "${amountStr}"`);
        console.log(`    Sign: "${sign}"`);
      }
    } else {
      console.log(`  ❌ NO MATCH`);
    }
  });
  
  // Test with a few more lines to see the pattern
  console.log('\n\n🔍 Testing Multiple Lines:');
  console.log('==========================');
  
  const testLines = [
    "01/01/2024 GROCERY STORE PURCHASE 125.50 -",
    "01/02/2024 DIRECT DEPOSIT PAYROLL 3,500.00 +",
    "01/03/2024 UTILITY PAYMENT 285.75 -",
    "01/04/2024 ATM WITHDRAWAL 200.00 -",
    "01/05/2024 RESTAURANT PURCHASE 65.25 -"
  ];
  
  testLines.forEach((line, i) => {
    console.log(`\nLine ${i + 1}: "${line}"`);
    const match = line.match(transactionPatterns[0]); // Use first pattern
    if (match) {
      console.log(`  ✅ Matches pattern 1`);
      const [, date, description, amountStr, sign] = match;
      console.log(`    Date: "${date}"`);
      console.log(`    Description: "${description}"`);
      console.log(`    Amount: "${amountStr}"`);
      console.log(`    Sign: "${sign}"`);
      
      // Test the validation logic
      const amount = parseFloat(amountStr.replace(/[$,]/g, ''));
      console.log(`    Parsed amount: ${amount}`);
      console.log(`    Is valid: ${!isNaN(amount) && date && description}`);
      
      // Test the transaction type logic
      let type = 'debit';
      if (sign === '+') {
        type = 'credit';
      } else if (sign === '-') {
        type = 'debit';
      } else {
        const creditKeywords = /deposit|credit|payment\s+received|refund|transfer\s+in|interest/i;
        const debitKeywords = /withdrawal|debit|payment|purchase|fee|charge|transfer\s+out/i;
        
        if (creditKeywords.test(description)) {
          type = 'credit';
        } else if (debitKeywords.test(description)) {
          type = 'debit';
        }
      }
      console.log(`    Transaction type: ${type}`);
      
    } else {
      console.log(`  ❌ No match`);
    }
  });
}

// Run the debug
debugRegexPatterns();
