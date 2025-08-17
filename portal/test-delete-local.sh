#!/bin/bash

# Test script to verify delete functionality locally
echo "Testing Delete Functionality for CADGroup Portal"
echo "================================================"

# Base URL - update this if testing on production
BASE_URL="http://localhost:3030"
if [ "$1" == "prod" ]; then
  BASE_URL="https://cadgrouptools.onrender.com"
fi

echo "Testing against: $BASE_URL"
echo ""

# Test S3 configuration
echo "1. Testing S3 Configuration..."
echo "------------------------------"
curl -s "$BASE_URL/api/test-s3" | python3 -m json.tool || echo "S3 test endpoint not available"
echo ""

# Test Supabase configuration
echo "2. Testing Supabase Configuration..."
echo "------------------------------------"
curl -s "$BASE_URL/api/test-supabase" | python3 -m json.tool || echo "Supabase test endpoint not available"
echo ""

# Get cleanup status
echo "3. Checking Storage Cleanup Status..."
echo "-------------------------------------"
curl -s "$BASE_URL/api/statements/cleanup" | python3 -m json.tool || echo "Cleanup endpoint not available"
echo ""

# If a statement ID is provided, test delete
if [ ! -z "$2" ]; then
  STATEMENT_ID="$2"
  echo "4. Testing Delete for Statement ID: $STATEMENT_ID"
  echo "------------------------------------------------"
  
  # Attempt delete
  RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/statements/$STATEMENT_ID")
  echo "Response:"
  echo "$RESPONSE" | python3 -m json.tool || echo "$RESPONSE"
else
  echo "4. Skipping delete test (no statement ID provided)"
  echo "   Usage: $0 [prod] [statement_id]"
fi

echo ""
echo "Test complete!"