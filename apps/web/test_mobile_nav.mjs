import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.createContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 1,
});

const page = await context.newPage();

// Test /account route
console.log('Testing /account route...');
await page.goto('http://localhost:3000/account', { waitUntil: 'networkidle' });
const hasBottomNav = await page.locator('nav.md\:hidden').count() > 0;
const navItems = await page.locator('nav.md\:hidden a').count();
console.log(`✓ Bottom nav visible: ${hasBottomNav}`);
console.log(`✓ Nav items visible: ${navItems}`);

// Test /account/appointments route
console.log('\nTesting /account/appointments route...');
await page.goto('http://localhost:3000/account/appointments', { waitUntil: 'networkidle' });
const appointmentsNav = await page.locator('nav.md\:hidden').count() > 0;
console.log(`✓ Bottom nav visible on appointments: ${appointmentsNav}`);

// Test /account/profile route
console.log('\nTesting /account/profile route...');
await page.goto('http://localhost:3000/account/profile', { waitUntil: 'networkidle' });
const profileNav = await page.locator('nav.md\:hidden').count() > 0;
const profileCards = await page.locator('a[href="/account/reviews"]').count();
const settingsCards = await page.locator('a[href="/account/settings"]').count();
console.log(`✓ Bottom nav visible on profile: ${profileNav}`);
console.log(`✓ Yorumlarım card visible: ${profileCards > 0}`);
console.log(`✓ Ayarlar card visible: ${settingsCards > 0}`);

// Take a screenshot at /account
console.log('\nTaking screenshot at /account...');
await page.goto('http://localhost:3000/account', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/mobile_nav_account.png' });
console.log('Screenshot saved to /tmp/mobile_nav_account.png');

await browser.close();
console.log('\n✓ All tests passed!');
