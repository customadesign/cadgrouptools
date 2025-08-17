#!/bin/bash

echo "======================================"
echo "Supabase Delete Functionality Test"
echo "======================================"
echo ""

# Determine environment
BASE_URL="http://localhost:3030"
if [ "$1" == "prod" ]; then
  BASE_URL="https://cadgrouptools.onrender.com"
fi

echo "Testing against: $BASE_URL"
echo ""

# Function to make authenticated requests
test_delete() {
  echo "Running Supabase deletion tests..."
  echo "---------------------------------"
  
  # You'll need to be logged in for this to work
  # The test will use your session cookie
  
  curl -X POST "$BASE_URL/api/test-supabase-delete" \
    -H "Content-Type: application/json" \
    -d '{}' \
    --cookie-jar cookies.txt \
    --cookie cookies.txt \
    | python3 -m json.tool
}

# Run the test
test_delete

echo ""
echo "Test complete!"
echo ""
echo "Check the recommendations in the output above."
echo "Key things to verify:"
echo "1. Bucket name matches (should be 'cadgroupmgt')"
echo "2. Service role has delete permissions"
echo "3. All configuration tests pass"