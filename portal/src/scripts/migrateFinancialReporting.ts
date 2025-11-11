/**
 * Migration script for Financial Reporting System
 * Migrates existing data to new schema with companies and categories
 * Run with: npx ts-node src/scripts/migrateFinancialReporting.ts
 */

import { connectDB } from '../lib/db';
import { Company } from '../models/Company';
import { Category } from '../models/Category';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { Statement } from '../models/Statement';
import { seedCompanies, seedCategories, seedCompanyGroup } from './seedReportingSystem';

// Mapping from old category strings to new category names
const categoryMapping: Record<string, { name: string; type: 'income' | 'expense' }> = {
  // Income mappings
  'client_payment': { name: 'Client Services', type: 'income' },
  'investment': { name: 'Investment Income', type: 'income' },
  'refund': { name: 'Refunds & Reimbursements', type: 'income' },
  'other_income': { name: 'Other Income', type: 'income' },
  
  // Expense mappings
  'technology': { name: 'Technology & Software', type: 'expense' },
  'rent': { name: 'Rent & Utilities', type: 'expense' },
  'transport': { name: 'Transportation & Travel', type: 'expense' },
  'meals': { name: 'Meals & Entertainment', type: 'expense' },
  'office': { name: 'Office Supplies & Equipment', type: 'expense' },
  'payroll': { name: 'Payroll & Benefits', type: 'expense' },
  'other_expense': { name: 'Miscellaneous', type: 'expense' },
};

// Mapping from company slugs to account name patterns
const companyAccountPatterns: Record<string, string[]> = {
  'murphy_web_services': ['murphy', 'mws'],
  'esystems_management': ['esystems', 'e-systems', 'e systems'],
  'hardin_bar_grill': ['hardin', 'bar', 'grill'],
  'mm_secretarial': ['m&m secretarial', 'secretarial'],
  'dpm': ['dpm'],
  'linkage_web_solutions': ['linkage'],
  'wdds': ['wdds'],
  'mm_leasing': ['m&m leasing', 'leasing'],
  'mphi': ['mphi'],
};

async function mapAccountToCompany(accountName: string, companies: Map<string, any>): Promise<string | null> {
  const lowerAccountName = accountName.toLowerCase();
  
  for (const [slug, patterns] of Object.entries(companyAccountPatterns)) {
    for (const pattern of patterns) {
      if (lowerAccountName.includes(pattern.toLowerCase())) {
        const company = companies.get(slug);
        if (company) {
          return company._id.toString();
        }
      }
    }
  }
  
  // Default to Murphy Web Services if no match found
  const defaultCompany = companies.get('murphy_web_services');
  return defaultCompany ? defaultCompany._id.toString() : null;
}

async function mapStringCategoryToObjectId(
  categoryString: string | undefined,
  direction: 'debit' | 'credit',
  categoryMap: Map<string, any>
): Promise<string | null> {
  // If no category string, return "Miscellaneous" or "Other Income"
  if (!categoryString) {
    const defaultName = direction === 'credit' ? 'Other Income' : 'Miscellaneous';
    const category = Array.from(categoryMap.values()).find(
      (cat: any) => cat.name === defaultName
    );
    return category ? category._id.toString() : null;
  }

  // Try exact match first
  const mapped = categoryMapping[categoryString];
  if (mapped) {
    const category = Array.from(categoryMap.values()).find(
      (cat: any) => cat.name === mapped.name && cat.type === mapped.type
    );
    if (category) {
      return category._id.toString();
    }
  }

  // Try fuzzy match
  const lowerCategoryString = categoryString.toLowerCase();
  for (const cat of categoryMap.values()) {
    if (cat.name.toLowerCase().includes(lowerCategoryString) ||
        lowerCategoryString.includes(cat.name.toLowerCase())) {
      return cat._id.toString();
    }
  }

  // Default fallback
  const defaultName = direction === 'credit' ? 'Other Income' : 'Miscellaneous';
  const category = Array.from(categoryMap.values()).find(
    (cat: any) => cat.name === defaultName
  );
  return category ? category._id.toString() : null;
}

function extractVendorFromDescription(description: string): string {
  // Simple vendor extraction logic
  // In production, this could be more sophisticated
  const parts = description.split(/[-–—]/);
  if (parts.length > 0) {
    return parts[0].trim().substring(0, 100);
  }
  return description.substring(0, 100);
}

async function migrateAccounts(companyMap: Map<string, any>) {
  console.log('Migrating accounts...');
  
  // Check if accounts already have company field
  const sampleAccount = await Account.findOne();
  if (sampleAccount && sampleAccount.company) {
    console.log('  ✓ Accounts already migrated (have company field)');
    return;
  }

  const accounts = await Account.find();
  let migratedCount = 0;
  let skippedCount = 0;

  for (const account of accounts) {
    try {
      const companyId = await mapAccountToCompany(account.name, companyMap);
      
      if (!companyId) {
        console.log(`  ⚠ Could not map account to company: ${account.name}`);
        skippedCount++;
        continue;
      }

      // Update account with company reference
      await Account.updateOne(
        { _id: account._id },
        { 
          $set: { 
            company: companyId,
            currency: 'PHP' // Update to PHP
          } 
        }
      );
      
      migratedCount++;
    } catch (error) {
      console.error(`  ✗ Error migrating account ${account.name}:`, error);
      skippedCount++;
    }
  }

  console.log(`  ✓ Migrated ${migratedCount} accounts`);
  if (skippedCount > 0) {
    console.log(`  ⚠ Skipped ${skippedCount} accounts`);
  }
}

async function migrateTransactions(categoryMap: Map<string, any>) {
  console.log('Migrating transactions...');
  
  // Check if transactions already have category as ObjectId
  const sampleTransaction = await Transaction.findOne();
  if (sampleTransaction && sampleTransaction.category && typeof sampleTransaction.category === 'object') {
    console.log('  ✓ Transactions already migrated (category is ObjectId)');
    return;
  }

  const transactions = await Transaction.find().populate('statement');
  let migratedCount = 0;
  let skippedCount = 0;

  console.log(`  Found ${transactions.length} transactions to migrate`);

  for (const transaction of transactions) {
    try {
      // Get company from statement -> account
      let companyId = null;
      if (transaction.statement) {
        const statement = await Statement.findById(transaction.statement).populate('account');
        if (statement && statement.account) {
          const account = await Account.findById(statement.account);
          if (account && account.company) {
            companyId = account.company;
          }
        }
      }

      // If still no company, try to infer from account name
      if (!companyId && transaction.statement) {
        const statement = await Statement.findById(transaction.statement);
        if (statement && statement.accountName) {
          const companies = await Company.find();
          const companyMap = new Map(companies.map(c => [c.slug, c]));
          companyId = await mapAccountToCompany(statement.accountName, companyMap);
        }
      }

      if (!companyId) {
        // Default to Murphy Web Services
        const defaultCompany = await Company.findOne({ slug: 'murphy_web_services' });
        if (defaultCompany) {
          companyId = defaultCompany._id;
        } else {
          console.log(`  ⚠ Could not determine company for transaction: ${transaction._id}`);
          skippedCount++;
          continue;
        }
      }

      // Map category string to Category ObjectId
      const categoryId = await mapStringCategoryToObjectId(
        transaction.category as any,
        transaction.direction,
        categoryMap
      );

      if (!categoryId) {
        console.log(`  ⚠ Could not map category for transaction: ${transaction._id}`);
        skippedCount++;
        continue;
      }

      // Extract vendor from description
      const vendor = extractVendorFromDescription(transaction.description);

      // Update transaction
      await Transaction.updateOne(
        { _id: transaction._id },
        { 
          $set: { 
            company: companyId,
            category: categoryId,
            vendor: vendor,
            isReconciled: false,
            taxDeductible: true,
          } 
        }
      );
      
      migratedCount++;
      
      if (migratedCount % 100 === 0) {
        console.log(`  Progress: ${migratedCount}/${transactions.length}`);
      }
    } catch (error) {
      console.error(`  ✗ Error migrating transaction ${transaction._id}:`, error);
      skippedCount++;
    }
  }

  console.log(`  ✓ Migrated ${migratedCount} transactions`);
  if (skippedCount > 0) {
    console.log(`  ⚠ Skipped ${skippedCount} transactions`);
  }
}

async function createIndexes() {
  console.log('Creating indexes...');
  
  try {
    await Account.createIndexes();
    await Transaction.createIndexes();
    await Category.createIndexes();
    await Company.createIndexes();
    console.log('  ✓ Indexes created successfully');
  } catch (error) {
    console.error('  ✗ Error creating indexes:', error);
  }
}

async function main() {
  try {
    console.log('Starting Financial Reporting System migration...\n');
    
    await connectDB();
    console.log('✓ Connected to database\n');

    // Step 1: Seed companies, categories, and groups
    console.log('Step 1: Seeding base data...');
    const companies = await seedCompanies();
    const companyMap = new Map(companies.map(c => [c.slug, c]));
    console.log('');

    const categoryMap = await seedCategories();
    console.log('');

    await seedCompanyGroup(companies);
    console.log('\n');

    // Step 2: Migrate accounts
    console.log('Step 2: Migrating accounts...');
    await migrateAccounts(companyMap);
    console.log('');

    // Step 3: Migrate transactions
    console.log('Step 3: Migrating transactions...');
    await migrateTransactions(categoryMap);
    console.log('');

    // Step 4: Create indexes
    console.log('Step 4: Creating indexes...');
    await createIndexes();
    console.log('');

    console.log('✓ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review migrated data in the database');
    console.log('2. Check for any uncategorized transactions');
    console.log('3. Verify company assignments for accounts');
    console.log('4. Test the new reporting APIs');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error during migration:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { migrateAccounts, migrateTransactions, createIndexes };


