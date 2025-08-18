const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkTransactionAmounts() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('cadtools');
    const transactions = db.collection('transactions');
    
    // Find transactions for the specific statement
    const statementId = new ObjectId('68a2c214cbd5e89a14d81326');
    const results = await transactions.find({
      statement: statementId
    }).limit(10).toArray();
    
    console.log('\nSample of transactions:');
    results.forEach(txn => {
      const desc = txn.description ? txn.description.slice(0, 50) : 'No description';
      console.log(`- ${desc}: $${txn.amount.toLocaleString()}`);
    });
    
    // Check for extreme amounts
    const extremeAmounts = await transactions.find({
      statement: statementId,
      amount: { $gt: 100000 }  // Over 100k
    }).toArray();
    
    console.log(`\nFound ${extremeAmounts.length} transactions over $100,000`);
    if (extremeAmounts.length > 0) {
      console.log('Extreme amounts that need fixing:');
      extremeAmounts.slice(0, 10).forEach(txn => {
        const desc = txn.description ? txn.description.slice(0, 40) : 'No description';
        const suggestedAmount = txn.amount / 1000000; // Divide by million to get thousands
        console.log(`- ${desc}: $${txn.amount.toLocaleString()} -> Suggested: $${suggestedAmount.toFixed(2)}`);
      });
    }
    
    // Get statistics
    const stats = await transactions.aggregate([
      { $match: { statement: statementId } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' }
        }
      }
    ]).toArray();
    
    if (stats.length > 0) {
      console.log('\nTransaction Statistics:');
      console.log(`- Total transactions: ${stats[0].count}`);
      console.log(`- Total amount: $${stats[0].totalAmount.toLocaleString()}`);
      console.log(`- Average amount: $${stats[0].avgAmount.toLocaleString()}`);
      console.log(`- Max amount: $${stats[0].maxAmount.toLocaleString()}`);
      console.log(`- Min amount: $${stats[0].minAmount.toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkTransactionAmounts();
