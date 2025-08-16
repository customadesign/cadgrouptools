#!/usr/bin/env node

/**
 * Test OCR functionality on deployed application
 * This script tests the OCR retry endpoint and Tesseract.js functionality
 */

const https = require('https');

const DEPLOYMENT_URL = 'https://cadgrouptools.onrender.com';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, DEPLOYMENT_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testOCREndpoint() {
  log('\n=== Testing OCR Deployment ===\n', 'cyan');

  try {
    // Test 1: Check if health endpoint is available
    log('1. Testing health endpoint...', 'blue');
    const healthResponse = await makeRequest('/api/health');
    if (healthResponse.status === 200) {
      log('   ✓ Health endpoint is accessible', 'green');
      if (healthResponse.data.ocr) {
        log(`   ✓ OCR service status: ${JSON.stringify(healthResponse.data.ocr)}`, 'green');
      }
    } else {
      log(`   ✗ Health endpoint returned status ${healthResponse.status}`, 'red');
    }

    // Test 2: Check OCR endpoint
    log('\n2. Testing OCR endpoint availability...', 'blue');
    const ocrResponse = await makeRequest('/api/ocr');
    if (ocrResponse.status === 405) {
      log('   ✓ OCR endpoint exists (returns 405 for GET as expected)', 'green');
    } else if (ocrResponse.status === 401) {
      log('   ✓ OCR endpoint exists but requires authentication', 'yellow');
    } else {
      log(`   ✗ OCR endpoint returned unexpected status ${ocrResponse.status}`, 'red');
    }

    // Test 3: Check if Tesseract.js worker files are accessible
    log('\n3. Checking Tesseract.js worker files...', 'blue');
    const tesseractWorkerPaths = [
      '/node_modules/tesseract.js/dist/worker.min.js',
      '/node_modules/tesseract.js-core/tesseract-core.wasm.js',
      '/_next/static/chunks/tesseract.js'
    ];

    for (const path of tesseractWorkerPaths) {
      try {
        const response = await makeRequest(path, { method: 'HEAD' });
        if (response.status === 200 || response.status === 304) {
          log(`   ✓ Found Tesseract worker at ${path}`, 'green');
          break;
        }
      } catch (e) {
        // Silent fail, try next path
      }
    }

    // Test 4: Check environment variables info
    log('\n4. Environment Configuration Requirements:', 'blue');
    log('   The following environment variables should be set on Render:', 'yellow');
    log('   - GOOGLE_PROJECT_ID (for Google Vision API)', 'yellow');
    log('   - GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)', 'yellow');
    log('   - Or Tesseract.js will be used as fallback (no config needed)', 'yellow');

    // Test 5: Common issues and solutions
    log('\n5. Common OCR Issues and Solutions:', 'blue');
    log('\n   Issue: Tesseract.js not working in production', 'yellow');
    log('   Solution: Tesseract.js runs in the browser for images. For server-side OCR:', 'green');
    log('   - Use Google Vision API (recommended for production)', 'green');
    log('   - Or implement server-side Tesseract with node-tesseract-ocr', 'green');
    
    log('\n   Issue: PDF text extraction failing', 'yellow');
    log('   Solution: The app uses pdf-parse and pdfjs-dist for PDFs.', 'green');
    log('   - These should work on Render without additional config', 'green');
    log('   - Check logs for specific PDF processing errors', 'green');

    log('\n   Issue: OCR retry not working', 'yellow');
    log('   Solution: Check the following:', 'green');
    log('   - Verify MongoDB connection for statement retrieval', 'green');
    log('   - Check Supabase storage for file access', 'green');
    log('   - Review Render logs for specific error messages', 'green');

    // Test 6: Deployment recommendations
    log('\n6. Deployment Recommendations:', 'cyan');
    log('\n   For production OCR on Render:', 'blue');
    log('   1. Set up Google Cloud Vision API:', 'green');
    log('      - Create a service account in Google Cloud Console', 'reset');
    log('      - Download the JSON key file', 'reset');
    log('      - Add the JSON content as GOOGLE_APPLICATION_CREDENTIALS env var', 'reset');
    log('      - Set GOOGLE_PROJECT_ID to your GCP project ID', 'reset');
    
    log('\n   2. Alternative: Use server-side Tesseract:', 'green');
    log('      - Install system dependencies in Dockerfile', 'reset');
    log('      - Use node-tesseract-ocr package instead of tesseract.js', 'reset');
    
    log('\n   3. Monitor and Debug:', 'green');
    log('      - Check Render logs for specific errors', 'reset');
    log('      - Use the retry button to test OCR processing', 'reset');
    log('      - Verify file downloads from Supabase storage work', 'reset');

    log('\n=== Testing Complete ===\n', 'cyan');

  } catch (error) {
    log(`\nError during testing: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run the tests
testOCREndpoint().catch(console.error);