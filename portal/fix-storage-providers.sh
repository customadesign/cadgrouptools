#!/bin/bash

echo "Fixing Storage Provider Configuration"
echo "====================================="
echo ""

# Determine environment
ENV="local"
BASE_URL="http://localhost:3030"

if [ "$1" == "prod" ]; then
  ENV="production"
  BASE_URL="https://cadgrouptools.onrender.com"
fi

echo "Environment: $ENV"
echo "Base URL: $BASE_URL"
echo ""

# Step 1: Check current storage configuration
echo "Step 1: Analyzing current storage configuration..."
echo "------------------------------------------------"
ANALYSIS=$(curl -s "$BASE_URL/api/fix-storage-provider")
echo "$ANALYSIS" | python3 -m json.tool

# Check if fix is needed
NEEDS_FIX=$(echo "$ANALYSIS" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('needsFix', False))" 2>/dev/null)

if [ "$NEEDS_FIX" == "True" ]; then
  echo ""
  echo "Step 2: Storage provider mismatch detected!"
  echo "-------------------------------------------"
  
  # First do a dry run
  echo "Performing dry run..."
  DRY_RUN=$(curl -s -X POST "$BASE_URL/api/fix-storage-provider" \
    -H "Content-Type: application/json" \
    -d '{"dryRun": true}')
  echo "$DRY_RUN" | python3 -m json.tool
  
  echo ""
  read -p "Do you want to apply these changes? (y/n): " -n 1 -r
  echo ""
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Step 3: Applying storage provider fixes..."
    echo "----------------------------------------"
    RESULT=$(curl -s -X POST "$BASE_URL/api/fix-storage-provider" \
      -H "Content-Type: application/json" \
      -d '{"dryRun": false}')
    echo "$RESULT" | python3 -m json.tool
    
    echo ""
    echo "✅ Storage providers have been fixed!"
  else
    echo ""
    echo "❌ Fix cancelled by user"
  fi
else
  echo ""
  echo "✅ No storage provider fixes needed!"
fi

echo ""
echo "Step 4: Final verification..."
echo "----------------------------"
FINAL=$(curl -s "$BASE_URL/api/fix-storage-provider")
echo "$FINAL" | python3 -m json.tool

echo ""
echo "Complete!"