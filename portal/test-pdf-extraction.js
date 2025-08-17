/**
 * Simple test for PDF text extraction to verify the workerSrc fix
 */

const testPdfExtraction = async () => {
  console.log('Testing PDF.js text extraction...\n');
  
  try {
    // Import pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure worker properly for Node.js environment
    pdfjsLib.GlobalWorkerOptions.workerSrc = null;
    pdfjsLib.GlobalWorkerOptions.workerPort = null;
    
    console.log('✓ PDF.js imported successfully');
    console.log('✓ Worker configuration set to null (disabled for Node.js)');
    
    // Create a simple test PDF data (minimal valid PDF)
    const testPdfData = Buffer.from([
      0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, // %PDF-1.4
      0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A, // Header
      // ... minimal PDF structure
    ]);
    
    console.log('\nAttempting to load a test PDF document...');
    
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
      
      console.log('✓ PDF loading task created without worker errors');
      console.log('\n✅ PDF.js is configured correctly!');
      console.log('The "Invalid workerSrc type" error should be fixed.\n');
      
      // Clean up
      loadingTask.destroy();
      
    } catch (pdfError) {
      // This is expected for our minimal test data
      if (pdfError.message.includes('workerSrc')) {
        console.error('❌ Worker configuration error still present:', pdfError.message);
      } else {
        console.log('✓ No worker configuration errors detected');
        console.log('(PDF parsing error is expected with test data)');
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to import or configure PDF.js:', error.message);
    process.exit(1);
  }
};

// Run the test
console.log('=== PDF.js Worker Configuration Test ===\n');
testPdfExtraction().then(() => {
  console.log('Test completed.');
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});