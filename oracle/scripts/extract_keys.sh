#!/bin/bash

# Extract private key in hex format (only the private key part)
echo "=== Private Key (Hex Format) ==="
PRIVATE_KEY_HEX=$(openssl ec -in private_key.pem -text -noout | grep -A 32 "priv:" | grep -v "priv:" | head -n 8 | tr -d ':' | tr -d ' ' | tr -d '\n')
echo $PRIVATE_KEY_HEX
echo ""

# Extract public key in hex format
echo "=== Public Key (Hex Format) ==="
PUBLIC_KEY_HEX=$(openssl ec -in private_key.pem -text -noout | grep -A 32 "pub:" | grep -v "pub:" | head -n 8 | tr -d ':' | tr -d ' ' | tr -d '\n')
echo $PUBLIC_KEY_HEX
echo ""

# Show the private key for environment variable
echo "=== For Environment Variable ==="
echo "export PRIVATE_KEY=$PRIVATE_KEY_HEX"
echo ""

# Show the public key for verification
echo "=== Public Key (for verification) ==="
echo $PUBLIC_KEY_HEX
echo ""

echo "=== Usage Instructions ==="
echo "1. Set the environment variable:"
echo "   export PRIVATE_KEY=$PRIVATE_KEY_HEX"
echo ""
echo "2. Run the signing oracle:"
echo "   go run main.go"
echo ""
echo "3. The oracle will be available at:"
echo "   http://localhost:4000"
echo ""
echo "4. Get oracle info:"
echo "   curl http://localhost:4000/info" 