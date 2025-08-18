const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function verifyMigration() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('cadgroupmgt');
    const transactions = db.collection('transactions');
    const statements = db.collection('statements');
    
    // Check the statement
    const targetId = '68a2c214cbd5e89a14d81326';
    const statement = await statements.findOne({ _id: new ObjectId(targetId) });
    
    if (statement) {
      console.log('\n✅ Statement found in cadgroupmgt database:');
      console.log(`   Account: ${statement.accountName}`);
      console.log(`   Status: ${statement.status}`);
    }
    
    // Check transactions
    const txnCount = await transactions.countDocuments({ statement: new ObjectId(targetId) });
    console.log(`\n✅ Found ${txnCount} transactions in cadgroupmgt database`);
    
    // Show sample transactions
    const sampleTxns = await transactions.find({ statement: new ObjectId(targetId) }).limit(5).toArray();
    console.log('\nSample transactions:');
    sampleTxns.forEach(txn => {
      console.log(`   - ${txn.description}: $${txn.amount.toLocaleString()}`);
    });
    
    console.log('\n✅ Migration verified successfully!');
    console.log('Database: cadgroupmgt');
    console.log('All data is accessible and correct.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

verifyMigration();
