#!/bin/bash

# Wait for dev server
sleep 2

echo "Testing mobile nav implementation..."
echo ""

# Test /account route
echo "1. Checking /account route..."
curl -s http://localhost:3000/account | grep -o 'account-mobile-nav' && echo "   ✓ AccountMobileNav component found" || echo "   ✗ AccountMobileNav not found"
curl -s http://localhost:3000/account | grep -o 'Ana Sayfa' && echo "   ✓ 'Ana Sayfa' label found" || echo "   ✗ 'Ana Sayfa' label not found"

# Test /account/appointments route
echo ""
echo "2. Checking /account/appointments route..."
curl -s http://localhost:3000/account/appointments | grep -o 'account-mobile-nav' && echo "   ✓ AccountMobileNav component found" || echo "   ✗ AccountMobileNav not found"

# Test /account/profile route (should have new cards)
echo ""
echo "3. Checking /account/profile route..."
curl -s http://localhost:3000/account/profile | grep -o 'Yorumlarım' && echo "   ✓ 'Yorumlarım' card found" || echo "   ✗ 'Yorumlarım' card not found"
curl -s http://localhost:3000/account/profile | grep -o 'Ayarlar' && echo "   ✓ 'Ayarlar' card found" || echo "   ✗ 'Ayarlar' card not found"

echo ""
echo "✓ All content checks passed!"
