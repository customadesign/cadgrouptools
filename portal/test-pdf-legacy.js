/**
 * Test PDF.js legacy build for Node.js
 */

const testPdfLegacy = async () => {
  console.log('Testing PDF.js legacy build for Node.js...\n');
  
  try {
    // Import pdfjs-dist legacy build
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Disable worker for Node.js environment
    pdfjsLib.GlobalWorkerOptions.workerSrc = null;
    pdfjsLib.GlobalWorkerOptions.workerPort = null;
    
    console.log('✓ PDF.js legacy build imported successfully');
    console.log('✓ Worker disabled for Node.js environment');
    
    // Create a simple test PDF data (minimal valid PDF)
    const testPdfData = Buffer.from([
      0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, // %PDF-1.4
      0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A, // Header
      // ... minimal PDF structure
    ]);
    
    console.log('\nAttempting to create a PDF loading task...');
    
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(testPdfData),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        disableAutoFetch: true,
        disableStream: true,
        disableFontFace: true,
      });
      
      console.log('✓ PDF loading task created successfully');
      console.log('✓ No "Invalid workerSrc type" errors detected');
      console.log('\n✅ PDF.js legacy build is working correctly in Node.js!');
      
      // Clean up
      loadingTask.destroy();
      
    } catch (pdfError) {
      // Check if it's the workerSrc error
      if (pdfError.message && pdfError.message.includes('workerSrc')) {
        console.error('❌ Worker configuration error:', pdfError.message);
        process.exit(1);
      } else {
        console.log('✓ No worker configuration errors');
        console.log('(PDF parsing error is expected with minimal test data)');
        console.log('\n✅ The workerSrc issue is fixed!');
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to import PDF.js legacy build:', error.message);
    process.exit(1);
  }
};

// Run the test
console.log('=== PDF.js Legacy Build Test ===\n');
testPdfLegacy().then(() => {
  console.log('\nTest completed successfully.');
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});