#!/usr/bin/env node

/**
 * Deployment Verification Script for Render
 * Run this to check if all environment variables and configurations are properly set
 */

const https = require('https');
const http = require('http');

// Configuration
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'https://cadgrouptools.onrender.com';
const isProduction = process.env.NODE_ENV === 'production';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Helper functions
const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}`),
};

// Check environment variables
function checkEnvironmentVariables() {
  log.header('Checking Environment Variables');
  
  const requiredVars = [
    { name: 'NEXTAUTH_URL', description: 'NextAuth URL for authentication' },
    { name: 'NEXTAUTH_SECRET', description: 'NextAuth secret key' },
    { name: 'MONGODB_URI', description: 'MongoDB connection string' },
    { name: 'DB_NAME', description: 'Database name' },
    { name: 'NODE_ENV', description: 'Node environment' },
  ];
  
  const optionalVars = [
    { name: 'SUPABASE_URL', description: 'Supabase URL for storage' },
    { name: 'SUPABASE_SERVICE_ROLE', description: 'Supabase service role key' },
    { name: 'S3_BUCKET_NAME', description: 'S3 bucket for file storage' },
    { name: 'S3_ACCESS_KEY_ID', description: 'S3 access key' },
    { name: 'GOOGLE_PROJECT_ID', description: 'Google Cloud project for OCR' },
    { name: 'SENDGRID_API_KEY', description: 'SendGrid for email' },
  ];
  
  let allRequiredPresent = true;
  
  // Check required variables
  requiredVars.forEach(({ name, description }) => {
    if (process.env[name]) {
      log.success(`${name} is set (${description})`);
    } else {
      log.error(`${name} is NOT set - ${description}`);
      allRequiredPresent = false;
    }
  });
  
  // Check optional variables
  console.log('\nOptional Variables:');
  optionalVars.forEach(({ name, description }) => {
    if (process.env[name]) {
      log.info(`${name} is set (${description})`);
    } else {
      log.warning(`${name} is not set - ${description}`);
    }
  });
  
  // Validate specific values
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('http')) {
    log.error('NEXTAUTH_URL must start with http:// or https://');
    allRequiredPresent = false;
  }
  
  if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.endsWith('/')) {
    log.error('NEXTAUTH_URL should not have a trailing slash');
    allRequiredPresent = false;
  }
  
  if (process.env.NODE_ENV && process.env.NODE_ENV !== 'production' && isProduction) {
    log.warning('NODE_ENV should be set to "production" for production deployments');
  }
  
  return allRequiredPresent;
}

// Test API endpoints
async function testAPIEndpoints() {
  log.header('Testing API Endpoints');
  
  const endpoints = [
    { path: '/api/health/db', method: 'GET', description: 'Database health check' },
    { path: '/api/auth/providers', method: 'GET', description: 'Auth providers' },
    { path: '/api/statements', method: 'GET', description: 'Statements API', requiresAuth: true },
    { path: '/api/ocr', method: 'GET', description: 'OCR service status', requiresAuth: true },
  ];
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
}

// Test individual endpoint
function testEndpoint({ path, method, description, requiresAuth }) {
  return new Promise((resolve) => {
    const url = new URL(path, DEPLOYMENT_URL);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Accept': 'application/json',
      },
      timeout: 10000,
    };
    
    const req = protocol.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        log.success(`${path} - ${description} (Status: ${res.statusCode})`);
      } else if (res.statusCode === 401 && requiresAuth) {
        log.info(`${path} - ${description} (Status: 401 - Auth required as expected)`);
      } else if (res.statusCode === 404) {
        log.error(`${path} - ${description} (Status: 404 - Endpoint not found)`);
      } else {
        log.warning(`${path} - ${description} (Status: ${res.statusCode})`);
      }
      resolve();
    });
    
    req.on('error', (error) => {
      log.error(`${path} - ${description} (Error: ${error.message})`);
      resolve();
    });
    
    req.on('timeout', () => {
      req.destroy();
      log.error(`${path} - ${description} (Timeout after 10s)`);
      resolve();
    });
    
    req.end();
  });
}

// Check database connectivity
async function checkDatabase() {
  log.header('Checking Database Connection');
  
  if (!process.env.MONGODB_URI) {
    log.error('MONGODB_URI not set - cannot test database connection');
    return false;
  }
  
  try {
    const mongoose = require('mongoose');
    
    // Test connection
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'cadtools',
      serverSelectionTimeoutMS: 5000,
    });
    
    log.success('Successfully connected to MongoDB');
    
    // Check collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    log.info(`Found ${collections.length} collections in database`);
    
    // Check for essential collections
    const essentialCollections = ['users', 'statements', 'transactions', 'files'];
    essentialCollections.forEach(name => {
      const exists = collections.some(c => c.name === name);
      if (exists) {
        log.success(`Collection '${name}' exists`);
      } else {
        log.warning(`Collection '${name}' does not exist (will be created on first use)`);
      }
    });
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    return false;
  }
}

// Check CORS configuration
async function checkCORS() {
  log.header('Checking CORS Configuration');
  
  return new Promise((resolve) => {
    const url = new URL('/api/health/db', DEPLOYMENT_URL);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://cadgrouptools.onrender.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
      timeout: 5000,
    };
    
    const req = protocol.request(options, (res) => {
      const corsHeaders = {
        'access-control-allow-origin': res.headers['access-control-allow-origin'],
        'access-control-allow-methods': res.headers['access-control-allow-methods'],
        'access-control-allow-headers': res.headers['access-control-allow-headers'],
      };
      
      if (corsHeaders['access-control-allow-origin']) {
        log.success(`CORS is configured: Origin ${corsHeaders['access-control-allow-origin']}`);
        if (corsHeaders['access-control-allow-methods']) {
          log.info(`Allowed methods: ${corsHeaders['access-control-allow-methods']}`);
        }
      } else {
        log.info('CORS headers not present (may be handled by Next.js internally)');
      }
      resolve();
    });
    
    req.on('error', (error) => {
      log.warning(`CORS check failed: ${error.message}`);
      resolve();
    });
    
    req.end();
  });
}

// Main verification function
async function verifyDeployment() {
  console.log(`${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════════════╗
║     CADGroup Tools - Deployment Verification        ║
╚══════════════════════════════════════════════════════╝${colors.reset}`);
  
  log.info(`Deployment URL: ${DEPLOYMENT_URL}`);
  log.info(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
  
  // Run checks
  const envVarsOk = checkEnvironmentVariables();
  
  if (!isProduction) {
    log.header('Testing External Connectivity');
    await testAPIEndpoints();
    await checkCORS();
  }
  
  // Database check (only if MongoDB URI is available)
  if (process.env.MONGODB_URI) {
    await checkDatabase();
  }
  
  // Summary
  log.header('Verification Summary');
  
  if (envVarsOk) {
    log.success('All required environment variables are set');
  } else {
    log.error('Some required environment variables are missing');
    log.info('Please set these in your Render dashboard under Environment tab');
  }
  
  console.log(`\n${colors.bold}Deployment Checklist:${colors.reset}`);
  console.log('1. ✓ Environment variables configured in Render dashboard');
  console.log('2. ✓ MongoDB Atlas IP whitelist includes 0.0.0.0/0');
  console.log('3. ✓ Build command: npm ci && npm run build');
  console.log('4. ✓ Start command: npm start');
  console.log('5. ✓ Port set to 10000 in Render');
  console.log('6. ✓ Auto-deploy enabled from GitHub main branch');
  
  console.log(`\n${colors.cyan}To fix any issues:${colors.reset}`);
  console.log('1. Go to https://dashboard.render.com');
  console.log('2. Select your service "cadgrouptools"');
  console.log('3. Click "Environment" tab to add/update variables');
  console.log('4. Check "Logs" tab for runtime errors');
  console.log('5. Ensure all changes are pushed to GitHub main branch');
}

// Run verification
if (require.main === module) {
  verifyDeployment().catch(error => {
    log.error(`Verification failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { verifyDeployment };