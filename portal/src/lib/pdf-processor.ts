// Dynamic import to avoid build-time issues
const pdf = typeof window === 'undefined' ? require('pdf-parse/lib/pdf-parse') : null;

interface PDFProcessingResult {
  text: string;
  numPages: number;
  info: any;
  images?: Buffer[];
}

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<PDFProcessingResult> {
  try {
    if (!pdf) {
      throw new Error('PDF parsing not available in browser environment');
    }
    
    const data = await pdf(pdfBuffer);
    
    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
    };
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

// Convert PDF pages to images for OCR (if text extraction fails)
export async function convertPDFToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
  try {
    // For server-side, we'll use pdf-parse for text extraction
    // If we need actual image conversion, we would need a different approach
    // For now, we'll focus on text extraction from PDFs
    
    const images: Buffer[] = [];
    
    // Note: Full PDF to image conversion would require additional setup
    // with tools like pdf2pic or poppler-utils
    // For now, we'll extract text directly from the PDF
    
    return images;
  } catch (error: any) {
    console.error('PDF to image conversion error:', error);
    throw new Error(`Failed to convert PDF to images: ${error.message}`);
  }
}