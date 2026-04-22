#!/bin/bash

echo "================================"
echo "Deployment Debug Script"
echo "================================"
echo ""

echo "1. Checking secrets..."
npx wrangler secret list
echo ""

echo "2. Checking wrangler.toml configuration..."
grep -A 5 "\[vars\]" wrangler.toml
echo ""

echo "3. Testing deployment..."
echo "   Visit your worker URL and check the error"
echo "   Then run: npx wrangler tail"
echo ""

echo "================================"
echo "Next Steps:"
echo "================================"
echo "1. Verify TIDB_CONNECTION_STRING is in the secrets list above"
echo "2. If missing, run: npx wrangler secret put TIDB_CONNECTION_STRING"
echo "3. Check logs with: npx wrangler tail"
echo "4. Visit your app to trigger the error"
echo "5. Look for detailed error messages in the logs"
echo ""
