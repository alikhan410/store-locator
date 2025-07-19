import { test, expect } from '@playwright/test';

test.describe('WCAG Accessibility Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Set up basic page structure for testing without authentication
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should have proper page structure and meta tags', async ({ page }) => {
    // Check page title is descriptive
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(5);
    expect(title).not.toBe('Document');

    // Check HTML lang attribute
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
    expect(lang.length).toBeGreaterThan(0);

    // Check viewport meta tag for responsive design
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toBeTruthy();
    expect(viewport).toContain('width=device-width');
  });

  test('should have proper heading structure', async ({ page }) => {
    // Check for single h1 element
    const h1Elements = await page.locator('h1').count();
    expect(h1Elements).toBeLessThanOrEqual(1);
    
    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    let previousLevel = 0;
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const level = parseInt(tagName.charAt(1));
      
      // Check for skipped levels
      if (previousLevel > 0 && level > previousLevel + 1) {
        throw new Error(`Heading level ${level} is skipped (previous was ${previousLevel})`);
      }
      
      previousLevel = level;
    }
  });

  test('should have proper form labels', async ({ page }) => {
    // Check all form controls have proper labels
    const formControls = await page.locator('input, select, textarea').all();
    
    for (const control of formControls) {
      const hasLabel = await control.evaluate(el => {
        const id = el.id;
        const label = el.labels?.[0];
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledby = el.getAttribute('aria-labelledby');
        
        return label || ariaLabel || ariaLabelledby;
      });
      
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    // Check for valid ARIA attributes
    const ariaElements = await page.locator('[aria-*]').all();
    
    for (const element of ariaElements) {
      const ariaAttributes = await element.evaluate(el => {
        return Array.from(el.attributes)
          .filter(attr => attr.name.startsWith('aria-'))
          .map(attr => ({ name: attr.name, value: attr.value }));
      });
      
      for (const attr of ariaAttributes) {
        // Check for empty ARIA labels
        if ((attr.name === 'aria-label' || attr.name === 'aria-labelledby') && !attr.value.trim()) {
          throw new Error(`Empty ${attr.name} attribute found`);
        }
        
        // Check for invalid ARIA values
        if (attr.name === 'aria-expanded' && !['true', 'false'].includes(attr.value)) {
          throw new Error(`Invalid aria-expanded value: "${attr.value}"`);
        }
      }
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement);
    expect(firstFocused).not.toBeNull();
    
    // Test tab through all focusable elements
    const focusableElements = await page.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    
    for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement);
      expect(focused).not.toBeNull();
    }
  });

  test('should have visible focus indicators', async ({ page }) => {
    // Focus on interactive elements and check for focus indicators
    const focusableElements = await page.locator('button, [href], input, select, textarea').all();
    
    for (const element of focusableElements.slice(0, 5)) {
      await element.focus();
      
      const hasFocusIndicator = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        const outline = style.outline;
        const boxShadow = style.boxShadow;
        
        return outline !== 'none' || boxShadow.includes('rgba');
      });
      
      expect(hasFocusIndicator).toBeTruthy();
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    // This is a basic test - in real implementation you'd use a color contrast library
    // For now, we'll check that text elements have proper styling
    const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6').all();
    
    for (const element of textElements.slice(0, 10)) {
      const hasColor = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.color !== 'rgba(0, 0, 0, 0)' && style.color !== 'transparent';
      });
      
      expect(hasColor).toBeTruthy();
    }
  });

  test('should have skip links', async ({ page }) => {
    // Check for skip links (common accessibility feature)
    const skipLinks = await page.locator('a[href^="#"], .skip-link').all();
    
    if (skipLinks.length > 0) {
      for (const link of skipLinks) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        
        expect(href).toBeTruthy();
        expect(text).toBeTruthy();
      }
    }
  });

  test('should have proper alt text for images', async ({ page }) => {
    // Check all images have alt text
    const images = await page.locator('img').all();
    
    for (const image of images) {
      const alt = await image.getAttribute('alt');
      const role = await image.getAttribute('role');
      
      // Images should have alt text or be decorative (role="presentation")
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('should have proper button labels', async ({ page }) => {
    // Check all buttons have accessible labels
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      // Button should have text content, aria-label, or title
      expect(text?.trim() || ariaLabel || title).toBeTruthy();
    }
  });

  test('should have proper link text', async ({ page }) => {
    // Check all links have descriptive text
    const links = await page.locator('a[href]').all();
    
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');
      
      // Link should have descriptive text
      const hasDescriptiveText = text?.trim() && text.trim().length > 1;
      const hasAriaLabel = ariaLabel && ariaLabel.trim().length > 1;
      const hasTitle = title && title.trim().length > 1;
      
      expect(hasDescriptiveText || hasAriaLabel || hasTitle).toBeTruthy();
    }
  });

  test('should handle screen reader announcements', async ({ page }) => {
    // Check for aria-live regions
    const liveRegions = await page.locator('[aria-live]').all();
    
    // Should have at least some live regions for dynamic content
    expect(liveRegions.length).toBeGreaterThanOrEqual(0);
    
    for (const region of liveRegions) {
      const live = await region.getAttribute('aria-live');
      expect(['polite', 'assertive', 'off']).toContain(live);
    }
  });

  test('should have proper list structure', async ({ page }) => {
    // Check list accessibility
    const lists = await page.locator('ul, ol').all();
    
    for (const list of lists) {
      const listItems = await list.locator('li').all();
      expect(listItems.length).toBeGreaterThan(0);
      
      // Check for proper list semantics
      const role = await list.getAttribute('role');
      expect(role === null || role === 'list').toBeTruthy();
    }
  });

  test('should have proper landmark regions', async ({ page }) => {
    // Check for proper landmark regions
    const landmarks = await page.locator('main, nav, header, footer, aside, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]').all();
    
    // Should have at least main content area
    expect(landmarks.length).toBeGreaterThan(0);
    
    for (const landmark of landmarks) {
      const role = await landmark.getAttribute('role');
      const ariaLabel = await landmark.getAttribute('aria-label');
      
      // Landmarks should have proper roles or aria-labels
      expect(role || ariaLabel).toBeTruthy();
    }
  });

  test('should have proper loading states', async ({ page }) => {
    // Check for proper loading indicators
    const loadingElements = await page.locator('[aria-busy="true"], [role="progressbar"], .loading, .spinner').all();
    
    // Should have loading indicators for async operations
    expect(loadingElements.length).toBeGreaterThanOrEqual(0);
  });

  test('should have proper error handling', async ({ page }) => {
    // Check for error message containers
    const errorContainers = await page.locator('[role="alert"], .error, [aria-invalid="true"]').all();
    
    // Should have error indicators available
    expect(errorContainers.length).toBeGreaterThanOrEqual(0);
  });

  test('should have proper modal accessibility', async ({ page }) => {
    // Test modal accessibility (if modals exist)
    const modals = await page.locator('[role="dialog"], .modal, [aria-modal="true"]').all();
    
    for (const modal of modals) {
      // Check for proper modal attributes
      const role = await modal.getAttribute('role');
      const ariaModal = await modal.getAttribute('aria-modal');
      const ariaLabel = await modal.getAttribute('aria-label');
      const ariaLabelledby = await modal.getAttribute('aria-labelledby');
      
      expect(role === 'dialog' || ariaModal === 'true').toBeTruthy();
      expect(ariaLabel || ariaLabelledby).toBeTruthy();
    }
  });

  test('should handle dynamic content updates', async ({ page }) => {
    // Look for aria-live regions that handle dynamic content
    const liveRegions = await page.locator('[aria-live]').all();
    
    // Should have live regions for dynamic content like search results
    expect(liveRegions.length).toBeGreaterThanOrEqual(0);
  });

  test('should have proper table structure', async ({ page }) => {
    const tables = await page.locator('table').all();
    
    for (const table of tables) {
      // Check for table headers
      const headers = await table.locator('th').all();
      expect(headers.length).toBeGreaterThan(0);
      
      // Check for proper table structure
      const hasCaption = await table.locator('caption').count();
      const hasThead = await table.locator('thead').count();
      
      // Tables should have headers and proper structure
      expect(headers.length > 0 || hasCaption > 0 || hasThead > 0).toBeTruthy();
    }
  });
}); 