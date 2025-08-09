#!/bin/bash

# Test script for the signing oracle with delegation verification

echo "=== Signing Oracle Test ==="

# Set environment variables
export PRIVATE_KEY="1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
export PORT="4000"

# Start the server in background
echo "Starting signing oracle server..."
./signing-oracle &
SERVER_PID=$!

# Wait for server to start
sleep 2

echo ""
echo "=== Testing Oracle Info ==="
curl -s http://localhost:4000/info | jq '.'

echo ""
echo "=== Testing Health Check ==="
curl -s http://localhost:4000/health | jq '.'

echo ""
echo "=== Testing Delegation Verification ==="
echo "Note: This will fail because the addresses are not real Polkadot addresses"
echo "In a real scenario, you would use actual Polkadot addresses"

# Test with dummy addresses (this will fail verification)
curl -s -X POST http://localhost:4000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "validator_address": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "nominator_address": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "msg": "Test message for delegation verification"
  }' | jq '.'

echo ""
echo "=== Testing with Valid Polkadot Addresses ==="
echo "Note: Replace these with actual Polkadot addresses for real testing"

# Example with Polkadot-style addresses (this will also fail but shows the format)
curl -s -X POST http://localhost:4000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "validator_address": "15oF4uVJwmo4TdGW7V2QxgbgiBvLkDJPcFgYjjhhjYGCHkq",
    "nominator_address": "15oF4uVJwmo4TdGW7V2QxgbgiBvLkDJPcFgYjjhhjYGCHkq",
    "msg": "Test message with Polkadot addresses"
  }' | jq '.'

echo ""
echo "=== Server Logs ==="
echo "Check the server logs above for verification details"

# Clean up
echo ""
echo "=== Cleaning up ==="
kill $SERVER_PID
echo "Server stopped"

echo ""
echo "=== Test Complete ==="
echo "To test with real Polkadot addresses:"
echo "1. Get actual validator and nominator addresses from Polkadot"
echo "2. Replace the addresses in the curl commands above"
echo "3. Run the test again" 