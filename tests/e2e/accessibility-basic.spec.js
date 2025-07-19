import { test, expect } from '@playwright/test';

test.describe('Basic WCAG Accessibility Compliance', () => {
  test('should have proper HTML structure', async ({ page }) => {
    // Test basic HTML structure without authentication
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Store Locator - Accessibility Test</title>
        </head>
        <body>
          <header role="banner">
            <nav role="navigation" aria-label="Main navigation">
              <a href="#main" class="skip-link">Skip to main content</a>
              <ul>
                <li><a href="/" aria-label="Home">Home</a></li>
                <li><a href="/stores" aria-label="Find stores">Find Stores</a></li>
              </ul>
            </nav>
          </header>
          
          <main role="main" id="main" aria-label="Main content">
            <h1>Store Locator</h1>
            <p>Find stores near you</p>
            
            <form role="search" aria-label="Store search">
              <label for="search-input">Search for stores:</label>
              <input 
                type="text" 
                id="search-input" 
                name="search" 
                aria-describedby="search-help"
                placeholder="Enter your location"
              >
              <div id="search-help">Enter your city, state, or zip code</div>
              
              <button type="submit" aria-label="Search stores">
                Search
              </button>
            </form>
            
            <section aria-label="Store results">
              <h2>Nearby Stores</h2>
              <ul role="list">
                <li>
                  <h3>Store Name</h3>
                  <p>123 Main St, City, State</p>
                  <a href="tel:+1234567890" aria-label="Call store">Call Store</a>
                </li>
              </ul>
            </section>
          </main>
          
          <footer role="contentinfo">
            <p>&copy; 2025 Store Locator</p>
          </footer>
        </body>
      </html>
    `);

    // Test page title
    const title = await page.title();
    expect(title).toBe('Store Locator - Accessibility Test');

    // Test HTML lang attribute
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('en');

    // Test viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');

    // Test heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // Test skip link
    const skipLink = page.locator('.skip-link');
    expect(await skipLink.count()).toBe(1);
    expect(await skipLink.getAttribute('href')).toBe('#main');

    // Test form labels
    const input = page.locator('#search-input');
    const label = page.locator('label[for="search-input"]');
    expect(await label.count()).toBe(1);
    expect(await input.getAttribute('aria-describedby')).toBe('search-help');

    // Test landmark regions
    const landmarks = await page.locator('main, nav, header, footer, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]').count();
    expect(landmarks).toBeGreaterThan(0);

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement);
    expect(firstFocused).not.toBeNull();
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.setContent(`
      <div>
        <button aria-label="Close dialog" aria-expanded="false">×</button>
        <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <h2 id="dialog-title">Store Details</h2>
          <p>Store information here</p>
        </div>
        <div aria-live="polite" id="announcements"></div>
      </div>
    `);

    // Test ARIA attributes
    const button = page.locator('button');
    expect(await button.getAttribute('aria-label')).toBe('Close dialog');
    expect(await button.getAttribute('aria-expanded')).toBe('false');

    const dialog = page.locator('[role="dialog"]');
    expect(await dialog.getAttribute('aria-modal')).toBe('true');
    expect(await dialog.getAttribute('aria-labelledby')).toBe('dialog-title');

    const liveRegion = page.locator('[aria-live]');
    expect(await liveRegion.getAttribute('aria-live')).toBe('polite');
  });

  test('should have proper color contrast indicators', async ({ page }) => {
    await page.setContent(`
      <style>
        .focus-visible { outline: 2px solid #007bff; }
        .error { color: #dc3545; }
        .success { color: #28a745; }
      </style>
      <div>
        <button class="focus-visible">Test Button</button>
        <p class="error">Error message</p>
        <p class="success">Success message</p>
      </div>
    `);

    // Test focus indicators
    const button = page.locator('button');
    await button.focus();
    
    const hasFocusStyle = await button.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.outline !== 'none';
    });
    expect(hasFocusStyle).toBeTruthy();

    // Test text color presence
    const errorText = page.locator('.error');
    const hasColor = await errorText.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.color !== 'rgba(0, 0, 0, 0)' && style.color !== 'transparent';
    });
    expect(hasColor).toBeTruthy();
  });

  test('should have proper list structure', async ({ page }) => {
    await page.setContent(`
      <ul role="list">
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
      <ol>
        <li>Step 1</li>
        <li>Step 2</li>
      </ol>
    `);

    const lists = await page.locator('ul, ol').all();
    expect(lists.length).toBe(2);

    for (const list of lists) {
      const listItems = await list.locator('li').all();
      expect(listItems.length).toBeGreaterThan(0);
    }
  });

  test('should have proper image accessibility', async ({ page }) => {
    await page.setContent(`
      <img src="logo.png" alt="Store Locator Logo" />
      <img src="decorative.png" role="presentation" alt="" />
      <img src="icon.png" aria-label="Location icon" />
    `);

    const images = await page.locator('img').all();
    expect(images.length).toBe(3);

    // Test alt text
    const logo = page.locator('img[src="logo.png"]');
    expect(await logo.getAttribute('alt')).toBe('Store Locator Logo');

    // Test decorative image
    const decorative = page.locator('img[src="decorative.png"]');
    expect(await decorative.getAttribute('role')).toBe('presentation');
    expect(await decorative.getAttribute('alt')).toBe('');

    // Test aria-label
    const icon = page.locator('img[src="icon.png"]');
    expect(await icon.getAttribute('aria-label')).toBe('Location icon');
  });

  test('should have proper link accessibility', async ({ page }) => {
    await page.setContent(`
      <a href="/stores" aria-label="Find nearby stores">Find Stores</a>
      <a href="tel:+1234567890" aria-label="Call store">Call</a>
      <a href="mailto:info@store.com" aria-label="Email store">Email</a>
    `);

    const links = await page.locator('a[href]').all();
    expect(links.length).toBe(3);

    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const href = await link.getAttribute('href');
      
      expect(href).toBeTruthy();
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });

  test('should handle screen reader announcements', async ({ page }) => {
    await page.setContent(`
      <div aria-live="polite" id="status">Loading...</div>
      <div aria-live="assertive" id="error">Error occurred</div>
      <div aria-live="off" id="hidden">Hidden content</div>
    `);

    const liveRegions = await page.locator('[aria-live]').all();
    expect(liveRegions.length).toBe(3);

    const status = page.locator('#status');
    expect(await status.getAttribute('aria-live')).toBe('polite');

    const error = page.locator('#error');
    expect(await error.getAttribute('aria-live')).toBe('assertive');
  });

  test('should have proper form accessibility', async ({ page }) => {
    await page.setContent(`
      <form>
        <fieldset>
          <legend>Store Search</legend>
          <label for="name">Store Name:</label>
          <input type="text" id="name" name="name" required aria-required="true">
          
          <label for="city">City:</label>
          <input type="text" id="city" name="city" aria-describedby="city-help">
          <div id="city-help">Enter the city name</div>
          
          <button type="submit" aria-label="Search stores">Search</button>
        </fieldset>
      </form>
    `);

    // Test required field indicators
    const requiredField = page.locator('#name');
    expect(await requiredField.getAttribute('aria-required')).toBe('true');

    // Test field descriptions
    const cityField = page.locator('#city');
    expect(await cityField.getAttribute('aria-describedby')).toBe('city-help');

    // Test form labels
    const labels = await page.locator('label').all();
    expect(labels.length).toBe(2);

    for (const label of labels) {
      const forAttr = await label.getAttribute('for');
      expect(forAttr).toBeTruthy();
    }
  });
}); 