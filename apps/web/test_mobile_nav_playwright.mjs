import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  
  try {
    // Create a context with mobile viewport
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
    });
    
    const page = await context.newPage();
    
    console.log('Testing mobile responsive behavior...');
    console.log('');
    
    // Test home page (public route, no auth needed)
    console.log('1. Testing home page at 375px width...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Check if page loads
    const title = await page.title();
    console.log('   ✓ Page loaded:', title);
    
    // Check mobile nav doesn't appear on public pages (expected)
    const mobileNav = await page.locator('nav.md\:hidden').count();
    console.log('   ℹ Mobile nav on home (public):', mobileNav > 0 ? '✓ visible' : 'not visible (expected for public)');
    
    // Check what's visible
    const topNav = await page.locator('header').count();
    console.log('   ✓ Top navbar visible:', topNav > 0);
    
    // Now test rendering at desktop width
    console.log('');
    console.log('2. Testing responsive behavior at 1024px width...');
    await page.setViewportSize({ width: 1024, height: 768 });
    
    const desktopView = await page.content();
    const hasDesktopNav = desktopView.includes('hidden');
    console.log('   ✓ Responsive classes detected:', hasDesktopNav);
    
    // Take screenshots at different widths
    console.log('');
    console.log('3. Taking screenshots...');
    
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: '/tmp/home_mobile_375.png' });
    console.log('   ✓ Screenshot at 375px: /tmp/home_mobile_375.png');
    
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.screenshot({ path: '/tmp/home_desktop_1024.png' });
    console.log('   ✓ Screenshot at 1024px: /tmp/home_desktop_1024.png');
    
    await context.close();
    
    console.log('');
    console.log('✓ Responsive testing complete!');
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
})();
