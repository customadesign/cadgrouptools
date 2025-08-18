const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function setupAccounts() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('cadgroupmgt');
    const accounts = db.collection('accounts');
    
    // Define the correct accounts
    const correctAccounts = [
      {
        name: 'Murphy Web Services - Bank Ozk',
        bankName: 'Bank Ozk',
        accountNumber: '8979',
        type: 'checking',
        status: 'active',
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'E Systems Management - Bank Ozk',
        bankName: 'Bank Ozk',
        accountNumber: '3633',
        type: 'checking',
        status: 'active',
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'MNM Secretarial Services Inc - Bank Ozk',
        bankName: 'Bank Ozk',
        accountNumber: '5883',
        type: 'checking',
        status: 'active',
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Murphy Web Services - Bluevine',
        bankName: 'Bluevine',
        accountNumber: '4281',
        type: 'checking',
        status: 'active',
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'E Systems Management - Bluevine',
        bankName: 'Bluevine',
        accountNumber: '4005',
        type: 'checking',
        status: 'active',
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // First, let's see what accounts currently exist
    const existingAccounts = await accounts.find({}).toArray();
    console.log('\nExisting accounts in database:');
    existingAccounts.forEach(acc => {
      console.log(`- ${acc.name} (${acc.bankName}) - ${acc.accountNumber || 'No number'}`);
    });
    
    // Clear existing accounts and insert correct ones
    console.log('\nClearing existing accounts...');
    await accounts.deleteMany({});
    
    console.log('Inserting correct accounts...');
    const result = await accounts.insertMany(correctAccounts);
    console.log(`✅ Inserted ${result.insertedCount} accounts`);
    
    // Verify the accounts were added
    const newAccounts = await accounts.find({}).toArray();
    console.log('\n✅ Accounts now in database:');
    newAccounts.forEach(acc => {
      console.log(`- ${acc.name} - ${acc.accountNumber}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

setupAccounts();