const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkTestDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Check test database collections
    const db = client.db('test');
    const collections = await db.listCollections().toArray();
    
    console.log('\nCollections in test database:');
    for (const coll of collections) {
      const collection = db.collection(coll.name);
      const count = await collection.countDocuments();
      console.log(`- ${coll.name}: ${count} documents`);
      
      // If it's statements or transactions, show sample
      if (coll.name === 'statements' || coll.name === 'transactions') {
        const samples = await collection.find({}).limit(3).toArray();
        console.log(`  Sample documents:`);
        samples.forEach(doc => {
          console.log(`    - ${JSON.stringify(doc).substring(0, 100)}...`);
        });
      }
    }
    
    // Check for specific statement in test database
    const targetId = '68a2c214cbd5e89a14d81326';
    const statements = db.collection('statements');
    const transactions = db.collection('transactions');
    
    try {
      const stmt = await statements.findOne({ _id: new ObjectId(targetId) });
      if (stmt) {
        console.log(`\nFound statement ${targetId} in test database!`);
        console.log(`Account: ${stmt.accountName}, Status: ${stmt.status}`);
        
        // Count related transactions
        const txnCount = await transactions.countDocuments({ statement: new ObjectId(targetId) });
        console.log(`Related transactions: ${txnCount}`);
        
        // Show sample transactions
        const sampleTxns = await transactions.find({ statement: new ObjectId(targetId) }).limit(5).toArray();
        console.log('\nSample transactions:');
        sampleTxns.forEach(txn => {
          console.log(`- ${txn.description}: $${txn.amount}`);
        });
      }
    } catch (e) {
      console.log(`Statement ${targetId} not found in test database`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkTestDatabase();