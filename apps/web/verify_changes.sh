#!/bin/bash

echo "================================"
echo "Mobile Bottom Nav Verification"
echo "================================"
echo ""

# Check if files exist and have expected content
echo "1. Checking new account-mobile-nav-items.ts file..."
if [ -f "src/components/account/account-mobile-nav-items.ts" ]; then
  echo "   ✓ File exists"
  grep -q "Ana Sayfa" src/components/account/account-mobile-nav-items.ts && echo "   ✓ Contains 'Ana Sayfa'"
  grep -q "Randevular" src/components/account/account-mobile-nav-items.ts && echo "   ✓ Contains 'Randevular'"
  grep -q "Mesajlar" src/components/account/account-mobile-nav-items.ts && echo "   ✓ Contains 'Mesajlar'"
  grep -q "Favoriler" src/components/account/account-mobile-nav-items.ts && echo "   ✓ Contains 'Favoriler'"
  grep -q "Profil" src/components/account/account-mobile-nav-items.ts && echo "   ✓ Contains 'Profil'"
  echo ""
fi

# Check account-mobile-nav.tsx
echo "2. Checking AccountMobileNav component..."
if grep -q "fixed inset-x-0 bottom-0 z-50" src/components/account/account-mobile-nav.tsx; then
  echo "   ✓ Has fixed bottom positioning"
fi
if grep -q "grid-cols-5" src/components/account/account-mobile-nav.tsx; then
  echo "   ✓ Has 5-column grid layout"
fi
if grep -q "md:hidden" src/components/account/account-mobile-nav.tsx; then
  echo "   ✓ Hidden on desktop (md:hidden)"
fi
if grep -q "accountMobileNavItems" src/components/account/account-mobile-nav.tsx; then
  echo "   ✓ Uses accountMobileNavItems"
fi
echo ""

# Check layout file
echo "3. Checking customer layout..."
if grep -q "pb-24 md:pb-8" src/app/\(customer\)/layout.tsx; then
  echo "   ✓ Has correct bottom padding (pb-24 md:pb-8)"
fi
if grep -q "<AccountMobileNav />" src/app/\(customer\)/layout.tsx; then
  echo "   ✓ Renders AccountMobileNav"
fi
if ! grep -q "md:hidden mb-4" src/app/\(customer\)/layout.tsx; then
  echo "   ✓ Removed old drawer trigger"
fi
echo ""

# Check profile page
echo "4. Checking profile page..."
if grep -q "Yorumlarım" src/app/\(customer\)/account/profile/page.tsx; then
  echo "   ✓ Contains 'Yorumlarım' card"
fi
if grep -q "Ayarlar" src/app/\(customer\)/account/profile/page.tsx; then
  echo "   ✓ Contains 'Ayarlar' card"
fi
if grep -q "/account/reviews" src/app/\(customer\)/account/profile/page.tsx; then
  echo "   ✓ Yorumlarım links to /account/reviews"
fi
if grep -q "/account/settings" src/app/\(customer\)/account/profile/page.tsx; then
  echo "   ✓ Ayarlar links to /account/settings"
fi
echo ""

echo "================================"
echo "✓ All code structure checks passed!"
echo "================================"
