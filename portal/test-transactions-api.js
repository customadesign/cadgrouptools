const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testTransactionsAPI() {
  console.log('🔍 Testing Transactions API...\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
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
    
    const db = client.db();
    console.log('📊 Database:', db.databaseName);
    
    // Check collections
    const collections = await db.listCollections().toArray();
    console.log('📚 Collections:', collections.map(c => c.name).join(', '));
    console.log('');
    
    // Check transactions collection
    const transactionsCollection = db.collection('transactions');
    const transactionCount = await transactionsCollection.countDocuments();
    console.log('💰 Total Transactions in DB:', transactionCount);
    
    if (transactionCount > 0) {
      // Get a sample transaction
      const sampleTransaction = await transactionsCollection.findOne();
      console.log('\n📝 Sample Transaction:');
      console.log('  ID:', sampleTransaction._id);
      console.log('  Date:', sampleTransaction.txnDate);
      console.log('  Description:', sampleTransaction.description);
      console.log('  Amount:', sampleTransaction.amount);
      console.log('  Direction:', sampleTransaction.direction);
      console.log('  Statement ID:', sampleTransaction.statement);
      
      // Check if statement exists
      if (sampleTransaction.statement) {
        const statementsCollection = db.collection('statements');
        const statement = await statementsCollection.findOne({ _id: sampleTransaction.statement });
        if (statement) {
          console.log('  Statement Account:', statement.accountName);
          console.log('  Statement Bank:', statement.bankName);
        } else {
          console.log('  ❌ Statement not found!');
        }
      }
    }
    
    // Check statements collection
    const statementsCollection = db.collection('statements');
    const statementCount = await statementsCollection.countDocuments();
    console.log('\n📄 Total Statements in DB:', statementCount);
    
    if (statementCount > 0) {
      const sampleStatement = await statementsCollection.findOne();
      console.log('\n📋 Sample Statement:');
      console.log('  ID:', sampleStatement._id);
      console.log('  Account:', sampleStatement.accountName);
      console.log('  Bank:', sampleStatement.bankName);
      console.log('  Status:', sampleStatement.status);
      console.log('  Transactions Found:', sampleStatement.transactionsFound);
      console.log('  Transactions Imported:', sampleStatement.transactionsImported);
    }
    
    // Test the API endpoint logic
    console.log('\n🔍 Testing API Logic...');
    
    // Test with no filters
    const allTransactions = await transactionsCollection.find({}).limit(5).toArray();
    console.log('  Transactions without filters:', allTransactions.length);
    
    // Test with date filter (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactions = await transactionsCollection.find({
      txnDate: { $gte: thirtyDaysAgo }
    }).limit(5).toArray();
    console.log('  Recent transactions (last 30 days):', recentTransactions.length);
    
    // Test with specific statement
    if (sampleTransaction?.statement) {
      const statementTransactions = await transactionsCollection.find({
        statement: sampleTransaction.statement
      }).limit(5).toArray();
      console.log('  Transactions for specific statement:', statementTransactions.length);
    }
    
    await client.close();
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testTransactionsAPI();
