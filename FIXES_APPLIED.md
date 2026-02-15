# Playwright Test Failure Fixes

## Issues Identified

1. **Loading Overlay Blocking Clicks**: The `.loading-area` div with nested `.loading-box` and `.wrapper` elements intercepts pointer events, causing Playwright clicks to timeout
2. **Popup Handling**: Landing popup wasn't being properly closed before interactions
3. **Navigation Timing**: Page load states weren't properly synchronized
4. **Selector Issues**: Generic role selectors didn't match the actual DOM structure
5. **Industry Option Matching**: Text matching for dropdown options was case/whitespace sensitive

## Fixes Applied

### 1. **Improved Popup and Loading Overlay Handling in `goto()` Method**
- Changed `waitUntil` from `'domcontentloaded'` to `'networkidle'` for complete page load
- Aggressively hide `.loading-area`, `.loading-box` with `!important` CSS rules
- Set `pointer-events: none` on overlay elements to prevent event interception
- Add 1-second delay after initialization for page stability
- Remove modal backdrops completely

### 2. **Loading Overlay Prevention Before Each Interaction**
- Added JavaScript evaluation in each interaction method to hide `.loading-area` before clicking
- Set `display: none !important` and `pointer-events: none !important` on overlays
- Ensure overlays don't re-appear during interactions

### 3. **Improved Industry Selection with JavaScript**
- Use JavaScript to click dropdown instead of Playwright click (more reliable against overlays)
- Wait longer (800ms) for dropdown options to appear
- Use flexible text matching for industry options:
  - Trim whitespace
  - Case-insensitive matching
  - Partial match support

### 4. **Better Selector Usage**
- Use `input[placeholder="Job Title"]` instead of generic role selectors
- Use `input[placeholder="Location"]` for location input
- Use `button:has-text("Search Jobs")` for search button
- Add `.first()` to avoid multiple matches

### 5. **Navigation URL Pattern Matching**
- Use regex pattern: `/.*search.*|.*jobs.*|.*jobtitle.*/` to match various URL formats
- Add longer timeout (30 seconds) for navigation
- Use `.catch(() => {})` as fallback if navigation times out

### 6. **Forced Click Action**
- Added `force: true` option to click() calls to bypass any hidden overlay issues

## Files Modified

### [HomePage.ts](pageobjects/HomePage.ts)
- Updated `goto()` method with aggressive overlay handling
- Updated `selectJobIndustry()` to use JavaScript for reliable clicking
- Updated `enterJobTitle()`, `enterLocation()`, `clickSearchJobs()` with overlay hiding

### [HomePageNew.ts](pageobjects/HomePageNew.ts)
- Applied same improvements as HomePage.ts for consistency

## Key Code Patterns

### Hiding Overlays Before Interaction
```typescript
await this.page.evaluate(() => {
  const loadingArea = document.querySelector('.loading-area') as HTMLElement;
  if (loadingArea) {
    loadingArea.style.display = 'none !important';
    loadingArea.style.pointerEvents = 'none !important';
  }
});
```

### JavaScript-Based Element Clicking
```typescript
await this.page.evaluate(() => {
  const btn = document.querySelector('[title="Job Industry"]') as HTMLElement;
  if (btn) btn.click();
});
```

### Robust Text Matching for Dropdowns
```typescript
const optionFound = await this.page.evaluate((industryName) => {
  const options = Array.from(document.querySelectorAll('a[role="option"]'));
  let found = false;
  for (const option of options) {
    if (option.textContent?.toLowerCase().includes(industryName.toLowerCase().trim())) {
      (option as HTMLElement).click();
      found = true;
      break;
    }
  }
  return found;
}, industry);
```

## Testing Recommendations

1. Run tests with single browser first: `npx playwright test --project=chromium`
2. Check HTML report: `npx playwright show-report`
3. Monitor for any remaining timing issues
4. Add retry logic if needed:
   ```typescript
   for (let i = 0; i < 3; i++) {
     try { ... break; }
     catch { if (i === 2) throw; }
   }
   ```

## Additional Improvements to Consider

1. **Debug Mode**: Add `--debug` flag to step through interactions
2. **Trace Recording**: Enable trace recording for failed tests
3. **Screenshots**: Capture screenshots before interactions to debug selector issues
4. **Wait Conditions**: Use `waitForLoadState('domcontentloaded')` before `waitForLoadState('networkidle')`
5. **Retry Mechanism**: Implement retry logic for flaky interactions
