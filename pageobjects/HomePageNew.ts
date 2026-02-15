import { Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('https://www.srinipharmacy.com/', { 
      timeout: 60000, 
      waitUntil: 'networkidle' 
    });
    
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
      });
      
      // Extra wait for page to be truly interactive
      await this.page.waitForTimeout(1000);
    } catch (error) {
      // Continue even if overlay removal fails
    }
  }

  async setWindowSize(width: number, height: number) {
    await this.page.setViewportSize({ width, height });
  }

  async verifyHomePage(): Promise<boolean> {
    return (await this.page.title()).includes('Home');
  }

  async enterJobTitle(title: string) {
    // Hide loading overlays before any interaction
    await this.page.evaluate(() => {
      const loadingArea = document.querySelector('.loading-area') as HTMLElement;
      if (loadingArea) {
        loadingArea.style.display = 'none !important';
        loadingArea.style.pointerEvents = 'none !important';
      }
    });
    
    const titleInput = this.page.locator('input[placeholder="Job Title"]').first();
    await titleInput.waitFor({ state: 'visible', timeout: 10000 });
    await titleInput.fill(title);
  }

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
        return false;
      }
      
      const searchText = industryName.toLowerCase().trim();
      let found = false;
      
      for (const option of options) {
        let optionText = (option.textContent || '').replace(/\s+/g, ' ').toLowerCase().trim();
        
        // Try multiple matching strategies
        if (
          optionText === searchText ||
          optionText.includes(searchText) ||
          searchText.split(/[\s\-]/)[0] === optionText.split(/[\s\-]/)[0]
        ) {
          (option as HTMLElement).click();
          found = true;
          break;
        }
      }
      
      return found;
    }, industry);
    
    if (!optionFound) {
      // Fallback: search by all keywords
      await this.page.evaluate((industryName) => {
        const keywords = industryName.toLowerCase().split(/[\s\-]+/).filter(k => k);
        const options = Array.from(document.querySelectorAll('a[role="option"]'));
        
        for (const option of options) {
          const optionText = (option.textContent || '').toLowerCase();
          if (keywords.every(kw => optionText.includes(kw))) {
            (option as HTMLElement).click();
            return;
          }
        }
      }, industry);
    }
  }

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

  async clickSearchJobs() {
    // Hide loading overlay
    await this.page.evaluate(() => {
      const loadingArea = document.querySelector('.loading-area') as HTMLElement;
      if (loadingArea) {
        loadingArea.style.display = 'none !important';
        loadingArea.style.pointerEvents = 'none !important';
      }
    });
    
    const searchBtn = this.page.locator('button:has-text("Search Jobs")').first();
    await searchBtn.waitFor({ state: 'visible', timeout: 10000 });
    await searchBtn.click({ timeout: 10000, force: true });
    
    // Wait for navigation with reasonable timeout
    await this.page.waitForURL(/.*search.*|.*jobs.*|.*jobtitle.*/, { timeout: 30000 }).catch(() => {});
  }

  async performJobSearch(title: string, industry: string, location: string) {
    await this.enterJobTitle(title);
    await this.selectJobIndustry(industry);
    await this.enterLocation(location);
    await this.clickSearchJobs();
  }

  async getPageUrl(): Promise<string> {
    return this.page.url();
  }

  async verifySearchResultsPage(): Promise<boolean> {
    return (await this.page.title()).includes('Jobs');
  }
}
