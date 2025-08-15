import { connectToDatabase } from '../lib/db';
import { Account } from '../models/Account';

const accounts = [
  {
    name: 'Murphy Web Services',
    bankName: 'Bank Ozk',
    accountNumber: '8979',
    type: 'checking',
    status: 'active',
  },
  {
    name: 'E Systems Management',
    bankName: 'Bank Ozk',
    accountNumber: '3633',
    type: 'checking',
    status: 'active',
  },
  {
    name: 'MNM Secretarial Services Inc',
    bankName: 'Bank Ozk',
    accountNumber: '5883',
    type: 'checking',
    status: 'active',
  },
  {
    name: 'Murphy Web Services',
    bankName: 'Bluevine',
    accountNumber: '4281',
    type: 'checking',
    status: 'active',
  },
  {
    name: 'E Systems Management',
    bankName: 'Bluevine',
    accountNumber: '4005',
    type: 'checking',
    status: 'active',
  },
];

async function seedAccounts() {
  try {
    await connectToDatabase();
    
    console.log('Starting account seeding...');
    
    for (const accountData of accounts) {
      // Check if account already exists
      const existing = await Account.findOne({
        name: accountData.name,
        bankName: accountData.bankName,
      });
      
      if (existing) {
        console.log(`Account already exists: ${accountData.name} - ${accountData.bankName}`);
        continue;
      }
      
      // Create new account
      const account = await Account.create(accountData);
      console.log(`Created account: ${account.name} - ${account.bankName}`);
    }
    
    console.log('Account seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding accounts:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedAccounts();
}

export default seedAccounts;
