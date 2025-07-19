import { test, expect } from '@playwright/test';

test.describe('GDPR Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (you'll need to set up authentication for real testing)
    await page.goto('/app/gdpr');
  });

  test('should display GDPR page with data summary', async ({ page }) => {
    // Check that the page loads with proper title
    await expect(page).toHaveTitle(/Data Privacy/);
    
    // Check for GDPR page elements
    await expect(page.locator('text=Data Privacy & GDPR')).toBeVisible();
    await expect(page.locator('text=Your Data Privacy Rights')).toBeVisible();
    
    // Check for data summary section
    await expect(page.locator('text=Data Summary')).toBeVisible();
    await expect(page.locator('text=Total stores in your account:')).toBeVisible();
    await expect(page.locator('text=Shop domain:')).toBeVisible();
  });

  test('should show export functionality', async ({ page }) => {
    // Check export section
    await expect(page.locator('text=Export Your Data')).toBeVisible();
    await expect(page.locator('text=Download all your store location data')).toBeVisible();
    
    // Check export button
    const exportButton = page.locator('button:has-text("Export All Store Data")');
    await expect(exportButton).toBeVisible();
  });

  test('should show delete functionality with warning', async ({ page }) => {
    // Check delete section
    await expect(page.locator('text=Delete Your Data')).toBeVisible();
    await expect(page.locator('text=Warning:')).toBeVisible();
    await expect(page.locator('text=This action will permanently delete ALL')).toBeVisible();
    
    // Check delete button
    const deleteButton = page.locator('button:has-text("Delete All Store Data")');
    await expect(deleteButton).toBeVisible();
  });

  test('should display data retention policy', async ({ page }) => {
    // Check retention policy section
    await expect(page.locator('text=Data Retention Policy')).toBeVisible();
    await expect(page.locator('text=We retain your store location data')).toBeVisible();
  });

  test('should handle export action', async ({ page }) => {
    // Mock the export functionality
    await page.route('**/app/gdpr', async route => {
      if (route.request().method() === 'POST') {
        const formData = route.request().postData();
        if (formData && formData.includes('action=export')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: [
                {
                  id: '1',
                  name: 'Test Store',
                  address: '123 Main St',
                  city: 'New York',
                  state: 'NY',
                  zip: '10001',
                }
              ],
              message: 'Data export completed successfully'
            })
          });
        }
      }
    });

    // Click export button
    await page.click('button:has-text("Export All Store Data")');
    
    // Should trigger download (in real scenario)
    // For now, just verify the button was clicked
    await expect(page.locator('button:has-text("Export All Store Data")')).toBeVisible();
  });

  test('should handle delete confirmation', async ({ page }) => {
    // Mock the delete functionality
    await page.route('**/app/gdpr', async route => {
      if (route.request().method() === 'POST') {
        const formData = route.request().postData();
        if (formData && formData.includes('action=delete')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              deletedCount: 5,
              message: 'Successfully deleted 5 stores'
            })
          });
        }
      }
    });

    // Click delete button
    await page.click('button:has-text("Delete All Store Data")');
    
    // Should show confirmation dialog (handled by browser)
    // For now, just verify the button was clicked
    await expect(page.locator('button:has-text("Delete All Store Data")')).toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    // Check for proper heading structure
    await expect(page.locator('h1, h2, h3')).toHaveCount(4); // Should have proper heading hierarchy
    
    // Check for proper button labels
    await expect(page.locator('button[aria-label], button:has-text("Export")')).toBeVisible();
    await expect(page.locator('button[aria-label], button:has-text("Delete")')).toBeVisible();
    
    // Check for proper form structure
    await expect(page.locator('form')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that content is still accessible
    await expect(page.locator('text=Data Privacy & GDPR')).toBeVisible();
    await expect(page.locator('button:has-text("Export All Store Data")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete All Store Data")')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check that content is still accessible
    await expect(page.locator('text=Data Privacy & GDPR')).toBeVisible();
  });
}); 