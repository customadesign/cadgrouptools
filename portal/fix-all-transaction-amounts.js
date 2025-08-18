// Comprehensive script to fix all transaction amounts
const mongoose = require('mongoose');

// MongoDB connection settings
const MONGODB_URI = 'mongodb+srv://marketing:TaNN6bttM920rEjL@cadtools.dvvdsg1.mongodb.net/?retryWrites=true&w=majority&appName=cadtools';
const DB_NAME = 'cadtools';

const TransactionSchema = new mongoose.Schema({
  statement: { type: mongoose.Types.ObjectId, ref: 'Statement' },
  txnDate: Date,
  description: String,
  amount: Number,
  direction: String,
  checkNo: String,
  balance: Number,
  category: String,
  confidence: Number,
}, { collection: 'transactions' });

function analyzeAndFixAmount(amount, description) {
  // Common patterns for different transaction types
  const patterns = {
    // Payments and transfers usually in hundreds or thousands
    payment: /PAYMENT|PYMT|TRANSFER|STRIPE|PAYPAL|VENMO|ZELLE/i,
    // Credit card payments can be larger
    creditCard: /CHASE|CREDIT|CRD|VISA|MASTERCARD|AMEX/i,
    // Small recurring charges
    subscription: /INTUIT|QUICKBOOKS|ADOBE|NETFLIX|SPOTIFY|GOOGLE|APPLE/i,
    // Utilities and services
    utility: /ELECTRIC|GAS|WATER|INTERNET|PHONE|VERIZON|ATT|COMCAST/i,
  };

  // Determine transaction type
  let transactionType = 'unknown';
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(description)) {
      transactionType = type;
      break;
    }
  }

  // Fix amount based on type and magnitude
  let fixedAmount = amount;
  
  // If amount is greater than $10,000, it's likely a parsing error
  if (amount > 10000) {
    // Try different divisors based on the magnitude
    const divisors = [100, 1000, 10000, 100000, 1000000];
    
    for (const divisor of divisors) {
      const testAmount = amount / divisor;
      
      // Check if the result is reasonable based on transaction type
      let maxReasonable = 10000; // Default max
      
      switch (transactionType) {
        case 'subscription':
          maxReasonable = 500; // Subscriptions rarely exceed $500
          break;
        case 'utility':
          maxReasonable = 1000; // Utilities rarely exceed $1000
          break;
        case 'payment':
          maxReasonable = 50000; // Payments can be larger
          break;
        case 'creditCard':
          maxReasonable = 20000; // Credit card payments can be substantial
          break;
      }
      
      if (testAmount > 0.01 && testAmount <= maxReasonable) {
        fixedAmount = testAmount;
        break;
      }
    }
  }
  
  // Round to 2 decimal places
  fixedAmount = Math.round(fixedAmount * 100) / 100;
  
  return {
    original: amount,
    fixed: fixedAmount,
    type: transactionType,
    needsFix: amount !== fixedAmount
  };
}

async function fixAllTransactionAmounts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    console.log('Connected successfully to MongoDB\n');

    const Transaction = mongoose.model('Transaction', TransactionSchema);

    // Get all transactions
    const allTransactions = await Transaction.find({});
    console.log(`Processing ${allTransactions.length} transactions...\n`);

    let fixedCount = 0;
    let skippedCount = 0;
    const fixes = [];

    for (const txn of allTransactions) {
      const result = analyzeAndFixAmount(txn.amount, txn.description);
      
      if (result.needsFix) {
        console.log(`Fixing: ${txn.description}`);
        console.log(`  Type: ${result.type}`);
        console.log(`  Original: $${result.original.toLocaleString()}`);
        console.log(`  Fixed: $${result.fixed.toFixed(2)}`);
        
        // Update the transaction
        await Transaction.updateOne(
          { _id: txn._id },
          { $set: { amount: result.fixed } }
        );
        
        fixedCount++;
        fixes.push({
          description: txn.description,
          original: result.original,
          fixed: result.fixed
        });
        console.log('  ✓ Updated\n');
      } else {
        skippedCount++;
      }
    }

    // Get updated statistics
    const updatedStats = await Transaction.aggregate([
      {
        $group: {
          _id: '$direction',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' }
        }
      }
    ]);

    console.log('\n=== SUMMARY ===');
    console.log(`Total transactions processed: ${allTransactions.length}`);
    console.log(`Transactions fixed: ${fixedCount}`);
    console.log(`Transactions unchanged: ${skippedCount}`);
    
    console.log('\n=== UPDATED STATISTICS ===');
    for (const stat of updatedStats) {
      console.log(`\n${stat._id.toUpperCase()} transactions:`);
      console.log(`  Count: ${stat.count}`);
      console.log(`  Total: $${stat.totalAmount.toFixed(2)}`);
      console.log(`  Average: $${stat.avgAmount.toFixed(2)}`);
      console.log(`  Min: $${stat.minAmount.toFixed(2)}`);
      console.log(`  Max: $${stat.maxAmount.toFixed(2)}`);
    }

    // Show some of the largest remaining amounts for review
    const largeAmounts = await Transaction.find({ amount: { $gte: 10000 } })
      .sort({ amount: -1 })
      .limit(5);
    
    if (largeAmounts.length > 0) {
      console.log('\n=== LARGEST REMAINING AMOUNTS (may need manual review) ===');
      for (const txn of largeAmounts) {
        console.log(`$${txn.amount.toFixed(2)} - ${txn.description}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixAllTransactionAmounts();