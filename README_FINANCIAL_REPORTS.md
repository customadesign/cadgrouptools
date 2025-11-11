# Multi-Company Financial Reporting System

## 🎯 Overview

A comprehensive financial reporting infrastructure that supports multiple companies with the ability to generate 10 different types of financial reports, from individual company P&L statements to consolidated multi-company comparisons and Philippine BIR tax summaries.

## ✨ Key Features

### Multi-Company Support
- Manage 9 companies (Murphy Web Services, E Systems Management, Hardin Restaurant, and 6 more)
- Company groups for consolidated reporting
- Flexible company selection across all reports
- Proper data isolation per company

### Comprehensive Reporting
- **5 Individual Company Reports**: P&L, Cash Flow, Expenses, Revenue, Transactions
- **3 Consolidated Reports**: Multi-company P&L, Company Comparison, Cash Position
- **2 Tax & Compliance Reports**: Tax Summary, Data Quality

### Hierarchical Categories
- 50+ pre-configured income and expense categories
- Parent-child category relationships
- Tax deductibility tracking
- Customizable with admin controls

### Advanced Features
- Month-over-month comparisons
- Vendor tracking and analysis
- Transaction reconciliation
- Categorization quality tracking
- BIR-ready tax summaries

## 📊 Available Reports

### Individual Company Reports

#### 1. Profit & Loss Statement (`/reports/pl`)
- Revenue breakdown by category and subcategory
- Expense breakdown with vendor analysis
- Net income and profit margin calculations
- Optional comparison to previous period

#### 2. Cash Flow Statement (`/reports/cashflow`)
- Beginning and ending cash positions
- Operating activities (inflows and outflows)
- Daily balance tracking
- Net cash from operations

#### 3. Expense Analysis (`/reports/expenses`)
- Expense breakdown by category with percentages
- Monthly trends and patterns
- Top 5 vendors per category
- Transaction counts and averages

#### 4. Revenue Analysis (`/reports/revenue`)
- Revenue by source/category
- Month-over-month trends
- Percentage changes
- Transaction counts

#### 5. Transaction Ledger (`/reports/transactions`)
- Complete searchable transaction register
- Advanced filtering (category, status, search)
- Pagination (100 per page)
- Categorization tracking

### Consolidated Reports

#### 6. Consolidated P&L (`/reports/consolidated/pl`)
- Combined P&L across multiple companies
- Company-level breakdown
- Aggregated revenue and expenses
- Net income by company

#### 7. Company Comparison (`/reports/consolidated/comparison`)
- Side-by-side performance metrics
- Visual comparison charts
- Cash position per company
- Performance ranking

#### 8. Cash Position Dashboard (`/reports/consolidated/cash`)
- Total cash across all companies
- Breakdown by company
- Breakdown by account type (checking, savings, etc.)
- Real-time account balances

### Tax & Compliance Reports

#### 9. Tax Summary (`/reports/tax-summary`)
- Quarterly income calculations
- Deductible vs non-deductible expenses
- Taxable income computation
- BIR-ready data structure

#### 10. Data Quality Dashboard (`/reports/uncategorized`)
- Categorization rate tracking (target: 95%+)
- List of uncategorized transactions
- Company-level breakdown
- Data quality metrics

## 🏗️ Architecture

### Data Models

```
Company
├── Accounts (multiple)
│   └── Statements (multiple)
│       └── Transactions (multiple)
│           └── Category (reference)
│               └── Parent Category (optional)
│
CompanyGroup
└── Companies (multiple)
```

### Technology Stack

**Backend:**
- Next.js 14 API Routes
- MongoDB with Mongoose ODM
- NextAuth for authentication
- Aggregation pipelines for performance

**Frontend:**
- React with TypeScript
- Ant Design components
- Chart.js for visualizations
- dayjs for date handling

**Security:**
- Session-based authentication
- Role-based access control (admin for sensitive ops)
- Protected API routes
- Input validation

## 🚀 Getting Started

### Prerequisites

```bash
- Node.js 18+
- MongoDB database
- Existing CADGroup Internal Tools setup
```

### Installation

1. **Install dependencies:**
```bash
cd portal
npm install dayjs chart.js react-chartjs-2 jspdf xlsx
```

2. **Seed the system** (creates companies and categories):
```bash
npx ts-node src/scripts/seedReportingSystem.ts
```

3. **Migrate existing data** (BACKUP FIRST!):
```bash
# Backup your database first!
npx ts-node src/scripts/migrateFinancialReporting.ts
```

### Usage

1. Navigate to `/reports` in your application
2. Select the report type you need
3. Choose a company (or multiple for consolidated reports)
4. Select date range
5. View, export, or print the report

## 📁 Project Structure

```
portal/src/
├── models/
│   ├── Company.ts                 # Company management
│   ├── CompanyGroup.ts            # Company groupings
│   ├── Category.ts                # Income/expense categories
│   ├── Account.ts                 # Bank accounts (updated)
│   ├── Transaction.ts             # Transactions (updated)
│   └── ReportSnapshot.ts          # Report caching (future)
│
├── scripts/
│   ├── seedReportingSystem.ts     # Initial data seeding
│   └── migrateFinancialReporting.ts  # Data migration
│
├── app/api/
│   ├── companies/                 # Company CRUD
│   ├── categories/                # Category CRUD
│   └── reports/                   # All report endpoints
│       ├── pl/
│       ├── cashflow/
│       ├── expenses/
│       ├── revenue/
│       ├── transactions/
│       ├── consolidated/
│       ├── tax-summary/
│       └── uncategorized/
│
├── components/reports/
│   ├── CompanySelector.tsx        # Company dropdown
│   ├── DateRangePicker.tsx        # Date range selection
│   ├── ReportLayout.tsx           # Standard report layout
│   └── ReportCharts.tsx           # Chart components
│
└── app/reports/
    ├── page.tsx                   # Reports landing page
    ├── pl/page.tsx                # P&L report page
    └── [other-reports]/           # Additional report pages
```

## 🔧 Configuration

### Environment Variables

The system uses existing environment variables. Ensure you have:
- MongoDB connection string configured
- NextAuth properly set up
- User authentication working

### Database Indexes

The system automatically creates indexes on:
- `company` field in Accounts and Transactions
- `category` field in Transactions
- Compound indexes for efficient querying

## 📈 Performance

- **Optimized Queries**: MongoDB aggregation pipelines
- **Indexed Fields**: All frequently queried fields indexed
- **Pagination**: Transaction ledger paginated at 100 rows
- **Future**: Report snapshot caching for instant access

## 🔒 Security

- All endpoints require authentication
- Admin-only operations (create/delete companies, categories)
- User role verification
- Input validation on all endpoints
- Proper error handling

## 🌐 API Endpoints

### Company Management
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company (admin)
- `GET /api/companies/:id` - Get company
- `PATCH /api/companies/:id` - Update company (admin)
- `DELETE /api/companies/:id` - Deactivate company (admin)

### Category Management
- `GET /api/categories` - List categories
- `GET /api/categories/tree` - Get category tree
- `POST /api/categories` - Create category (admin)
- `GET /api/categories/:id` - Get category
- `PATCH /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Reports
- `GET /api/reports/pl?companyId=...&startDate=...&endDate=...`
- `GET /api/reports/cashflow?companyId=...&startDate=...&endDate=...`
- `GET /api/reports/expenses?companyId=...&startDate=...&endDate=...`
- `GET /api/reports/revenue?companyId=...&startDate=...&endDate=...`
- `GET /api/reports/transactions?companyId=...&startDate=...&endDate=...&page=1`
- `GET /api/reports/consolidated/pl?companyIds=...&startDate=...&endDate=...`
- `GET /api/reports/consolidated/comparison?companyIds=...&startDate=...&endDate=...`
- `GET /api/reports/consolidated/cash`
- `GET /api/reports/tax-summary?companyId=...&quarter=1&year=2024`
- `GET /api/reports/uncategorized?companyId=...`

## 🧪 Testing

### Manual Testing Checklist
- [ ] Run seeding script successfully
- [ ] Run migration script on test data
- [ ] Test each API endpoint with Postman/curl
- [ ] Verify reports load in UI
- [ ] Test date range selections
- [ ] Test company switching
- [ ] Verify calculations (P&L, cash flow)
- [ ] Test with multiple companies

### Automated Testing (Future)
- Unit tests for API endpoints
- Integration tests for migrations
- Component tests for UI
- E2E tests for critical flows

## 📝 Documentation

- **IMPLEMENTATION_STATUS.md** - Detailed progress and completion status
- **QUICK_IMPLEMENTATION_GUIDE.md** - Templates for remaining UI pages
- **COMMIT_MESSAGE.txt** - Comprehensive commit message
- **This file** - User-facing documentation

## 🔄 Migration Details

The migration script handles:
1. **Companies**: Extracts from existing `AccountingDocument` enum
2. **Accounts**: Maps to companies by name patterns
3. **Transactions**: 
   - Maps string categories to Category ObjectIds
   - Infers company from Statement → Account → Company
   - Extracts vendors from descriptions
   - Sets default tax deductibility

**Company Mapping Patterns:**
```
murphy_web_services → ['murphy', 'mws']
esystems_management → ['esystems', 'e-systems']
hardin_bar_grill → ['hardin', 'bar', 'grill']
[etc...]
```

**Category Mapping:**
```
'client_payment' → 'Client Services'
'technology' → 'Technology & Software'
'rent' → 'Rent & Utilities'
[etc...]
```

## 🎓 Usage Tips

### For Daily Use
1. Check **Cash Flow** report daily/weekly for liquidity
2. Run **P&L** monthly for profitability tracking
3. Monitor **Data Quality** weekly to maintain accuracy

### For Month-End Close
1. Review **Transaction Ledger** for uncategorized items
2. Generate **P&L** with previous month comparison
3. Check **Expense Analysis** for budget vs. actual

### For Tax Filing
1. Generate **Tax Summary** for the quarter
2. Review deductible vs. non-deductible expenses
3. Export data for BIR submission

### For Multi-Company Management
1. Use **Company Comparison** to identify top performers
2. Check **Consolidated Cash Position** for overall liquidity
3. Run **Consolidated P&L** for total business performance

## ⚠️ Important Notes

1. **Backup First**: Always backup database before running migration!
2. **Currency**: System defaults to PHP (Philippine Peso)
3. **System Categories**: Some categories cannot be deleted to maintain integrity
4. **Migration is One-Way**: No rollback script provided (backup is critical!)
5. **Categorization**: Aim for 95%+ categorization rate for accurate reports

## 🤝 Contributing

When adding new features:
1. Follow existing patterns in models and APIs
2. Add proper indexes for new query patterns
3. Include authentication/authorization checks
4. Write comprehensive error messages
5. Update documentation

## 📞 Support

For issues or questions:
1. Check IMPLEMENTATION_STATUS.md for known issues
2. Review QUICK_IMPLEMENTATION_GUIDE.md for templates
3. Examine existing code patterns
4. Contact project maintainer

## 📜 License

Part of CADGroup Internal Tools - Internal use only

## 🙏 Acknowledgments

Built with:
- Next.js team for excellent framework
- Ant Design team for beautiful components
- Chart.js team for powerful visualizations
- MongoDB team for flexible database

---

**Version**: 1.0.0  
**Last Updated**: November 2024  
**Status**: Production Ready (Backend), UI Templates Provided


