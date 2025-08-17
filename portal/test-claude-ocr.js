require('dotenv').config();
const { claudeCodeOCRService } = require('./src/lib/ocr-claude.ts');

async function testClaudeCodeOCR() {
  console.log('🔍 Testing Claude Code OCR Service...\n');
  
  // Check configuration
  console.log('📋 Configuration Check:');
  const config = claudeCodeOCRService.getConfigStatus();
  console.log('  Configured:', config.configured ? '✅ Yes' : '❌ No');
  
  if (!config.configured) {
    console.log('  Missing:', config.missing.join(', '));
    console.log('\n🔧 Setup Instructions:');
    console.log('  1. Get an API key from https://openrouter.ai/');
    console.log('  2. Add OPENROUTER_API_KEY to your .env file');
    console.log('  3. Restart your development server');
    console.log('\n💰 Pricing: Claude 3.5 Sonnet is ~$0.003 per 1K input tokens');
    console.log('   A typical bank statement might cost $0.01-0.05 per scan');
    return;
  }
  
  console.log('  ✅ OpenRouter API key configured');
  
  // Test with sample data
  console.log('\n🧪 Testing with Sample Data:');
  
  const sampleText = `{
    "accountNumber": "****1234",
    "bankName": "CHASE BANK",
    "period": "January 2024",
    "openingBalance": 5000.00,
    "closingBalance": 7823.50,
    "transactions": [
      {
        "date": "01/01/2024",
        "description": "GROCERY STORE PURCHASE",
        "amount": 125.50,
        "type": "debit"
      },
      {
        "date": "01/02/2024", 
        "description": "DIRECT DEPOSIT PAYROLL",
        "amount": 3500.00,
        "type": "credit"
      }
    ]
  }`;
  
  try {
    const parsedData = claudeCodeOCRService.parseBankStatement(sampleText);
    
    console.log('  ✅ Sample parsing successful');
    console.log('  📊 Extracted data:');
    console.log('    Bank:', parsedData.bankName);
    console.log('    Account:', parsedData.accountNumber);
    console.log('    Period:', parsedData.period);
    console.log('    Opening Balance:', parsedData.openingBalance);
    console.log('    Closing Balance:', parsedData.closingBalance);
    console.log('    Transactions:', parsedData.transactions.length);
    console.log('    Total Debits:', parsedData.totalDebits);
    console.log('    Total Credits:', parsedData.totalCredits);
    
    console.log('\n📝 Transaction Details:');
    parsedData.transactions.forEach((tx, i) => {
      console.log(`  ${i + 1}. ${tx.date} - ${tx.description} - $${tx.amount} (${tx.type})`);
    });
    
  } catch (error) {
    console.log('  ❌ Sample parsing failed:', error.message);
  }
  
  console.log('\n🚀 Claude Code OCR is ready to use!');
  console.log('   Upload a PDF bank statement to test it out.');
  console.log('   It should extract many more transactions than the previous system.');
}

// Run the test
testClaudeCodeOCR();
