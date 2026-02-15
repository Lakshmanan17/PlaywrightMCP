import { test, expect } from '@playwright/test';
import { HomePage } from '../pageobjects/HomePage';

test.describe('Home Page Job Search Workflow', () => {
  test('should perform job search with Software Testing, Civil Construction, and Chennai location', async ({ page }) => {
    const homePage = new HomePage(page);

    // Step 1: Navigate to the home page
    await homePage.goto();

    // Step 2: Set the browser window size to 1366 × 768
    await homePage.setWindowSize(1366, 768);

    // Step 3: Verify the user is on the home page after initialization
    const isHomePage = await homePage.verifyHomePage();
    expect(isHomePage).toBe(true);

    // Step 4: Perform job search
    await homePage.performJobSearch('Software Testing', 'CIVIL Construction', 'Chennai');

    // Step 5: Verify search was completed with correct parameters
    const url = await homePage.getPageUrl();
    expect(url).toContain('jobtitle=Software');
    expect(url).toContain('category=17'); // 17 is the category ID for Civil Construction
    expect(url).toContain('location=Chennai');

    // Step 6: Verify the page navigated to search results page
    const isJobsPage = await homePage.verifySearchResultsPage();
    expect(isJobsPage).toBe(true);
  });
});
