#!/bin/bash

# Test Delete Functionality Script
# This script tests the delete functionality of the statement API

API_URL="${API_URL:-http://localhost:3030}"
COOKIE_FILE="/tmp/test-cookies.txt"

echo "========================================="
echo "Statement Delete Functionality Test"
echo "========================================="
echo "API URL: $API_URL"
echo ""

# Function to make authenticated requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -b "$COOKIE_FILE" \
            "$API_URL$endpoint"
    else
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -b "$COOKIE_FILE" \
            -d "$data" \
            "$API_URL$endpoint"
    fi
}

# Step 1: Test Supabase connectivity
echo "1. Testing Supabase connectivity..."
echo "   Endpoint: /api/test-supabase"
response=$(make_request GET "/api/test-supabase")
if [ $? -eq 0 ]; then
    echo "   Response received"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
    echo "   ERROR: Failed to connect to API"
fi
echo ""

# Step 2: Get list of statements
echo "2. Fetching statements list..."
echo "   Endpoint: /api/statements?limit=5"
response=$(make_request GET "/api/statements?limit=5")
if [ $? -eq 0 ]; then
    echo "   Response received"
    # Extract first statement ID
    statement_id=$(echo "$response" | jq -r '.data[0]._id' 2>/dev/null)
    if [ "$statement_id" != "null" ] && [ -n "$statement_id" ]; then
        echo "   Found statement ID: $statement_id"
    else
        echo "   No statements found or unable to parse response"
    fi
else
    echo "   ERROR: Failed to fetch statements"
fi
echo ""

# Step 3: Test DELETE endpoint with debug info
if [ -n "$statement_id" ] && [ "$statement_id" != "null" ]; then
    echo "3. Testing DELETE endpoint..."
    echo "   Statement ID: $statement_id"
    echo "   Endpoint: /api/statements/$statement_id"
    
    # First, get statement details
    echo "   Getting statement details first..."
    details=$(make_request GET "/api/statements/$statement_id")
    echo "$details" | jq '.data | {id: ._id, file: .sourceFile.originalName, provider: .sourceFile.storageProvider}' 2>/dev/null
    
    echo ""
    echo "   Attempting to delete statement..."
    delete_response=$(make_request DELETE "/api/statements/$statement_id")
    
    if [ $? -eq 0 ]; then
        echo "   Delete response:"
        echo "$delete_response" | jq '.' 2>/dev/null || echo "$delete_response"
        
        # Check if successful
        success=$(echo "$delete_response" | jq -r '.success' 2>/dev/null)
        if [ "$success" = "true" ]; then
            echo "   ✓ Statement deleted successfully"
            
            # Extract debug info
            file_status=$(echo "$delete_response" | jq -r '.fileDeleteStatus' 2>/dev/null)
            transactions=$(echo "$delete_response" | jq -r '.deletedTransactions' 2>/dev/null)
            
            echo "   File deletion status: $file_status"
            echo "   Transactions deleted: $transactions"
        else
            echo "   ✗ Delete failed"
            error=$(echo "$delete_response" | jq -r '.error' 2>/dev/null)
            echo "   Error: $error"
        fi
    else
        echo "   ERROR: Failed to call delete endpoint"
    fi
else
    echo "3. Skipping DELETE test - no statement ID available"
fi
echo ""

# Step 4: Test cleanup endpoint
echo "4. Testing cleanup analysis..."
echo "   Endpoint: /api/statements/cleanup (GET)"
cleanup_response=$(make_request GET "/api/statements/cleanup")
if [ $? -eq 0 ]; then
    echo "   Cleanup analysis:"
    echo "$cleanup_response" | jq '.report | {
        database: .database,
        storage_supabase: .storage.supabase.isConfigured,
        storage_s3: .storage.s3.configured,
        recommendations: .recommendations
    }' 2>/dev/null || echo "$cleanup_response"
else
    echo "   ERROR: Failed to get cleanup analysis"
fi
echo ""

echo "========================================="
echo "Test completed"
echo "========================================="
echo ""
echo "To run a full test with authentication:"
echo "1. First login to get a session cookie"
echo "2. Export the session cookie to $COOKIE_FILE"
echo "3. Run this script"
echo ""
echo "Or use the development server with:"
echo "API_URL=http://localhost:3030 ./test-delete.sh"