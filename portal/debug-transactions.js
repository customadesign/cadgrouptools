const { MongoClient } = require('mongodb');
require('dotenv').config();

async function debugTransactions() {
  console.log('🔍 Debugging Transaction Display Issue...\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
  console.log('DB_NAME:', process.env.DB_NAME || 'Not specified');
  console.log('');
  
  if (!process.env.MONGODB_URI) {
    console.log('❌ MONGODB_URI is not set. Please check your .env file.');
    return;
  }
  
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(process.env.DB_NAME || 'test');
    
    // Check collections
    console.log('📊 Database Collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => console.log(`  - ${col.name}`));
    console.log('');
    
    // Check transactions
    console.log('💰 Transaction Data:');
    const transactions = await db.collection('transactions').find({}).toArray();
    console.log(`Total transactions: ${transactions.length}`);
    
    if (transactions.length > 0) {
      console.log('\n📝 Sample Transaction:');
      console.log(JSON.stringify(transactions[0], null, 2));
      
      // Check statement references
      const statementIds = [...new Set(transactions.map(t => t.statement?.toString()))];
      console.log(`\n📄 Referenced Statements: ${statementIds.length}`);
      statementIds.forEach(id => console.log(`  - ${id}`));
      
      // Check statements collection
      console.log('\n📋 Statement Status:');
      for (const statementId of statementIds) {
        const statement = await db.collection('statements').findOne({ _id: new MongoClient.ObjectId(statementId) });
        if (statement) {
          console.log(`  Statement ${statementId}:`);
          console.log(`    Status: ${statement.status}`);
          console.log(`    Account: ${statement.accountName}`);
          console.log(`    Transactions Found: ${statement.transactionsFound}`);
          console.log(`    Transactions Imported: ${statement.transactionsImported}`);
        }
      }
    }
    
    // Test the query that the API uses
    console.log('\n🔍 Testing API Query:');
    const recentTransactions = await db.collection('transactions')
      .aggregate([
        {
          $lookup: {
            from: 'statements',
            localField: 'statement',
            foreignField: '_id',
            as: 'statementInfo'
          }
        },
        {
          $unwind: '$statementInfo'
        },
        {
          $sort: { txnDate: -1, createdAt: -1 }
        },
        {
          $limit: 10
        }
      ]).toArray();
    
    console.log(`API query returned: ${recentTransactions.length} transactions`);
    
    if (recentTransactions.length > 0) {
      console.log('\n📊 Formatted Transaction Sample:');
      const sample = recentTransactions[0];
      const formatted = {
        id: sample._id.toString(),
        date: sample.txnDate,
        description: sample.description,
        category: sample.category || 'Uncategorized',
        amount: sample.amount,
        type: sample.direction === 'credit' ? 'income' : 'expense',
        status: 'completed',
        account: sample.statementInfo?.accountName || 'Unknown Account',
        checkNo: sample.checkNo,
        balance: sample.balance,
      };
      console.log(JSON.stringify(formatted, null, 2));
    }
    
    await client.close();
    console.log('\n✅ Debug complete');
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

debugTransactions();
