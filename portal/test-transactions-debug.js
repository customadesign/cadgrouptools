// Debug script to check transactions in MongoDB
const mongoose = require('mongoose');

// MongoDB connection settings
const MONGODB_URI = 'mongodb+srv://marketing:TaNN6bttM920rEjL@cadtools.dvvdsg1.mongodb.net/?retryWrites=true&w=majority&appName=cadtools';
const DB_NAME = 'cadtools';

// Define schemas
const StatementSchema = new mongoose.Schema({
  accountName: String,
  bankName: String,
  month: Number,
  year: Number,
  status: String,
  transactionsFound: Number,
  transactionsImported: Number,
}, { collection: 'statements' });

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

async function debugTransactions() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    console.log('Connected successfully to MongoDB');

    const Statement = mongoose.model('Statement', StatementSchema);
    const Transaction = mongoose.model('Transaction', TransactionSchema);

    // Check the specific statement
    const statementId = '68a2c214cbd5e89a14d81326';
    console.log(`\n1. Checking statement with ID: ${statementId}`);
    
    const statement = await Statement.findById(statementId);
    if (statement) {
      console.log('Statement found:');
      console.log('  - Account:', statement.accountName);
      console.log('  - Bank:', statement.bankName);
      console.log('  - Period:', `${statement.month}/${statement.year}`);
      console.log('  - Status:', statement.status);
      console.log('  - Transactions Found:', statement.transactionsFound);
      console.log('  - Transactions Imported:', statement.transactionsImported);
    } else {
      console.log('Statement NOT found!');
    }

    // Check for transactions linked to this statement
    console.log(`\n2. Checking transactions for statement ID: ${statementId}`);
    const transactions = await Transaction.find({ 
      statement: new mongoose.Types.ObjectId(statementId) 
    }).limit(5);
    
    console.log(`Found ${transactions.length} transactions`);
    if (transactions.length > 0) {
      console.log('\nFirst 5 transactions:');
      transactions.forEach((txn, index) => {
        console.log(`\n  Transaction ${index + 1}:`);
        console.log(`    - Date: ${txn.txnDate}`);
        console.log(`    - Description: ${txn.description}`);
        console.log(`    - Amount: $${txn.amount}`);
        console.log(`    - Direction: ${txn.direction}`);
        console.log(`    - Category: ${txn.category || 'None'}`);
      });
    }

    // Check total count of transactions for this statement
    const totalCount = await Transaction.countDocuments({ 
      statement: new mongoose.Types.ObjectId(statementId) 
    });
    console.log(`\n3. Total transactions for this statement: ${totalCount}`);

    // Check if there are ANY transactions in the database
    console.log('\n4. Checking total transactions in database:');
    const totalTransactions = await Transaction.countDocuments({});
    console.log(`Total transactions in database: ${totalTransactions}`);

    // Get a sample of recent transactions
    if (totalTransactions > 0) {
      console.log('\n5. Sample of recent transactions (any statement):');
      const recentTransactions = await Transaction.find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('statement', 'accountName bankName');
      
      recentTransactions.forEach((txn, index) => {
        console.log(`\n  Recent Transaction ${index + 1}:`);
        console.log(`    - Statement ID: ${txn.statement?._id || txn.statement}`);
        console.log(`    - Account: ${txn.statement?.accountName || 'N/A'}`);
        console.log(`    - Date: ${txn.txnDate}`);
        console.log(`    - Description: ${txn.description}`);
        console.log(`    - Amount: $${txn.amount}`);
      });
    }

    // Check all statements with transaction counts
    console.log('\n6. Checking all statements with transaction counts:');
    const statementsWithCounts = await Statement.find({})
      .select('accountName bankName month year status transactionsFound transactionsImported')
      .sort({ createdAt: -1 })
      .limit(5);
    
    for (const stmt of statementsWithCounts) {
      const txnCount = await Transaction.countDocuments({ statement: stmt._id });
      console.log(`\n  Statement: ${stmt.accountName} - ${stmt.month}/${stmt.year}`);
      console.log(`    - ID: ${stmt._id}`);
      console.log(`    - Status: ${stmt.status}`);
      console.log(`    - Transactions Found: ${stmt.transactionsFound || 0}`);
      console.log(`    - Transactions Imported: ${stmt.transactionsImported || 0}`);
      console.log(`    - Actual Transactions in DB: ${txnCount}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugTransactions();