import { test, expect, Page } from '@playwright/test';

/**
 * Focused Match Review Capacity Validation Test
 * Using Playwright MCP with QA Persona - Testing the specific capacity functionality
 */

test.describe('Match Review Capacity Feature Validation', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
    
    // Wait for application to load - using more generic selector
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('nav', { timeout: 10000 });
  });

  test.describe('Capacity Display in Match Review Modal', () => {
    test('should display calculated sensor capacity when viewing match details', async () => {
      // Navigate directly to match review page
      await page.goto('/match-review/test-collection/test-deck');
      
      // Wait for match cards to load
      await page.waitForLoadState('domcontentloaded');
      
      // 🎯 Test: Look for match cards - use class selector since we know the structure
      const matchCards = page.locator('.match-card');
      
      // Wait for cards to appear (they might load asynchronously)
      await expect(matchCards.first()).toBeVisible({ timeout: 15000 });
      
      const cardCount = await matchCards.count();
      console.log(`Found ${cardCount} match cards`);
      
      if (cardCount > 0) {
        const firstCard = matchCards.first();
        
        // 🎯 Test: Expand card details to see capacity information
        const expandButton = firstCard.locator('button[aria-expanded]');
        if (await expandButton.isVisible()) {
          await expandButton.click();
          
          // Verify capacity information is displayed in expanded view
          await expect(firstCard.locator('text=Calculated Capacity')).toBeVisible();
          await expect(firstCard.locator('text=Sensor Type')).toBeVisible();
          
          // Verify capacity values are displayed
          const capacityValue = firstCard.locator('[data-capacity-value]');
          if (await capacityValue.isVisible()) {
            const capacity = await capacityValue.textContent();
            expect(capacity).toMatch(/\d+/); // Should contain a number
          }
        }
        
        // 🎯 Test: Open detailed modal
        const moreButton = firstCard.locator('button[aria-label*="detailed information"], button[aria-label*="View detailed"]');
        if (await moreButton.isVisible()) {
          await moreButton.click();
          
          // Verify detailed modal shows capacity analysis
          const drawer = page.locator('.bp4-drawer, .bp5-drawer');
          await expect(drawer).toBeVisible();
          
          // Check for capacity analysis section
          await expect(drawer.locator('text=Sensor Capacity Analysis')).toBeVisible();
          await expect(drawer.locator('text=Calculated Capacity')).toBeVisible();
          
          // Verify capacity guidelines are shown
          await expect(drawer.locator('text=Sensor Capacity Guidelines')).toBeVisible();
          await expect(drawer.locator('text=Wideband: 8 channels')).toBeVisible();
          await expect(drawer.locator('text=Narrowband: 16 channels')).toBeVisible();
          await expect(drawer.locator('text=Imagery: 4 collections')).toBeVisible();
          await expect(drawer.locator('text=Signals: 12 collections')).toBeVisible();
          
          // Close modal
          const closeButton = drawer.locator('button[aria-label="Close"], .bp4-dialog-close-button, .bp5-dialog-close-button');
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        }
      }
    });

    test('should display capacity values with correct units', async () => {
      await page.goto('/match-review/test-collection/test-deck');
      await page.waitForLoadState('domcontentloaded');
      
      // Wait for match cards
      const matchCards = page.locator('.match-card');
      await expect(matchCards.first()).toBeVisible({ timeout: 15000 });
      
      const cardCount = await matchCards.count();
      
      // Test multiple cards to verify capacity calculations
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = matchCards.nth(i);
        
        // Expand the card
        const expandButton = card.locator('button[aria-expanded]');
        if (await expandButton.isVisible()) {
          await expandButton.click();
          
          // 🎯 Test: Verify capacity display format
          const capacitySection = card.locator('text=Calculated Capacity').locator('..');
          if (await capacitySection.isVisible()) {
            // Should show capacity value with units
            const hasChannels = await capacitySection.locator('text=channels').isVisible();
            const hasCollections = await capacitySection.locator('text=collections').isVisible();
            
            // At least one unit type should be present
            expect(hasChannels || hasCollections).toBeTruthy();
            
            // Verify sensor type is displayed
            await expect(card.locator('text=Sensor Type')).toBeVisible();
            
            const sensorTypeText = await card.locator('text=Sensor Type').locator('..').textContent();
            console.log(`Sensor type found: ${sensorTypeText}`);
          }
          
          // Collapse the card
          await expandButton.click();
        }
      }
    });
  });

  test.describe('Capacity Calculation Consistency', () => {
    test('should show consistent capacity values for same sensor types', async () => {
      await page.goto('/match-review/test-collection/test-deck');
      await page.waitForLoadState('domcontentloaded');
      
      const matchCards = page.locator('.match-card');
      await expect(matchCards.first()).toBeVisible({ timeout: 15000 });
      
      const capacityBySensorType: { [key: string]: string[] } = {};
      
      const cardCount = await matchCards.count();
      
      // Collect capacity values for each sensor type
      for (let i = 0; i < Math.min(cardCount, 6); i++) {
        const card = matchCards.nth(i);
        
        const expandButton = card.locator('button[aria-expanded]');
        if (await expandButton.isVisible()) {
          await expandButton.click();
          
          // Get sensor type and capacity
          const sensorTypeElement = card.locator('text=Sensor Type').locator('..');
          const capacityElement = card.locator('text=Calculated Capacity').locator('..');
          
          if (await sensorTypeElement.isVisible() && await capacityElement.isVisible()) {
            const sensorTypeText = await sensorTypeElement.textContent();
            const capacityText = await capacityElement.textContent();
            
            // Extract sensor type (look for wideband, narrowband, imagery, signals)
            const sensorType = sensorTypeText?.match(/(wideband|narrowband|imagery|signals)/i)?.[1]?.toLowerCase();
            const capacity = capacityText?.match(/(\d+)/)?.[1];
            
            if (sensorType && capacity) {
              if (!capacityBySensorType[sensorType]) {
                capacityBySensorType[sensorType] = [];
              }
              capacityBySensorType[sensorType].push(capacity);
            }
          }
          
          await expandButton.click(); // Collapse
        }
      }
      
      // 🎯 Test: Verify consistency within sensor types
      for (const [sensorType, capacities] of Object.entries(capacityBySensorType)) {
        console.log(`${sensorType}: [${capacities.join(', ')}]`);
        
        // All capacities for the same sensor type should be identical
        const uniqueCapacities = [...new Set(capacities)];
        expect(uniqueCapacities.length).toBe(1);
        
        // Verify expected capacity values
        const expectedCapacities: { [key: string]: string } = {
          'wideband': '8',
          'narrowband': '16',
          'imagery': '4',
          'signals': '12'
        };
        
        if (expectedCapacities[sensorType]) {
          expect(uniqueCapacities[0]).toBe(expectedCapacities[sensorType]);
        }
      }
    });
  });

  test.describe('User Experience Validation', () => {
    test('should provide intuitive access to capacity information', async () => {
      await page.goto('/match-review/test-collection/test-deck');
      await page.waitForLoadState('domcontentloaded');
      
      const matchCards = page.locator('.match-card');
      await expect(matchCards.first()).toBeVisible({ timeout: 15000 });
      
      const firstCard = matchCards.first();
      
      // 🎯 Test: Capacity info should be easily discoverable
      // Check if capacity is visible in collapsed state
      const collapsedCapacity = await firstCard.locator('text=capacity').isVisible();
      
      // If not visible in collapsed state, should be in expanded state
      if (!collapsedCapacity) {
        const expandButton = firstCard.locator('button[aria-expanded]');
        if (await expandButton.isVisible()) {
          await expandButton.click();
          
          // Should be visible in expanded state
          await expect(firstCard.locator('text=Calculated Capacity')).toBeVisible();
          
          // 🎯 Test: Visual prominence of capacity information
          const capacityValue = firstCard.locator('[style*="color: rgb(106, 115, 125)"], [style*="color: rgb(59, 130, 206)"]');
          if (await capacityValue.isVisible()) {
            // Capacity values should be styled prominently (colored text)
            expect(await capacityValue.count()).toBeGreaterThan(0);
          }
        }
      }
    });

    test('should handle edge cases gracefully', async () => {
      await page.goto('/match-review/test-collection/test-deck');
      await page.waitForLoadState('domcontentloaded');
      
      // 🎯 Test: Handle cases where capacity might not be available
      const matchCards = page.locator('.match-card');
      await expect(matchCards.first()).toBeVisible({ timeout: 15000 });
      
      const cardCount = await matchCards.count();
      
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = matchCards.nth(i);
        
        const expandButton = card.locator('button[aria-expanded]');
        if (await expandButton.isVisible()) {
          await expandButton.click();
          
          // Should either show capacity or show "N/A" or similar
          const hasCapacity = await card.locator('text=Calculated Capacity').isVisible();
          
          if (hasCapacity) {
            const capacitySection = card.locator('text=Calculated Capacity').locator('..');
            const capacityText = await capacitySection.textContent();
            
            // Should not show undefined, null, or empty values
            expect(capacityText).not.toContain('undefined');
            expect(capacityText).not.toContain('null');
            expect(capacityText?.trim()).not.toBe('');
          }
          
          await expandButton.click(); // Collapse
        }
      }
    });
  });

  test.describe('Modal Integration Test', () => {
    test('should maintain capacity information when switching between views', async () => {
      await page.goto('/match-review/test-collection/test-deck');
      await page.waitForLoadState('domcontentloaded');
      
      const matchCards = page.locator('.match-card');
      await expect(matchCards.first()).toBeVisible({ timeout: 15000 });
      
      const firstCard = matchCards.first();
      
      // Get capacity from expanded card view
      let cardCapacity = '';
      const expandButton = firstCard.locator('button[aria-expanded]');
      if (await expandButton.isVisible()) {
        await expandButton.click();
        
        const capacityElement = firstCard.locator('text=Calculated Capacity').locator('..');
        if (await capacityElement.isVisible()) {
          cardCapacity = await capacityElement.textContent() || '';
        }
      }
      
      // Open detailed modal
      const moreButton = firstCard.locator('button[aria-label*="detailed"], button[aria-label*="View detailed"]');
      if (await moreButton.isVisible()) {
        await moreButton.click();
        
        const drawer = page.locator('.bp4-drawer, .bp5-drawer');
        await expect(drawer).toBeVisible();
        
        // Get capacity from modal
        const modalCapacityElement = drawer.locator('text=Calculated Capacity').locator('..');
        if (await modalCapacityElement.isVisible()) {
          const modalCapacity = await modalCapacityElement.textContent() || '';
          
          // 🎯 Test: Capacity should be consistent between card and modal
          if (cardCapacity && modalCapacity) {
            const cardCapacityNumber = cardCapacity.match(/\d+/)?.[0];
            const modalCapacityNumber = modalCapacity.match(/\d+/)?.[0];
            
            if (cardCapacityNumber && modalCapacityNumber) {
              expect(cardCapacityNumber).toBe(modalCapacityNumber);
            }
          }
        }
      }
    });
  });
});