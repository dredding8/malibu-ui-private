import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  // Launch browser and handle webpack overlay
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to the app
  await page.goto(baseURL!);
  
  // Wait for the app to load
  await page.waitForLoadState('networkidle');
  
  // Remove webpack dev server overlay if it exists
  await page.evaluate(() => {
    // Remove webpack dev server overlay
    const overlay = document.getElementById('webpack-dev-server-client-overlay');
    if (overlay) {
      overlay.remove();
    }
    
    // Remove webpack dev server overlay by class
    const webpackOverlays = document.querySelectorAll('[id*="webpack"], [class*="webpack"]');
    webpackOverlays.forEach(overlay => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });
    
    // Remove any iframe overlays
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      if (iframe.src.includes('about:blank') && iframe.id.includes('webpack')) {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }
    });
    
    // Ensure the app is properly loaded
    const root = document.getElementById('root');
    if (root && root.children.length === 0) {
      console.warn('Root element is empty - app may not be loaded');
    }
  });
  
  // Add CSS to hide any potential overlays
  await page.addStyleTag({
    content: `
      #webpack-dev-server-client-overlay,
      iframe[src*="about:blank"],
      [id*="webpack-dev-server"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        z-index: -9999 !important;
      }
    `
  });
  
  await browser.close();
}

export default globalSetup;
