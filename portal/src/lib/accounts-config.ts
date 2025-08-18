// Standard accounts configuration for the application
export const STANDARD_ACCOUNTS = [
  {
    name: 'Murphy Web Services - Bank Ozk',
    bankName: 'Bank Ozk',
    accountNumber: '8979',
    displayName: 'Murphy Web Services - Bank Ozk 8979'
  },
  {
    name: 'E Systems Management - Bank Ozk',
    bankName: 'Bank Ozk', 
    accountNumber: '3633',
    displayName: 'E Systems Management - Bank Ozk 3633'
  },
  {
    name: 'MNM Secretarial Services Inc - Bank Ozk',
    bankName: 'Bank Ozk',
    accountNumber: '5883',
    displayName: 'MNM Secretarial Services Inc - Bank Ozk 5883'
  },
  {
    name: 'Murphy Web Services - Bluevine',
    bankName: 'Bluevine',
    accountNumber: '4281',
    displayName: 'Murphy Web Services - Bluevine 4281'
  },
  {
    name: 'E Systems Management - Bluevine',
    bankName: 'Bluevine',
    accountNumber: '4005',
    displayName: 'E Systems Management - Bluevine 4005'
  }
];

// Helper function to get account by name
export function getAccountByName(accountName: string) {
  return STANDARD_ACCOUNTS.find(acc => 
    acc.name === accountName || 
    acc.displayName === accountName ||
    accountName.includes(acc.name)
  );
}

// Helper function to format account for display
export function formatAccountDisplay(account: { name: string; bankName: string; accountNumber?: string }) {
  if (account.accountNumber) {
    return `${account.name} ${account.accountNumber}`;
  }
  return `${account.name} - ${account.bankName}`;
}

// Helper to parse account name from various formats
export function parseAccountName(input: string): { name: string; bankName: string; accountNumber?: string } | null {
  // Try to match standard format: "Company Name - Bank Name AccountNumber"
  const patterns = [
    /^(.+?)\s*-\s*(.+?)\s+(\d{4})$/,  // With account number
    /^(.+?)\s*-\s*(.+?)$/,              // Without account number
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return {
        name: match[1].trim(),
        bankName: match[2].trim(),
        accountNumber: match[3] || undefined
      };
    }
  }
  
  // Check if it matches any standard account
  const standardAccount = getAccountByName(input);
  if (standardAccount) {
    return {
      name: standardAccount.name,
      bankName: standardAccount.bankName,
      accountNumber: standardAccount.accountNumber
    };
  }
  
  return null;
}