/**
 * Seed script for Financial Reporting System
 * Creates companies, categories, and company groups
 * Run with: npx ts-node src/scripts/seedReportingSystem.ts
 */

import { connectDB } from '../lib/db';
import { Company } from '../models/Company';
import { CompanyGroup } from '../models/CompanyGroup';
import { Category } from '../models/Category';

// Company data
const companies = [
  {
    name: 'Murphy Web Services',
    legalName: 'Murphy Web Services Incorporated',
    slug: 'murphy_web_services',
    currency: 'PHP',
    status: 'active',
    address: {
      country: 'Philippines',
    },
  },
  {
    name: 'E Systems Management',
    legalName: 'E-Systems Management Incorporated',
    slug: 'esystems_management',
    currency: 'PHP',
    status: 'active',
    address: {
      country: 'Philippines',
    },
  },
  {
    name: 'Hardin Bar & Grill',
    legalName: 'Hardin Bar & Grill',
    slug: 'hardin_bar_grill',
    currency: 'PHP',
    status: 'active',
    address: {
      country: 'Philippines',
    },
  },
  {
    name: 'M&M Secretarial Services',
    legalName: 'M&M Secretarial Services Incorporated',
    slug: 'mm_secretarial',
    currency: 'PHP',
    status: 'active',
    address: {
      country: 'Philippines',
    },
  },
  {
    name: 'DPM',
    legalName: 'DPM Incorporated',
    slug: 'dpm',
    currency: 'PHP',
    status: 'active',
    address: {
      country: 'Philippines',
    },
  },
  {
    name: 'Linkage Web Solutions',
    legalName: 'Linkage Web Solutions Enterprise Incorporated',
    slug: 'linkage_web_solutions',
    currency: 'PHP',
    status: 'active',
    address: {
      country: 'Philippines',
    },
  },
  {
    name: 'WDDS',
    legalName: 'WDDS',
    slug: 'wdds',
    currency: 'PHP',
    status: 'active',
    address: {
      country: 'Philippines',
    },
  },
  {
    name: 'M&M Leasing Services',
    legalName: 'M&M Leasing Services',
    slug: 'mm_leasing',
    currency: 'PHP',
    status: 'active',
    address: {
      country: 'Philippines',
    },
  },
  {
    name: 'MPHI',
    legalName: 'MPHI',
    slug: 'mphi',
    currency: 'PHP',
    status: 'active',
    address: {
      country: 'Philippines',
    },
  },
];

// Category data with hierarchy
const categories = [
  // INCOME CATEGORIES
  {
    name: 'Client Services',
    type: 'income',
    description: 'Revenue from client services',
    isDeductible: true,
    isSystem: true,
    icon: 'TeamOutlined',
    sortOrder: 1,
  },
  {
    name: 'Consulting',
    type: 'income',
    parentCategoryName: 'Client Services',
    description: 'Consulting services revenue',
    isDeductible: true,
    isSystem: true,
    icon: 'SolutionOutlined',
    sortOrder: 1,
  },
  {
    name: 'Web Development',
    type: 'income',
    parentCategoryName: 'Client Services',
    description: 'Web development services revenue',
    isDeductible: true,
    isSystem: true,
    icon: 'CodeOutlined',
    sortOrder: 2,
  },
  {
    name: 'Design',
    type: 'income',
    parentCategoryName: 'Client Services',
    description: 'Design services revenue',
    isDeductible: true,
    isSystem: true,
    icon: 'BgColorsOutlined',
    sortOrder: 3,
  },
  {
    name: 'Investment Income',
    type: 'income',
    description: 'Income from investments',
    isDeductible: true,
    isSystem: true,
    icon: 'DollarOutlined',
    sortOrder: 2,
  },
  {
    name: 'Refunds & Reimbursements',
    type: 'income',
    description: 'Refunds and reimbursements received',
    isDeductible: true,
    isSystem: true,
    icon: 'SwapOutlined',
    sortOrder: 3,
  },
  {
    name: 'Other Income',
    type: 'income',
    description: 'Miscellaneous income',
    isDeductible: true,
    isSystem: true,
    icon: 'WalletOutlined',
    sortOrder: 99,
  },

  // EXPENSE CATEGORIES
  {
    name: 'Technology & Software',
    type: 'expense',
    description: 'Technology and software expenses',
    isDeductible: true,
    isSystem: true,
    icon: 'LaptopOutlined',
    sortOrder: 1,
  },
  {
    name: 'Subscriptions',
    type: 'expense',
    parentCategoryName: 'Technology & Software',
    description: 'Software subscriptions',
    isDeductible: true,
    isSystem: true,
    icon: 'CloudOutlined',
    sortOrder: 1,
  },
  {
    name: 'Hardware',
    type: 'expense',
    parentCategoryName: 'Technology & Software',
    description: 'Computer hardware and equipment',
    isDeductible: true,
    isSystem: true,
    icon: 'DesktopOutlined',
    sortOrder: 2,
  },
  {
    name: 'Hosting',
    type: 'expense',
    parentCategoryName: 'Technology & Software',
    description: 'Web hosting and server costs',
    isDeductible: true,
    isSystem: true,
    icon: 'DatabaseOutlined',
    sortOrder: 3,
  },
  {
    name: 'Rent & Utilities',
    type: 'expense',
    description: 'Rent and utility expenses',
    isDeductible: true,
    isSystem: true,
    icon: 'HomeOutlined',
    sortOrder: 2,
  },
  {
    name: 'Office Rent',
    type: 'expense',
    parentCategoryName: 'Rent & Utilities',
    description: 'Office space rental',
    isDeductible: true,
    isSystem: true,
    icon: 'ShopOutlined',
    sortOrder: 1,
  },
  {
    name: 'Electricity',
    type: 'expense',
    parentCategoryName: 'Rent & Utilities',
    description: 'Electricity bills',
    isDeductible: true,
    isSystem: true,
    icon: 'ThunderboltOutlined',
    sortOrder: 2,
  },
  {
    name: 'Internet',
    type: 'expense',
    parentCategoryName: 'Rent & Utilities',
    description: 'Internet service',
    isDeductible: true,
    isSystem: true,
    icon: 'WifiOutlined',
    sortOrder: 3,
  },
  {
    name: 'Water',
    type: 'expense',
    parentCategoryName: 'Rent & Utilities',
    description: 'Water bills',
    isDeductible: true,
    isSystem: true,
    icon: 'DropletOutlined',
    sortOrder: 4,
  },
  {
    name: 'Transportation & Travel',
    type: 'expense',
    description: 'Transportation and travel expenses',
    isDeductible: true,
    isSystem: true,
    icon: 'CarOutlined',
    sortOrder: 3,
  },
  {
    name: 'Fuel',
    type: 'expense',
    parentCategoryName: 'Transportation & Travel',
    description: 'Fuel expenses',
    isDeductible: true,
    isSystem: true,
    icon: 'DashboardOutlined',
    sortOrder: 1,
  },
  {
    name: 'Public Transport',
    type: 'expense',
    parentCategoryName: 'Transportation & Travel',
    description: 'Public transportation costs',
    isDeductible: true,
    isSystem: true,
    icon: 'EnvironmentOutlined',
    sortOrder: 2,
  },
  {
    name: 'Parking',
    type: 'expense',
    parentCategoryName: 'Transportation & Travel',
    description: 'Parking fees',
    isDeductible: true,
    isSystem: true,
    icon: 'StopOutlined',
    sortOrder: 3,
  },
  {
    name: 'Flights',
    type: 'expense',
    parentCategoryName: 'Transportation & Travel',
    description: 'Airfare',
    isDeductible: true,
    isSystem: true,
    icon: 'RocketOutlined',
    sortOrder: 4,
  },
  {
    name: 'Hotels',
    type: 'expense',
    parentCategoryName: 'Transportation & Travel',
    description: 'Hotel accommodations',
    isDeductible: true,
    isSystem: true,
    icon: 'HomeOutlined',
    sortOrder: 5,
  },
  {
    name: 'Meals & Entertainment',
    type: 'expense',
    description: 'Meals and entertainment expenses',
    isDeductible: true,
    isSystem: true,
    icon: 'CoffeeOutlined',
    sortOrder: 4,
  },
  {
    name: 'Office Supplies & Equipment',
    type: 'expense',
    description: 'Office supplies and equipment',
    isDeductible: true,
    isSystem: true,
    icon: 'ShoppingCartOutlined',
    sortOrder: 5,
  },
  {
    name: 'Payroll & Benefits',
    type: 'expense',
    description: 'Payroll and employee benefits',
    isDeductible: true,
    isSystem: true,
    icon: 'TeamOutlined',
    sortOrder: 6,
  },
  {
    name: 'Salaries',
    type: 'expense',
    parentCategoryName: 'Payroll & Benefits',
    description: 'Employee salaries',
    isDeductible: true,
    isSystem: true,
    icon: 'UserOutlined',
    sortOrder: 1,
  },
  {
    name: 'SSS',
    type: 'expense',
    parentCategoryName: 'Payroll & Benefits',
    description: 'Social Security System contributions',
    isDeductible: true,
    isSystem: true,
    icon: 'SafetyOutlined',
    sortOrder: 2,
  },
  {
    name: 'PhilHealth',
    type: 'expense',
    parentCategoryName: 'Payroll & Benefits',
    description: 'PhilHealth contributions',
    isDeductible: true,
    isSystem: true,
    icon: 'MedicineBoxOutlined',
    sortOrder: 3,
  },
  {
    name: 'Pag-IBIG',
    type: 'expense',
    parentCategoryName: 'Payroll & Benefits',
    description: 'Pag-IBIG Fund contributions',
    isDeductible: true,
    isSystem: true,
    icon: 'BankOutlined',
    sortOrder: 4,
  },
  {
    name: 'Bonuses',
    type: 'expense',
    parentCategoryName: 'Payroll & Benefits',
    description: 'Employee bonuses',
    isDeductible: true,
    isSystem: true,
    icon: 'GiftOutlined',
    sortOrder: 5,
  },
  {
    name: 'Professional Services',
    type: 'expense',
    description: 'Professional service fees',
    isDeductible: true,
    isSystem: true,
    icon: 'SolutionOutlined',
    sortOrder: 7,
  },
  {
    name: 'Legal',
    type: 'expense',
    parentCategoryName: 'Professional Services',
    description: 'Legal services',
    isDeductible: true,
    isSystem: true,
    icon: 'FileProtectOutlined',
    sortOrder: 1,
  },
  {
    name: 'Accounting',
    type: 'expense',
    parentCategoryName: 'Professional Services',
    description: 'Accounting services',
    isDeductible: true,
    isSystem: true,
    icon: 'CalculatorOutlined',
    sortOrder: 2,
  },
  {
    name: 'Consulting',
    type: 'expense',
    parentCategoryName: 'Professional Services',
    description: 'Consulting services',
    isDeductible: true,
    isSystem: true,
    icon: 'AuditOutlined',
    sortOrder: 3,
  },
  {
    name: 'Marketing & Advertising',
    type: 'expense',
    description: 'Marketing and advertising expenses',
    isDeductible: true,
    isSystem: true,
    icon: 'SoundOutlined',
    sortOrder: 8,
  },
  {
    name: 'Bank Fees & Charges',
    type: 'expense',
    description: 'Bank fees and charges',
    isDeductible: false,
    isSystem: true,
    icon: 'BankOutlined',
    sortOrder: 9,
  },
  {
    name: 'Taxes & Licenses',
    type: 'expense',
    description: 'Taxes and business licenses',
    isDeductible: false,
    isSystem: true,
    icon: 'FileTextOutlined',
    sortOrder: 10,
  },
  {
    name: 'Insurance',
    type: 'expense',
    description: 'Business insurance',
    isDeductible: true,
    isSystem: true,
    icon: 'SafetyOutlined',
    sortOrder: 11,
  },
  {
    name: 'Depreciation',
    type: 'expense',
    description: 'Asset depreciation',
    isDeductible: true,
    isSystem: true,
    icon: 'FallOutlined',
    sortOrder: 12,
  },
  {
    name: 'Miscellaneous',
    type: 'expense',
    description: 'Other expenses',
    isDeductible: true,
    isSystem: true,
    icon: 'EllipsisOutlined',
    sortOrder: 99,
  },

  // TRANSFER CATEGORY
  {
    name: 'Transfer',
    type: 'transfer',
    description: 'Transfers between accounts',
    isDeductible: false,
    isSystem: true,
    icon: 'SwapOutlined',
    sortOrder: 1,
  },
];

async function seedCompanies() {
  console.log('Seeding companies...');
  const createdCompanies = [];

  for (const companyData of companies) {
    const existing = await Company.findOne({ slug: companyData.slug });
    if (existing) {
      console.log(`  ✓ Company already exists: ${companyData.name}`);
      createdCompanies.push(existing);
    } else {
      const company = await Company.create(companyData);
      console.log(`  + Created company: ${company.name}`);
      createdCompanies.push(company);
    }
  }

  return createdCompanies;
}

async function seedCategories() {
  console.log('Seeding categories...');
  const categoryMap = new Map();

  // First pass: Create parent categories
  for (const categoryData of categories) {
    if (!categoryData.parentCategoryName) {
      const existing = await Category.findOne({ 
        name: categoryData.name, 
        type: categoryData.type 
      });
      
      if (existing) {
        console.log(`  ✓ Parent category already exists: ${categoryData.name}`);
        categoryMap.set(categoryData.name, existing);
      } else {
        const { parentCategoryName, ...data } = categoryData;
        const category = await Category.create(data);
        console.log(`  + Created parent category: ${category.name} (${category.type})`);
        categoryMap.set(categoryData.name, category);
      }
    }
  }

  // Second pass: Create subcategories with parent references
  for (const categoryData of categories) {
    if (categoryData.parentCategoryName) {
      const existing = await Category.findOne({ 
        name: categoryData.name, 
        type: categoryData.type 
      });
      
      if (existing) {
        console.log(`  ✓ Subcategory already exists: ${categoryData.name}`);
        categoryMap.set(categoryData.name, existing);
      } else {
        const parentCategory = categoryMap.get(categoryData.parentCategoryName);
        if (!parentCategory) {
          console.error(`  ✗ Parent category not found: ${categoryData.parentCategoryName}`);
          continue;
        }

        const { parentCategoryName, ...data } = categoryData;
        const category = await Category.create({
          ...data,
          parentCategory: parentCategory._id,
        });
        console.log(`  + Created subcategory: ${category.name} under ${parentCategory.name}`);
        categoryMap.set(categoryData.name, category);
      }
    }
  }

  return categoryMap;
}

async function seedCompanyGroup(companies: any[]) {
  console.log('Seeding company groups...');
  
  // Get the three main companies
  const murphyCompany = companies.find(c => c.slug === 'murphy_web_services');
  const esystemsCompany = companies.find(c => c.slug === 'esystems_management');
  const hardinCompany = companies.find(c => c.slug === 'hardin_bar_grill');

  if (!murphyCompany || !esystemsCompany || !hardinCompany) {
    console.error('  ✗ Could not find all three main companies for group');
    return;
  }

  const existing = await CompanyGroup.findOne({ name: 'Murphy Holdings' });
  if (existing) {
    console.log('  ✓ Company group already exists: Murphy Holdings');
    return existing;
  }

  const group = await CompanyGroup.create({
    name: 'Murphy Holdings',
    description: 'Consolidated group for Murphy Web Services, E Systems Management, and Hardin Bar & Grill',
    companies: [murphyCompany._id, esystemsCompany._id, hardinCompany._id],
    status: 'active',
  });

  console.log(`  + Created company group: ${group.name}`);
  return group;
}

async function main() {
  try {
    console.log('Starting Financial Reporting System seeding...\n');
    
    await connectDB();
    console.log('✓ Connected to database\n');

    const companies = await seedCompanies();
    console.log('');

    const categoryMap = await seedCategories();
    console.log('');

    await seedCompanyGroup(companies);
    console.log('');

    console.log('✓ Seeding completed successfully!');
    console.log(`  - Companies: ${companies.length}`);
    console.log(`  - Categories: ${categoryMap.size}`);
    console.log('  - Company Groups: 1');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error during seeding:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedCompanies, seedCategories, seedCompanyGroup };

