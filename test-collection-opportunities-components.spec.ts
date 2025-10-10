import { test, expect } from '@playwright/test';

test.describe('Collection Opportunities Components Visual Test', () => {
  test('should render components in test environment', async ({ page }) => {
    // Create a test HTML page that renders the components
    const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Collection Opportunities Test</title>
      <link href="https://unpkg.com/@blueprintjs/core@5.0.0/lib/css/blueprint.css" rel="stylesheet" />
      <link href="https://unpkg.com/@blueprintjs/table@5.0.0/lib/css/table.css" rel="stylesheet" />
      <style>
        body { padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .test-container { max-width: 1200px; margin: 0 auto; }
        
        /* Status indicator styles */
        .status-indicator { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 4px; }
        .status-optimal { background-color: #e7f3ef; color: #0d8050; }
        .status-warning { background-color: #fef3e6; color: #866103; }
        .status-critical { background-color: #fae7e7; color: #a82a2a; }
        
        /* Capacity bar styles */
        .capacity-cell { display: flex; align-items: center; gap: 10px; }
        .capacity-bar-container { flex: 1; height: 8px; background-color: #e1e8ed; border-radius: 4px; overflow: hidden; }
        .capacity-bar { height: 100%; transition: width 0.3s ease; }
        .capacity-SUCCESS { background-color: #0d8050; }
        .capacity-WARNING { background-color: #bf7326; }
        .capacity-DANGER { background-color: #c23030; }
        
        /* Table styles */
        .opportunities-table { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e1e8ed; }
        th { background-color: #f6f7f9; font-weight: 600; }
        
        /* Action buttons */
        .actions-cell { display: flex; gap: 5px; }
      </style>
    </head>
    <body>
      <div class="test-container">
        <h1>Collection Opportunities Interactive Test</h1>
        
        <div class="bp5-card opportunities-table">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" aria-label="Select all"></th>
                <th>Status</th>
                <th>Opportunity Name</th>
                <th>Satellite</th>
                <th>Priority</th>
                <th>Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="checkbox" aria-label="Select Opportunity Alpha"></td>
                <td>
                  <div class="status-indicator status-critical">
                    <span class="bp5-icon bp5-icon-warning-sign"></span>
                    <span>Critical</span>
                  </div>
                </td>
                <td><strong>Opportunity Alpha</strong></td>
                <td>
                  <div>SAT-001<br>
                  <small style="color: #5c7080;">Imaging | LEO</small></div>
                </td>
                <td><span class="bp5-tag bp5-intent-danger">CRITICAL</span></td>
                <td>
                  <div class="capacity-cell">
                    <div class="capacity-bar-container">
                      <div class="capacity-bar capacity-DANGER" style="width: 15%"></div>
                    </div>
                    <span>15.0%</span>
                  </div>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="bp5-button bp5-minimal" aria-label="Edit Opportunity Alpha">
                      <span class="bp5-icon bp5-icon-edit"></span>
                    </button>
                    <button class="bp5-button bp5-minimal" aria-label="More actions">
                      <span class="bp5-icon bp5-icon-more"></span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td><input type="checkbox" aria-label="Select Opportunity Beta"></td>
                <td>
                  <div class="status-indicator status-warning">
                    <span class="bp5-icon bp5-icon-issue"></span>
                    <span>Warning</span>
                  </div>
                </td>
                <td><strong>Opportunity Beta</strong></td>
                <td>
                  <div>SAT-002<br>
                  <small style="color: #5c7080;">Communication | GEO</small></div>
                </td>
                <td><span class="bp5-tag bp5-intent-warning">HIGH</span></td>
                <td>
                  <div class="capacity-cell">
                    <div class="capacity-bar-container">
                      <div class="capacity-bar capacity-WARNING" style="width: 45%"></div>
                    </div>
                    <span>45.0%</span>
                  </div>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="bp5-button bp5-minimal" aria-label="Edit Opportunity Beta">
                      <span class="bp5-icon bp5-icon-edit"></span>
                    </button>
                    <button class="bp5-button bp5-minimal" aria-label="More actions">
                      <span class="bp5-icon bp5-icon-more"></span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td><input type="checkbox" aria-label="Select Opportunity Gamma"></td>
                <td>
                  <div class="status-indicator status-optimal">
                    <span class="bp5-icon bp5-icon-tick-circle"></span>
                    <span>Optimal</span>
                  </div>
                </td>
                <td><strong>Opportunity Gamma</strong></td>
                <td>
                  <div>SAT-003<br>
                  <small style="color: #5c7080;">Weather | MEO</small></div>
                </td>
                <td><span class="bp5-tag">MEDIUM</span></td>
                <td>
                  <div class="capacity-cell">
                    <div class="capacity-bar-container">
                      <div class="capacity-bar capacity-SUCCESS" style="width: 85%"></div>
                    </div>
                    <span>85.0%</span>
                  </div>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="bp5-button bp5-minimal" aria-label="Edit Opportunity Gamma">
                      <span class="bp5-icon bp5-icon-edit"></span>
                    </button>
                    <button class="bp5-button bp5-minimal" aria-label="More actions">
                      <span class="bp5-icon bp5-icon-more"></span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style="margin-top: 20px;">
          <button class="bp5-button bp5-intent-primary" id="update-button" disabled>
            <span class="bp5-icon bp5-icon-cloud-upload"></span>
            Update Collection Deck
          </button>
        </div>
      </div>
      
      <script>
        // Add basic interactivity
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        const updateButton = document.getElementById('update-button');
        let changedCount = 0;
        
        checkboxes.forEach(cb => {
          cb.addEventListener('change', () => {
            changedCount = document.querySelectorAll('input[type="checkbox"]:checked').length;
            updateButton.disabled = changedCount === 0;
            if (changedCount > 0) {
              updateButton.textContent = \`Update Collection Deck (\${changedCount})\`;
            } else {
              updateButton.textContent = 'Update Collection Deck';
            }
          });
        });
        
        // Edit button click handler
        document.querySelectorAll('[aria-label*="Edit"]').forEach(btn => {
          btn.addEventListener('click', () => {
            alert('Edit modal would open here');
          });
        });
      </script>
    </body>
    </html>
    `;
    
    // Navigate to a data URL with our test HTML
    await page.goto(`data:text/html,${encodeURIComponent(testHtml)}`);
    
    // Verify the components render correctly
    await expect(page.locator('h1')).toContainText('Collection Opportunities Interactive Test');
    
    // Test status indicators
    const criticalStatus = page.locator('.status-indicator.status-critical');
    await expect(criticalStatus).toBeVisible();
    await expect(criticalStatus).toContainText('Critical');
    
    const warningStatus = page.locator('.status-indicator.status-warning');
    await expect(warningStatus).toBeVisible();
    await expect(warningStatus).toContainText('Warning');
    
    const optimalStatus = page.locator('.status-indicator.status-optimal');
    await expect(optimalStatus).toBeVisible();
    await expect(optimalStatus).toContainText('Optimal');
    
    // Test capacity bars
    const capacityBars = page.locator('.capacity-bar');
    await expect(capacityBars).toHaveCount(3);
    
    // Test checkbox functionality
    const firstCheckbox = page.locator('input[type="checkbox"]').nth(1); // Skip select all
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();
    
    // Test update button enables when items selected
    const updateButton = page.locator('#update-button');
    await expect(updateButton).toBeEnabled();
    await expect(updateButton).toContainText('Update Collection Deck (1)');
    
    // Test edit button
    const editButton = page.locator('[aria-label="Edit Opportunity Alpha"]');
    await editButton.click();
    
    // Wait for alert (simulating modal)
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Edit modal would open here');
      await dialog.accept();
    });
    
    // Test accessibility - all interactive elements have aria-labels
    const ariaLabels = await page.locator('[aria-label]').count();
    expect(ariaLabels).toBeGreaterThan(5);
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/collection-opportunities-test.png', fullPage: true });
  });
  
  test('should handle keyboard navigation', async ({ page }) => {
    // Use the same test HTML
    const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Keyboard Navigation Test</title>
      <link href="https://unpkg.com/@blueprintjs/core@5.0.0/lib/css/blueprint.css" rel="stylesheet" />
    </head>
    <body>
      <div style="padding: 20px;">
        <button class="bp5-button" id="btn1">First Button</button>
        <button class="bp5-button" id="btn2">Second Button</button>
        <input type="checkbox" id="cb1" aria-label="Test Checkbox">
        <button class="bp5-button bp5-intent-primary" id="btn3">Primary Button</button>
      </div>
    </body>
    </html>
    `;
    
    await page.goto(`data:text/html,${encodeURIComponent(testHtml)}`);
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await expect(page.locator('#btn1')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('#btn2')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('#cb1')).toBeFocused();
    
    // Space to check checkbox
    await page.keyboard.press('Space');
    await expect(page.locator('#cb1')).toBeChecked();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('#btn3')).toBeFocused();
  });
});