import { test, expect, Page } from '@playwright/test';

const pages = [
  { path: '/', name: 'Dashboard' },
  { path: '/history', name: 'History' },
  { path: '/decks', name: 'Collections' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/sccs', name: 'SCCs' }
];

const expectedNavItems = [
  { testId: 'nav-dashboard', text: 'Data Sources' },
  { testId: 'nav-sccs', text: 'Sources' },
  { testId: 'nav-collections', text: 'Collections' },
  { testId: 'nav-history', text: 'History' },
  { testId: 'nav-analytics', text: 'Analytics' }
];

async function verifyNavigationConsistency(page: Page, pageName: string) {
  // Check that all navigation items are present
  for (const navItem of expectedNavItems) {
    const element = page.getByTestId(navItem.testId);
    await expect(element).toBeVisible({ timeout: 10000 });
    await expect(element).toContainText(navItem.text);
  }

  // Check that logout button is present
  const logoutButton = page.getByTestId('nav-logout');
  await expect(logoutButton).toBeVisible();
  await expect(logoutButton).toContainText('Logout');

  // Check that VUE Dashboard heading is present
  const heading = page.getByText('VUE Dashboard');
  await expect(heading).toBeVisible();
}

test.describe('Navigation Consistency', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any necessary authentication or base state
    await page.goto('/');
  });

  for (const pageInfo of pages) {
    test(`Navigation is consistent on ${pageInfo.name} page`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      
      // Verify navigation consistency
      await verifyNavigationConsistency(page, pageInfo.name);
    });
  }

  test('Navigation items are clickable and navigate correctly', async ({ page }) => {
    await page.goto('/');

    // Test each navigation item
    for (const navItem of expectedNavItems) {
      const element = page.getByTestId(navItem.testId);
      await element.click();
      await page.waitForLoadState('networkidle');
      
      // Verify navigation worked by checking URL
      const expectedPaths = {
        'nav-dashboard': '/',
        'nav-sccs': '/sccs',
        'nav-collections': '/decks',
        'nav-history': '/history',
        'nav-analytics': '/analytics'
      };
      
      const expectedPath = expectedPaths[navItem.testId as keyof typeof expectedPaths];
      await expect(page).toHaveURL(expectedPath);
      
      // Verify navigation is still consistent on the new page
      await verifyNavigationConsistency(page, navItem.text);
    }
  });

  test('Active navigation item is highlighted correctly', async ({ page }) => {
    for (const pageInfo of pages) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      
      // Find the corresponding nav item for current page
      const navItemMap = {
        '/': 'nav-dashboard',
        '/sccs': 'nav-sccs', 
        '/decks': 'nav-collections',
        '/history': 'nav-history',
        '/analytics': 'nav-analytics'
      };
      
      const activeNavTestId = navItemMap[pageInfo.path as keyof typeof navItemMap];
      if (activeNavTestId) {
        const activeNavItem = page.getByTestId(activeNavTestId);
        
        // Check that active nav item has primary intent or is visually distinct
        const classes = await activeNavItem.getAttribute('class');
        expect(classes).toContain('bp6-intent-primary');
      }
    }
  });

  test('Navigation labels are standardized across all pages', async ({ page }) => {
    const labelVerification = async (pagePath: string) => {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Verify specific standardized labels
      await expect(page.getByTestId('nav-dashboard')).toContainText('Data Sources');
      await expect(page.getByTestId('nav-sccs')).toContainText('Sources');
      await expect(page.getByTestId('nav-collections')).toContainText('Collections');
      await expect(page.getByTestId('nav-history')).toContainText('History');
      await expect(page.getByTestId('nav-analytics')).toContainText('Analytics');
    };

    // Test all pages have the same standardized labels
    for (const pageInfo of pages) {
      await labelVerification(pageInfo.path);
    }
  });
});