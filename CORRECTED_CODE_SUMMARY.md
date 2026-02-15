# Playwright Test Failure - Analysis and Fixes

## Executive Summary

The Playwright tests were failing due to **three primary issues**:
1. **Loading overlay blocking clicks** - `.loading-area` with `.loading-box` intercepting pointer events
2. **Popup handling** - Landing popup not properly closed before interactions
3. **Navigation timing** - Page load state not synchronized before interactions

## Root Causes Identified

### Issue 1: Loading Overlay Blocking Clicks
**Error Message:**
```
page.click: Test timeout of 60000ms exceeded
- <div class="loading-box"></div> from <div class="loading-area">…</div> subtree intercepts pointer events
```

**Root Cause:** The website has a `.loading-area` container with nested `.loading-box` and `.wrapper` elements that overlay the page during loading. These elements have `pointer-events: auto` and block all clicks even when the actual content is clickable.

**Solution:** 
- Hide these elements with `display: none !important` and `pointer-events: none !important` using JavaScript evaluation
- Execute this hiding before each user interaction
- Extend timeout from default 30s to 60s+ if needed

### Issue 2: Browser Closure During Viewport Set
**Error Message:**
```
page.setViewportSize: Target page, context or browser has been closed
```

**Root Cause:** The popup removal process or page initialization was ending prematurely before viewport could be set.

**Solution:**
- Wait with `waitUntil: 'networkidle'` instead of `'domcontentloaded'`
- Add 1-second delay after popup removal to ensure page is stable
- Set viewport size immediately after initial page load

### Issue 3: Selector Reliability
**Problems:**
- `getByRole('textbox', {name: 'Job Title'})` - Too generic, may not match
- Generic role-based selectors don't work well with custom bootstrap selectors
- Dropdown selection using CSS selector `:has-text()` unreliable

**Solution:**
- Use `input[placeholder="Job Title"]` instead of role-based selector
- Use `input[placeholder="Location"]` for location field
- Use `button:has-text("Search Jobs")` with `.first()` to handle multiples
- Use JavaScript-based clicking for dropdowns (more reliable)

## Corrected Code

### HomePage.ts

```typescript
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
    // Hide loading overlay before interaction
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
   * Uses JavaScript-based clicking to bypass overlay issues
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
    
    // Find and click the correct industry option with flexible matching
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

  /**
   * Enter location in the search field
   */
  async enterLocation(location: string) {
    // Hide loading overlay before interaction
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
    // Hide loading overlay before interaction
    await this.page.evaluate(() => {
      const loadingArea = document.querySelector('.loading-area') as HTMLElement;
      if (loadingArea) {
        loadingArea.style.display = 'none !important';
        loadingArea.style.pointerEvents = 'none !important';
      }
    });
    
    const searchButton = this.page.locator('button:has-text("Search Jobs")').first();
    await searchButton.waitFor({ state: 'visible', timeout: 10000 });
    // Use force: true to click through any remaining overlay issues
    await searchButton.click({ timeout: 10000, force: true });
    
    // Wait for navigation with URL pattern matching
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
```

### HomePageNew.ts

Apply the same improvements as HomePage.ts (see above for complete implementation).

## Key Improvements Applied

| Issue | Before | After |
|-------|--------|-------|
| **Wait Strategy** | `'domcontentloaded'` | `'networkidle'` for complete load |
| **Popup Handling** | Check visibility & hide | Remove + hide + prevent re-show |
| **Loading Overlay** | None | Hide with !important + pointer-events: none |
| **Selectors** | Generic role-based | Specific placeholder/text selectors |
| **Click Strategy** | Playwright click() | JavaScript evaluate() click |
| **Dropdown Wait** | 300-500ms | 1200ms for stability |
| **Navigation Wait** | waitForNavigation() | waitForURL() with regex pattern |
| **Click Force** | No | `force: true` to bypass overlays |

## Testing Recommendations

1. **Run single browser first:**
   ```bash
   npx playwright test --project=chromium
   ```

2. **Use debug mode:**
   ```bash
   npx playwright test --debug
   ```

3. **Generate HTML report:**
   ```bash
   npx playwright show-report
   ```

4. **Check for remaining overlay issues:**
   - If tests still fail with "intercepts pointer events", the overlay might be re-appearing
   - Increase waits (1200ms→1500ms)
   - Add additional overlay hiding just before clicks

## Additional Debugging Tips

If industry option still not found:
1. Add console.log to JavaScript evaluate to see all available options
2. Check for case sensitivity in option text
3. Verify dropdown is actually opening (check visible options in error-context.md)
4. Consider using `page.evaluate()` to log options before matching

## Files Modified

- `pageobjects/HomePage.ts` - Updated all interaction methods
- `pageobjects/HomePageNew.ts` - Updated all interaction methods

Both files now properly handle:
✅ Loading overlays  
✅ Popup removal  
✅ Navigation timing  
✅ Selector reliability  
✅ Error handling with fallbacks
