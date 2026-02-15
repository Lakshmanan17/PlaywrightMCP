import { test, expect } from '@playwright/test';
import { HomePage } from '../pageobjects/HomePageNew';

test('Job Search Workflow', async ({ page }) => {
  const homePage = new HomePage(page);

  // Navigate and setup
  await homePage.goto();
  await homePage.setWindowSize(1366, 768);
  
  // Verify on home page
  const isHome = await homePage.verifyHomePage();
  expect(isHome).toBe(true);

  // Perform search
  await homePage.performJobSearch('Software Testing', 'CIVIL Construction', 'Chennai');

  // Verify results
  const url = await homePage.getPageUrl();
  expect(url).toContain('jobtitle=Software');
  expect(url).toContain('category=17');
  expect(url).toContain('location=Chennai');

  const isJobsPage = await homePage.verifySearchResultsPage();
  expect(isJobsPage).toBe(true);
});
