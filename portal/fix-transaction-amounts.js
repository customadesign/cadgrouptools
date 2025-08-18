// Script to fix transaction amounts that appear to be incorrectly parsed
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

async function fixTransactionAmounts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    console.log('Connected successfully to MongoDB');

    const Transaction = mongoose.model('Transaction', TransactionSchema);

    // Find transactions with unreasonably large amounts (likely parsing errors)
    const problematicTransactions = await Transaction.find({
      $or: [
        { amount: { $gte: 1000000 } }, // Amounts >= $1 million
      ]
    }).limit(10);

    console.log(`\nFound ${problematicTransactions.length} transactions with potentially incorrect amounts:`);
    
    for (const txn of problematicTransactions) {
      console.log(`\nTransaction ID: ${txn._id}`);
      console.log(`  Description: ${txn.description}`);
      console.log(`  Current Amount: $${txn.amount.toLocaleString()}`);
      
      // Try to fix the amount by dividing by 100 (cents to dollars conversion)
      const fixedAmount = txn.amount / 100;
      
      // Only fix if the result seems reasonable (< $100,000)
      if (fixedAmount < 100000) {
        console.log(`  Proposed Fixed Amount: $${fixedAmount.toFixed(2)}`);
        
        // Update the transaction
        await Transaction.updateOne(
          { _id: txn._id },
          { $set: { amount: fixedAmount } }
        );
        console.log(`  ✓ Fixed!`);
      } else {
        // Try dividing by 10000 (common OCR error)
        const alternativeFixed = txn.amount / 10000;
        if (alternativeFixed < 10000) {
          console.log(`  Alternative Fixed Amount: $${alternativeFixed.toFixed(2)}`);
          
          // Update the transaction
          await Transaction.updateOne(
            { _id: txn._id },
            { $set: { amount: alternativeFixed } }
          );
          console.log(`  ✓ Fixed with alternative calculation!`);
        } else {
          console.log(`  ✗ Amount too large even after adjustment, needs manual review`);
        }
      }
    }

    // Get updated statistics
    const totalCount = await Transaction.countDocuments({});
    const largeAmountCount = await Transaction.countDocuments({ amount: { $gte: 1000000 } });
    
    console.log(`\n\nSummary:`);
    console.log(`Total transactions: ${totalCount}`);
    console.log(`Remaining transactions with amounts >= $1M: ${largeAmountCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixTransactionAmounts();