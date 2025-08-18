const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function verifyAccounts() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('cadgroupmgt');
    const accounts = db.collection('accounts');
    const statements = db.collection('statements');
    
    // Get all accounts
    const allAccounts = await accounts.find({}).toArray();
    console.log('\n✅ Accounts in database:');
    console.log('=' .repeat(60));
    allAccounts.forEach(acc => {
      console.log(`📦 ${acc.name}`);
      console.log(`   Bank: ${acc.bankName}`);
      console.log(`   Account #: ${acc.accountNumber}`);
      console.log(`   Type: ${acc.type}`);
      console.log(`   Status: ${acc.status}`);
      console.log('');
    });
    
    // Check which accounts have statements
    console.log('📊 Statements by Account:');
    console.log('=' .repeat(60));
    
    for (const account of allAccounts) {
      const stmtCount = await statements.countDocuments({ 
        accountName: { $regex: account.name.split(' - ')[0], $options: 'i' }
      });
      console.log(`${account.name}: ${stmtCount} statement(s)`);
    }
    
    // Expected accounts
    const expectedAccounts = [
      'Murphy Web Services - Bank Ozk 8979',
      'E Systems Management - Bank Ozk 3633',
      'MNM Secretarial Services Inc - Bank Ozk 5883',
      'Murphy Web Services - Bluevine 4281',
      'E Systems Management - Bluevine 4005'
    ];
    
    console.log('\n✅ Verification:');
    console.log('=' .repeat(60));
    expectedAccounts.forEach(expected => {
      const found = allAccounts.some(acc => 
        `${acc.name} ${acc.accountNumber}` === expected ||
        acc.name === expected.split(' ').slice(0, -1).join(' ')
      );
      console.log(`${found ? '✅' : '❌'} ${expected}`);
    });
    
    if (allAccounts.length === 5) {
      console.log('\n✅ All 5 expected accounts are configured correctly!');
    } else {
      console.log(`\n⚠️  Found ${allAccounts.length} accounts, expected 5`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

verifyAccounts();