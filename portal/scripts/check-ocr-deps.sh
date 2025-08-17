#!/bin/bash

echo "🔍 Checking OCR Dependencies..."
echo "================================"

# Check for ImageMagick
echo -n "ImageMagick: "
if command -v magick &> /dev/null; then
    echo "✅ Installed ($(magick -version | head -1))"
elif command -v gm &> /dev/null; then
    echo "✅ GraphicsMagick installed ($(gm -version | head -1))"
else
    echo "❌ Not installed - Required for PDF to image conversion"
    echo "   Install with: brew install imagemagick (macOS)"
    echo "   Or: apt-get install imagemagick (Linux)"
fi

# Check for Node.js
echo -n "Node.js: "
if command -v node &> /dev/null; then
    echo "✅ Installed ($(node -v))"
else
    echo "❌ Not installed"
fi

# Check npm packages
echo ""
echo "📦 NPM Packages:"
if [ -f "package.json" ]; then
    echo -n "  tesseract.js: "
    if npm list tesseract.js --depth=0 2>/dev/null | grep -q "tesseract.js"; then
        echo "✅ Installed"
    else
        echo "❌ Not installed"
    fi
    
    echo -n "  pdf2pic: "
    if npm list pdf2pic --depth=0 2>/dev/null | grep -q "pdf2pic"; then
        echo "✅ Installed"
    else
        echo "❌ Not installed"
    fi
    
    echo -n "  pdf-parse: "
    if npm list pdf-parse --depth=0 2>/dev/null | grep -q "pdf-parse"; then
        echo "✅ Installed"
    else
        echo "❌ Not installed"
    fi
    
    echo -n "  pdfjs-dist: "
    if npm list pdfjs-dist --depth=0 2>/dev/null | grep -q "pdfjs-dist"; then
        echo "✅ Installed"
    else
        echo "❌ Not installed"
    fi
else
    echo "  ❌ package.json not found"
fi

# Check environment variables
echo ""
echo "🔐 Environment Variables:"
echo -n "  Google Vision API Key: "
if [ ! -z "$GOOGLE_VISION_API_KEY" ]; then
    echo "✅ Configured"
elif [ ! -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "✅ Service Account configured"
else
    echo "⚠️  Not configured (Tesseract.js will be used)"
fi

echo ""
echo "================================"
echo "✨ OCR Status: Tesseract.js is the default OCR engine"
echo "   No API keys required for basic functionality!"