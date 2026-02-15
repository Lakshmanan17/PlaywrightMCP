import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the home page with proper wait conditions
   */
  async goto(baseUrl: string = 'https://www.srinipharmacy.com/') {
    await this.page.goto(baseUrl, { timeout: 60000, waitUntil: 'networkidle' });
    
    // Aggressively hide loading overlays and popups
    try {
      await this.page.evaluate(() => {
        // Remove landing popup
        const landingPopup = document.getElementById('landingPopup');
        if (landingPopup) landingPopup.remove();
        
        // Hide and prevent loading area from showing
        const loadingArea = document.querySelector('.loading-area') as HTMLElement;
        if (loadingArea) {
          loadingArea.style.display = 'none !important';
          loadingArea.style.visibility = 'hidden !important';
          loadingArea.style.pointerEvents = 'none !important';
        }
        
        // Hide loading boxes
        const loadingBoxes = document.querySelectorAll('.loading-box');
        loadingBoxes.forEach((box: Element) => {
          (box as HTMLElement).style.display = 'none !important';
          (box as HTMLElement).style.visibility = 'hidden !important';
          (box as HTMLElement).style.pointerEvents = 'none !important';
        });
        
        // Remove modal backdrops
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(bd => bd.remove());
        
        // Prevent loading area from being shown
        const originalSetAttribute = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function(name: string, value: string) {
          if (this.classList.contains('loading-area') || this.classList.contains('loading-box')) {
            if (name === 'style') return;
            if (name === 'class' && value.includes('show')) return;
          }
          return originalSetAttribute.call(this, name, value);
        };
      });
      
      // Extra wait for page to be truly interactive
      await this.page.waitForTimeout(1000);
    } catch (error) {
      // Continue even if overlay removal fails
    }
  }

  /**
   * Set the browser window size to specified dimensions
   */
  async setWindowSize(width: number, height: number) {
    await this.page.setViewportSize({ width, height });
  }

  /**
   * Verify that user is on the Home page
   */
  async verifyHomePage(): Promise<boolean> {
    const pageTitle = await this.page.title();
    return pageTitle.includes('Home');
  }

  /**
   * Enter job title in the search field
   */
  async enterJobTitle(jobTitle: string) {
    // Hide loading overlays before any interaction
    await this.page.evaluate(() => {
      const loadingArea = document.querySelector('.loading-area') as HTMLElement;
      if (loadingArea) {
        loadingArea.style.display = 'none !important';
        loadingArea.style.pointerEvents = 'none !important';
      }
    });
    
    const jobTitleInput = this.page.locator('input[placeholder="Job Title"]').first();
    await jobTitleInput.waitFor({ state: 'visible', timeout: 10000 });
    await jobTitleInput.fill(jobTitle);
  }

  /**
   * Select job industry from the dropdown
   */
  async selectJobIndustry(industry: string) {
    // Hide loading overlay immediately before interaction
    await this.page.evaluate(() => {
      const loadingArea = document.querySelector('.loading-area') as HTMLElement;
      if (loadingArea) {
        loadingArea.style.display = 'none !important';
        loadingArea.style.visibility = 'hidden !important';
        loadingArea.style.pointerEvents = 'none !important';
      }
      const loadingBoxes = document.querySelectorAll('.loading-box, .wrapper');
      loadingBoxes.forEach((box: Element) => {
        (box as HTMLElement).style.display = 'none !important';
      });
    });
    
    // Click dropdown using JavaScript (more reliable than regular click)
    await this.page.evaluate(() => {
      const dropdownBtn = document.querySelector('[title="Job Industry"]') as HTMLElement;
      if (dropdownBtn) {
        dropdownBtn.click();
      }
    });
    
    // Wait longer for dropdown options to appear and become visible
    await this.page.waitForTimeout(1200);
    
    // Find and click the correct industry option
    const optionFound = await this.page.evaluate((industryName) => {
      const options = Array.from(document.querySelectorAll('a[role="option"]'));
      
      if (options.length === 0) {
        console.log('No options found');
        return false;
      }
      
      const searchText = industryName.toLowerCase().trim();
      let found = false;
      
      for (const option of options) {
        let optionText = (option.textContent || '').replace(/\s+/g, ' ').toLowerCase().trim();
        
        // Debug log
        console.log(`Option text: "${optionText}" vs search: "${searchText}"`);
        
        // Try multiple matching strategies
        if (
          optionText === searchText ||
          optionText.includes(searchText) ||
          searchText.includes(optionText.split(' ')[0])
        ) {
          console.log(`Matched option: ${optionText}`);
          (option as HTMLElement).click();
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.log(`All available options: ${options.map(o => o.textContent).join(', ')}`);
      }
      
      return found;
    }, industry);
    
    if (!optionFound) {
      // Try alternative: search for text containing key words
      const textAlternative = await this.page.evaluate((industryName) => {
        const keywords = industryName.toLowerCase().split(' ');
        const options = Array.from(document.querySelectorAll('a[role="option"]'));
        
        for (const option of options) {
          const optionText = (option.textContent || '').toLowerCase();
          if (keywords.every(kw => optionText.includes(kw))) {
            (option as HTMLElement).click();
            return true;
          }
        }
        return false;
      }, industry);
      
      if (!textAlternative) {
        throw new Error(`Industry option "${industry}" not found in dropdown`);
      }
    }
  }

  /**
   * Enter location in the search field
   */
  async enterLocation(location: string) {
    // Hide loading overlay
    await this.page.evaluate(() => {
      const loadingArea = document.querySelector('.loading-area') as HTMLElement;
      if (loadingArea) {
        loadingArea.style.display = 'none !important';
        loadingArea.style.pointerEvents = 'none !important';
      }
    });
    
    const locationInput = this.page.locator('input[placeholder="Location"]').first();
    await locationInput.waitFor({ state: 'visible', timeout: 10000 });
    await locationInput.fill(location);
  }

  /**
   * Click the Search Jobs button
   */
  async clickSearchJobs() {
    // Hide loading overlay
    await this.page.evaluate(() => {
      const loadingArea = document.querySelector('.loading-area') as HTMLElement;
      if (loadingArea) {
        loadingArea.style.display = 'none !important';
        loadingArea.style.pointerEvents = 'none !important';
      }
    });
    
    const searchButton = this.page.locator('button:has-text("Search Jobs")').first();
    await searchButton.waitFor({ state: 'visible', timeout: 10000 });
    await searchButton.click({ timeout: 10000, force: true });
    
    // Wait for navigation with reasonable timeout
    await this.page.waitForURL(/.*search.*|.*jobs.*|.*jobtitle.*/, { timeout: 30000 }).catch(() => {});
  }

  /**
   * Perform complete job search workflow
   */
  async performJobSearch(jobTitle: string, industry: string, location: string) {
    await this.enterJobTitle(jobTitle);
    await this.selectJobIndustry(industry);
    await this.enterLocation(location);
    await this.clickSearchJobs();
  }

  /**
   * Get the current URL to verify search parameters
   */
  async getPageUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Verify search results page is displayed
   */
  async verifySearchResultsPage(): Promise<boolean> {
    const pageTitle = await this.page.title();
    return pageTitle.includes('Jobs');
  }
}
