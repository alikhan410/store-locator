# Accessibility Implementation Guide

## Overview

The Store Locator app implements comprehensive WCAG 2.1 AA compliance to ensure the application is accessible to all users, including those with disabilities. This document outlines the accessibility features, testing strategies, and compliance measures implemented.

## WCAG 2.1 AA Compliance Standards

### Perceivable
- **Text Alternatives**: All images have alt text or are marked as decorative
- **Time-based Media**: Audio/video content has captions or transcripts
- **Adaptable**: Content can be presented in different ways without losing structure
- **Distinguishable**: Text and images have sufficient contrast ratios

### Operable
- **Keyboard Accessible**: All functionality is available from a keyboard
- **Enough Time**: Users have enough time to read and use content
- **Seizures**: Content doesn't cause seizures or physical reactions
- **Navigable**: Users can navigate, find content, and determine where they are

### Understandable
- **Readable**: Text is readable and understandable
- **Predictable**: Pages operate in predictable ways
- **Input Assistance**: Users are helped to avoid and correct mistakes

### Robust
- **Compatible**: Content is compatible with current and future user tools

## Implementation Details

### 1. Accessibility Helper System

**File**: `app/helper/accessibility.js`

The accessibility helper provides comprehensive WCAG compliance checking and utilities:

```javascript
// Check WCAG compliance for any element
const report = accessibilityHelper.checkWCAGCompliance(element);

// Generate accessibility report
const report = accessibilityHelper.generateAccessibilityReport(document.body);

// Announce changes to screen readers
accessibilityHelper.announceToScreenReader('Page loaded successfully');
```

#### Key Features:
- **Color Contrast Analysis**: Calculates contrast ratios and validates WCAG requirements
- **Heading Structure Validation**: Ensures proper heading hierarchy (h1 → h2 → h3)
- **Form Label Association**: Checks for proper form labels and ARIA attributes
- **Keyboard Navigation Testing**: Validates focus management and tab order
- **ARIA Attribute Validation**: Ensures proper ARIA usage and values

### 2. Screen Reader Support

#### ARIA Labels and Descriptions
```jsx
<TextField
  name="name"
  label="Store Name"
  aria-required="true"
  aria-describedby="name-error"
/>
```

#### Live Regions
```jsx
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

#### Skip Links
```jsx
// Automatically added to all pages
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

### 3. Keyboard Navigation

#### Focus Management
- **Visible Focus Indicators**: All interactive elements have clear focus styles
- **Focus Trapping**: Modals trap focus to prevent users from tabbing outside
- **Skip Links**: Allow keyboard users to jump to main content
- **Logical Tab Order**: Tab order follows visual layout

#### Implementation:
```javascript
// Focus management for modals
const cleanup = accessibilityUtils.focusModal(modalElement);

// Trap focus in container
const cleanup = accessibilityHelper.trapFocus(container);
```

### 4. Form Accessibility

#### Required Field Indicators
```jsx
<TextField
  name="name"
  label={
    <>
      Store Name <span style={{ color: "#d82c0d" }}>*</span>
    </>
  }
  aria-required="true"
  aria-describedby="name-error"
/>
```

#### Error Associations
```jsx
<input 
  aria-invalid="true" 
  aria-describedby="error-message"
/>
<div id="error-message" role="alert">
  This field is required
</div>
```

#### Help Text
```jsx
<TextField
  name="phone"
  label="Phone Number"
  aria-describedby="phone-help"
/>
<div id="phone-help" className="help-text">
  Enter phone number in format: (555) 123-4567
</div>
```

### 5. Color and Contrast

#### WCAG AA Requirements:
- **Normal Text**: 4.5:1 contrast ratio
- **Large Text**: 3:1 contrast ratio (18px+ or 14px+ bold)

#### Implementation:
```css
/* High contrast focus indicators */
*:focus {
  outline: 2px solid #007cba !important;
  outline-offset: 2px !important;
}

/* Error states with sufficient contrast */
input[aria-invalid="true"] {
  border-color: #d82c0d !important;
  box-shadow: 0 0 0 1px #d82c0d !important;
}
```

### 6. Mobile Accessibility

#### Touch Targets
```css
/* Ensure minimum 44px touch targets on mobile */
@media (max-width: 768px) {
  button,
  input[type="button"],
  input[type="submit"],
  a {
    min-height: 44px;
    min-width: 44px;
  }
}
```

#### Font Size
```css
/* Prevent zoom on iOS */
.form-group input,
.form-group select,
.form-group textarea {
  font-size: 16px;
}
```

## Testing Strategy

### 1. Automated Testing

**File**: `tests/e2e/accessibility.spec.js`

Comprehensive Playwright tests covering all WCAG criteria:

```javascript
test('should have proper heading structure', async ({ page }) => {
  const h1Elements = await page.locator('h1').count();
  expect(h1Elements).toBeLessThanOrEqual(1);
});

test('should be keyboard navigable', async ({ page }) => {
  await page.keyboard.press('Tab');
  const firstFocused = await page.evaluate(() => document.activeElement);
  expect(firstFocused).not.toBeNull();
});
```

#### Test Coverage:
- **Heading Structure**: Validates proper h1-h6 hierarchy
- **Form Labels**: Checks all form controls have proper labels
- **ARIA Attributes**: Validates ARIA usage and values
- **Keyboard Navigation**: Tests tab order and focus management
- **Color Contrast**: Basic contrast validation
- **Image Alt Text**: Ensures all images have alt text
- **Link Accessibility**: Validates descriptive link text
- **Error Handling**: Tests error message associations

### 2. Unit Testing

**File**: `tests/unit/helper/accessibility.test.js`

Tests for the accessibility helper system:

```javascript
describe('AccessibilityHelper', () => {
  it('should detect heading structure issues', () => {
    const badElement = document.createElement('div');
    badElement.innerHTML = '<h1>Title 1</h1><h1>Title 2</h1>';
    
    const result = helper.checkWCAGCompliance(badElement);
    const headingIssues = result.issues.filter(issue => issue.type === 'heading');
    
    expect(headingIssues.length).toBeGreaterThan(0);
  });
});
```

### 3. Manual Testing Checklist

#### Screen Reader Testing
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)
- [ ] Test with VoiceOver (macOS)
- [ ] Test with TalkBack (Android)

#### Keyboard Navigation
- [ ] Navigate entire app using only Tab key
- [ ] Test all interactive elements with Enter/Space
- [ ] Verify focus indicators are visible
- [ ] Test skip links functionality

#### Color and Contrast
- [ ] Test with high contrast mode
- [ ] Test with color blindness simulation
- [ ] Verify sufficient contrast ratios
- [ ] Test with reduced motion preferences

## Accessibility Features by Component

### 1. Navigation (`app/routes/app.jsx`)
- **Skip Links**: Automatically added to all pages
- **ARIA Labels**: Descriptive labels for all navigation links
- **Landmark Regions**: Proper main, nav, and header elements
- **Page Announcements**: Screen reader announcements for page changes

### 2. Forms (`app/routes/app.add-store.jsx`)
- **Required Field Indicators**: Visual and ARIA indicators
- **Error Associations**: Proper error message linking
- **Help Text**: Contextual help for complex fields
- **Keyboard Navigation**: Full keyboard accessibility

### 3. Data Tables (`app/routes/app.view-stores.jsx`)
- **Table Headers**: Proper th elements with scope attributes
- **Row Selection**: ARIA attributes for selection state
- **Pagination**: Accessible pagination controls
- **Sorting**: ARIA attributes for sortable columns

### 4. Maps (`app/routes/app.map.jsx`)
- **Fallback Content**: Text alternatives when maps unavailable
- **Keyboard Controls**: Keyboard navigation for map interactions
- **Screen Reader Support**: Descriptive text for map features
- **Loading States**: Accessible loading indicators

## Compliance Monitoring

### 1. Automated Compliance Checking
```javascript
// Run accessibility audit
const report = accessibilityUtils.validatePage();
console.log('Accessibility Score:', report.score);
console.log('Issues Found:', report.issues.length);
```

### 2. Continuous Integration
- Accessibility tests run on every pull request
- Compliance score must be above 90% to merge
- Automated reporting of accessibility issues

### 3. Regular Audits
- Monthly accessibility audits using automated tools
- Quarterly manual testing with screen readers
- Annual comprehensive accessibility review

## Best Practices

### 1. Semantic HTML
```jsx
// Good
<main role="main" aria-label="Store management dashboard">
  <h1>Store Management</h1>
  <section aria-labelledby="stores-heading">
    <h2 id="stores-heading">Your Stores</h2>
  </section>
</main>

// Avoid
<div>
  <div>Store Management</div>
  <div>Your Stores</div>
</div>
```

### 2. ARIA Usage
```jsx
// Good - Use native HTML when possible
<button onClick={handleClick}>Save</button>

// Good - Use ARIA when native HTML isn't sufficient
<div role="button" tabIndex={0} onClick={handleClick}>
  Save
</div>

// Avoid - Don't override native semantics
<button role="text">Save</button>
```

### 3. Error Handling
```jsx
// Good
<TextField
  aria-invalid={hasError}
  aria-describedby={hasError ? "error-message" : undefined}
/>
{hasError && (
  <div id="error-message" role="alert">
    This field is required
  </div>
)}

// Avoid
<TextField />
{hasError && <div>Error</div>}
```

## Resources

### Tools
- **axe-core**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Chrome DevTools accessibility audit
- **NVDA**: Free screen reader for testing

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Web Accessibility Initiative](https://www.w3.org/WAI/)

### Testing
- [Accessibility Testing Guide](https://www.w3.org/WAI/ER/tools/)
- [Screen Reader Testing](https://www.w3.org/WAI/GL/mobile-a11y-tf/wiki/Screen_Reader_Testing)
- [Color Contrast Tools](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

## Maintenance

### Regular Tasks
1. **Monthly**: Run automated accessibility tests
2. **Quarterly**: Manual testing with screen readers
3. **Annually**: Comprehensive accessibility audit
4. **On Release**: Accessibility testing for new features

### Monitoring
- Track accessibility score over time
- Monitor user feedback for accessibility issues
- Stay updated with WCAG guidelines
- Test with new assistive technologies

This accessibility implementation ensures the Store Locator app is usable by everyone, regardless of their abilities or the technology they use to access the web. 