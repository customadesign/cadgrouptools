const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkAllTransactions() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('cadtools');
    const transactions = db.collection('transactions');
    
    // Count all transactions
    const totalCount = await transactions.countDocuments();
    console.log(`\nTotal transactions in database: ${totalCount}`);
    
    // Get sample of ALL transactions
    const allTransactions = await transactions.find({}).limit(20).toArray();
    
    console.log('\nSample of ALL transactions:');
    allTransactions.forEach(txn => {
      const desc = txn.description ? txn.description.slice(0, 40) : 'No description';
      const statementInfo = txn.statement ? txn.statement.toString() : 'No statement';
      console.log(`- ${desc}: $${txn.amount} | Statement: ${statementInfo}`);
    });
    
    // Check for transactions with extreme amounts
    const extremeTransactions = await transactions.find({
      amount: { $gt: 1000000 }  // Over 1 million
    }).toArray();
    
    console.log(`\nFound ${extremeTransactions.length} transactions over $1,000,000`);
    
    if (extremeTransactions.length > 0) {
      console.log('\nFirst 10 extreme transactions:');
      extremeTransactions.slice(0, 10).forEach(txn => {
        const desc = txn.description ? txn.description.slice(0, 40) : 'No description';
        console.log(`- ${desc}: $${txn.amount.toLocaleString()}`);
      });
    }
    
    // Check for the specific statement
    const targetStatement = '68a2c214cbd5e89a14d81326';
    const withStringStatement = await transactions.find({
      statement: targetStatement
    }).limit(5).toArray();
    
    const withObjectIdStatement = await transactions.find({
      statement: new ObjectId(targetStatement)
    }).limit(5).toArray();
    
    console.log(`\nTransactions with statement as string: ${withStringStatement.length}`);
    console.log(`Transactions with statement as ObjectId: ${withObjectIdStatement.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkAllTransactions();
