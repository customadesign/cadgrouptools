const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkStatements() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('cadtools');
    const statements = db.collection('statements');
    
    // Count all statements
    const totalCount = await statements.countDocuments();
    console.log(`\nTotal statements in database: ${totalCount}`);
    
    // Get all statements
    const allStatements = await statements.find({}).toArray();
    
    console.log('\nAll statements:');
    allStatements.forEach(stmt => {
      console.log(`- ID: ${stmt._id}`);
      console.log(`  Account: ${stmt.accountName}`);
      console.log(`  Bank: ${stmt.bankName}`);
      console.log(`  Month/Year: ${stmt.month}/${stmt.year}`);
      console.log(`  Status: ${stmt.status}`);
      console.log('---');
    });
    
    // Check for the specific statement
    const targetId = '68a2c214cbd5e89a14d81326';
    const specificStatement = await statements.findOne({
      _id: new ObjectId(targetId)
    });
    
    if (specificStatement) {
      console.log('\nFound target statement:');
      console.log(JSON.stringify(specificStatement, null, 2));
    } else {
      console.log(`\nStatement with ID ${targetId} not found`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkStatements();
