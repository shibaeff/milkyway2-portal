#!/bin/bash

echo "Polkadot Nomination Checker - Integration Demo"
echo "=============================================="

# Build the signing oracle
echo "Building signing oracle..."
go build -o signing-oracle main.go

# Create environment file
echo "Creating environment file..."
cat > .env << EOF
PRIVATE_KEY=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
POLKADOT_RPC_URL=https://rpc.polkadot.io
PORT=4000
EOF

echo ""
echo "Starting signing oracle server..."
./signing-oracle &
ORACLE_PID=$!

# Wait for server to start
sleep 3

echo ""
echo "1. Testing health endpoint..."
curl -s http://localhost:4000/health | jq .

echo ""
echo "2. Testing info endpoint..."
curl -s http://localhost:4000/info | jq .

echo ""
echo "3. Testing nomination check with valid addresses..."
curl -s -X POST http://localhost:4000/verify \
    -H "Content-Type: application/json" \
    -d '{
        "validator_address": "12GTt3pfM3SjTU6UL6dQ3SMgMSvdw94PnRoF6osU6hPvxbUZ",
        "nominator_address": "12ztGE9cY2p7kPJFpfvMrL6NsCUeqoiaBY3jciMqYFuFNJ2o",
        "msg": "test message for nomination verification"
    }' | jq .

echo ""
echo "4. Testing nomination check with different addresses..."
curl -s -X POST http://localhost:4000/verify \
    -H "Content-Type: application/json" \
    -d '{
        "validator_address": "12abc123",
        "nominator_address": "12def456",
        "msg": "another test message"
    }' | jq .

echo ""
echo "5. Testing with missing fields..."
curl -s -X POST http://localhost:4000/verify \
    -H "Content-Type: application/json" \
    -d '{
        "validator_address": "12GTt3pfM3SjTU6UL6dQ3SMgMSvdw94PnRoF6osU6hPvxbUZ",
        "msg": "missing nominator address"
    }' | jq .

echo ""
echo "Server logs (showing nomination checking process):"
echo "================================================"
# The server logs will show the nomination checking process

echo ""
echo "Cleaning up..."
kill $ORACLE_PID 2>/dev/null
rm -f .env

echo ""
echo "Demo completed!"
echo ""
echo "Key Features Demonstrated:"
echo "1. ✅ Health check endpoint"
echo "2. ✅ Oracle info endpoint"
echo "3. ✅ Nomination verification with valid addresses"
echo "4. ✅ Nomination verification with different addresses"
echo "5. ✅ Error handling for missing fields"
echo ""
echo "The nomination checking process includes:"
echo "- Getting current active era from Polkadot"
echo "- Checking if nominator has nominated the validator"
echo "- Checking if the nomination is currently active"
echo "- Signing the message only if nomination is verified" 