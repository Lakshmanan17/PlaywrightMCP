import { strict as assert } from 'node:assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { PlaywrightWorld } from '../support/world';

Given('I am on the job search home page', async function (this: PlaywrightWorld) {
  await this.homePage.goto();
  assert.equal(await this.homePage.verifyHomePage(), true, 'Expected the home page to be displayed');
});

When(
  'I search for {string} in {string} near {string}',
  async function (this: PlaywrightWorld, jobTitle: string, industry: string, location: string) {
    await this.homePage.performJobSearch(jobTitle, industry, location);
  }
);

Then('I should see job search results matching my search', async function (this: PlaywrightWorld) {
  assert.equal(
    await this.homePage.verifySearchResultsPage(),
    true,
    'Expected the job search results page to be displayed'
  );
});

Then('the search URL should include the requested criteria', async function (this: PlaywrightWorld) {
  const searchUrl = await this.homePage.getPageUrl();
  assert.ok(searchUrl.includes('jobtitle=Software'), `Unexpected job title in URL: ${searchUrl}`);
  assert.ok(searchUrl.includes('category=17'), `Unexpected industry in URL: ${searchUrl}`);
  assert.ok(searchUrl.includes('location=Chennai'), `Unexpected location in URL: ${searchUrl}`);
});