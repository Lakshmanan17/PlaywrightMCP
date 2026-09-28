import { After, Before, setDefaultTimeout, setWorldConstructor, World } from '@cucumber/cucumber';
import { Browser, chromium } from '@playwright/test';
import { HomePage } from '../pageobjects/HomePage';

setDefaultTimeout(60000);

export class PlaywrightWorld extends World {
  browser!: Browser;
  homePage!: HomePage;
}

setWorldConstructor(PlaywrightWorld);

Before(async function (this: PlaywrightWorld) {
  this.browser = await chromium.launch({ headless: true });
  const context = await this.browser.newContext({ viewport: { width: 1366, height: 768 } });
  this.homePage = new HomePage(await context.newPage());
});

After(async function (this: PlaywrightWorld) {
  await this.browser?.close();
});