#!/bin/bash

echo "Testing Polkadot Nomination Checker Integration"
echo "================================================"

# Check if the signing oracle binary exists
if [ ! -f "./signing-oracle" ]; then
    echo "Building signing oracle..."
    go build -o signing-oracle main.go
fi

# Create a test request
cat > test_request.json << EOF
{
    "validator_address": "12GTt3pfM3SjTU6UL6dQ3SMgMSvdw94PnRoF6osU6hPvxbUZ",
    "nominator_address": "12ztGE9cY2p7kPJFpfvMrL6NsCUeqoiaBY3jciMqYFuFNJ2o",
    "msg": "test message for nomination verification"
}
EOF

echo "Test request created:"
cat test_request.json
echo ""

echo "Starting signing oracle in background..."
# Start the signing oracle in background
./signing-oracle &
ORACLE_PID=$!

# Wait a moment for the server to start
sleep 2

echo "Testing /health endpoint..."
curl -s http://localhost:4000/health | jq .

echo ""
echo "Testing /info endpoint..."
curl -s http://localhost:4000/info | jq .

echo ""
echo "Testing /verify endpoint with nomination check..."
curl -s -X POST http://localhost:4000/verify \
    -H "Content-Type: application/json" \
    -d @test_request.json | jq .

echo ""
echo "Cleaning up..."
kill $ORACLE_PID
rm -f test_request.json

echo "Test completed!" 