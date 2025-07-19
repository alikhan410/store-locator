// Accessibility Helper System for WCAG Compliance
// This ensures the app meets WCAG 2.1 AA standards

export class AccessibilityHelper {
  constructor() {
    this.focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.headingTags = 'h1, h2, h3, h4, h5, h6';
  }

  // WCAG 2.1 AA Compliance Checker
  checkWCAGCompliance(element) {
    const issues = [];
    
    // Check color contrast
    const contrastIssues = this.checkColorContrast(element);
    issues.push(...contrastIssues);
    
    // Check heading structure
    const headingIssues = this.checkHeadingStructure(element);
    issues.push(...headingIssues);
    
    // Check form labels
    const labelIssues = this.checkFormLabels(element);
    issues.push(...labelIssues);
    
    // Check keyboard navigation
    const keyboardIssues = this.checkKeyboardNavigation(element);
    issues.push(...keyboardIssues);
    
    // Check ARIA attributes
    const ariaIssues = this.checkARIAAttributes(element);
    issues.push(...ariaIssues);
    
    return {
      compliant: issues.length === 0,
      issues,
      score: Math.max(0, 100 - (issues.length * 10))
    };
  }

  // Check color contrast ratios (WCAG AA requires 4.5:1 for normal text, 3:1 for large text)
  checkColorContrast(element) {
    const issues = [];
    const elements = element.querySelectorAll('*');
    
    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const backgroundColor = style.backgroundColor;
      const color = style.color;
      
      if (color && backgroundColor) {
        const contrast = this.calculateContrastRatio(color, backgroundColor);
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = style.fontWeight;
        
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= '700');
        const requiredContrast = isLargeText ? 3 : 4.5;
        
        if (contrast < requiredContrast) {
          issues.push({
            type: 'contrast',
            element: el,
            message: `Color contrast ratio ${contrast.toFixed(2)}:1 is below WCAG AA requirement of ${requiredContrast}:1`,
            severity: 'high'
          });
        }
      }
    });
    
    return issues;
  }

  // Calculate contrast ratio between two colors
  calculateContrastRatio(color1, color2) {
    const luminance1 = this.getLuminance(color1);
    const luminance2 = this.getLuminance(color2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Get luminance of a color
  getLuminance(color) {
    // Handle named colors
    const colorMap = {
      'black': '#000000',
      'white': '#FFFFFF',
      'red': '#FF0000',
      'green': '#00FF00',
      'blue': '#0000FF'
    };
    
    const hexColor = colorMap[color.toLowerCase()] || color;
    const rgb = this.hexToRgb(hexColor);
    if (!rgb) return 0;
    
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Convert hex color to RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Check heading structure (should be hierarchical)
  checkHeadingStructure(element) {
    const issues = [];
    const headings = element.querySelectorAll(this.headingTags);
    const headingLevels = [];
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      headingLevels.push(level);
      
      // Check for skipped levels
      if (headingLevels.length > 1) {
        const previousLevel = headingLevels[headingLevels.length - 2];
        if (level > previousLevel + 1) {
          issues.push({
            type: 'heading',
            element: heading,
            message: `Heading level ${level} is skipped (previous was ${previousLevel})`,
            severity: 'medium'
          });
        }
      }
    });
    
    // Check if there's only one h1
    const h1Count = element.querySelectorAll('h1').length;
    if (h1Count > 1) {
      issues.push({
        type: 'heading',
        element: element.querySelector('h1'),
        message: `Multiple h1 elements found (${h1Count}). Should have only one main heading.`,
        severity: 'medium'
      });
    }
    
    return issues;
  }

  // Check form labels and associations
  checkFormLabels(element) {
    const issues = [];
    const formControls = element.querySelectorAll('input, select, textarea');
    
    formControls.forEach(control => {
      const id = control.id;
      const label = control.labels?.[0];
      const ariaLabel = control.getAttribute('aria-label');
      const ariaLabelledby = control.getAttribute('aria-labelledby');
      
      if (!label && !ariaLabel && !ariaLabelledby) {
        issues.push({
          type: 'label',
          element: control,
          message: 'Form control lacks proper label association',
          severity: 'high'
        });
      }
      
      // Check for duplicate IDs
      if (id && element.querySelectorAll(`#${id}`).length > 1) {
        issues.push({
          type: 'duplicate-id',
          element: control,
          message: `Duplicate ID "${id}" found`,
          severity: 'high'
        });
      }
    });
    
    return issues;
  }

  // Check keyboard navigation
  checkKeyboardNavigation(element) {
    const issues = [];
    const focusableElements = element.querySelectorAll(this.focusableElements);
    
    focusableElements.forEach(el => {
      // Check if element is focusable
      if (el.tabIndex < 0 && !el.hasAttribute('disabled')) {
        issues.push({
          type: 'keyboard',
          element: el,
          message: 'Interactive element should be keyboard accessible',
          severity: 'high'
        });
      }
      
      // Check for visible focus indicators
      const style = window.getComputedStyle(el);
      const outline = style.outline;
      const boxShadow = style.boxShadow;
      
      if (outline === 'none' && !boxShadow.includes('rgba')) {
        issues.push({
          type: 'focus-indicator',
          element: el,
          message: 'Focus indicator is not visible',
          severity: 'medium'
        });
      }
    });
    
    return issues;
  }

  // Check ARIA attributes
  checkARIAAttributes(element) {
    const issues = [];
    
    // Use a more compatible selector for ARIA attributes
    const allElements = element.querySelectorAll('*');
    
    allElements.forEach(el => {
      // Check for invalid ARIA attributes
      const ariaAttributes = Array.from(el.attributes)
        .filter(attr => attr.name.startsWith('aria-'));
      
      ariaAttributes.forEach(attr => {
        const value = attr.value;
        
        // Check for empty ARIA labels
        if ((attr.name === 'aria-label' || attr.name === 'aria-labelledby') && !value.trim()) {
          issues.push({
            type: 'aria',
            element: el,
            message: `Empty ${attr.name} attribute`,
            severity: 'medium'
          });
        }
        
        // Check for invalid ARIA values
        if (attr.name === 'aria-expanded' && !['true', 'false'].includes(value)) {
          issues.push({
            type: 'aria',
            element: el,
            message: `Invalid aria-expanded value: "${value}"`,
            severity: 'medium'
          });
        }
      });
    });
    
    return issues;
  }

  // Generate accessibility report
  generateAccessibilityReport(element) {
    const compliance = this.checkWCAGCompliance(element);
    
    return {
      timestamp: new Date().toISOString(),
      wcagLevel: 'AA',
      compliance: compliance.compliant,
      score: compliance.score,
      issues: compliance.issues,
      summary: {
        total: compliance.issues.length,
        high: compliance.issues.filter(i => i.severity === 'high').length,
        medium: compliance.issues.filter(i => i.severity === 'medium').length,
        low: compliance.issues.filter(i => i.severity === 'low').length
      }
    };
  }

  // Focus management utilities
  trapFocus(element) {
    const focusableElements = element.querySelectorAll(this.focusableElements);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    element.addEventListener('keydown', handleTabKey);
    
    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }

  // Announce changes to screen readers
  announceToScreenReader(message, priority = 'polite') {
    // Check if we're in a browser environment
    if (typeof document === 'undefined' || !document.body) {
      return;
    }
    
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      if (document.body && document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }

  // Skip link functionality
  createSkipLink(targetId, text = 'Skip to main content') {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = 'skip-link';
    skipLink.setAttribute('aria-label', text);
    
    // Style for screen readers
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 10000;
      border-radius: 4px;
    `;
    
    // Only add event listeners if they exist (for test environment)
    if (typeof skipLink.addEventListener === 'function') {
      skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
      });
      
      skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
      });
    }
    
    return skipLink;
  }

  // Enhanced form validation with accessibility
  validateFormAccessibility(form) {
    const issues = [];
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      // Check for error associations
      const hasError = input.hasAttribute('aria-invalid');
      const errorId = input.getAttribute('aria-describedby');
      
      if (hasError && !errorId) {
        issues.push({
          type: 'error-association',
          element: input,
          message: 'Form field with error lacks error message association',
          severity: 'high'
        });
      }
      
      // Check for required field indicators
      const isRequired = input.hasAttribute('required');
      const ariaRequired = input.getAttribute('aria-required');
      
      if (isRequired && ariaRequired !== 'true') {
        issues.push({
          type: 'required-indicator',
          element: input,
          message: 'Required field should have aria-required="true"',
          severity: 'medium'
        });
      }
    });
    
    return issues;
  }

  // Color blindness simulation
  simulateColorBlindness(type = 'deuteranopia') {
    const filters = {
      deuteranopia: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxkZWZzPjxtYXRyaXggaWQ9ImRldXRlcmFub3BpYSIgdmFsdWVzPSIwLjYyNSAwLjM3NSAwIDAgMCAwLjcgMC4zIDAgMCAwIDAgMC4yOTUgMC43MDUgMCAwIDAgMCAwIDEiLz48L2RlZnM+PGZpbHRlciBpZD0iZmlsdGVyIj48ZmVDb2xvck1hdHJpeCB0eXBlPSJzYXR1cmF0ZSIgdmFsdWVzPSIwIi8+PC9maWx0ZXI+PC9zdmc+")',
      protanopia: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxkZWZzPjxtYXRyaXggaWQ9InByb3Rhbm9waWEiIHZhbHVlcz0iMC41NjcgMC40MzMgMCAwIDAgMC41NTggMC40NDIgMCAwIDAgMCAwLjI0MiAwLjc1OCAwIDAgMCAwIDAgMSIvPjwvZGVmcz48ZmlsdGVyIGlkPSJmaWx0ZXIiPjxmZUNvbG9yTWF0cml4IHR5cGU9InNhdHVyYXRlIiB2YWx1ZXM9IjAiLz48L2ZpbHRlcj48L3N2Zz4=")',
      tritanopia: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxkZWZzPjxtYXRyaXggaWQ9InRyaXRhbm9waWEiIHZhbHVlcz0iMC45NSAwLjA1IDAgMCAwIDAgMC40MzMgMC41NjcgMCAwIDAgMCAwLjQ3NSAwLjUyNSAwIDAgMCAwIDAgMSIvPjwvZGVmcz48ZmlsdGVyIGlkPSJmaWx0ZXIiPjxmZUNvbG9yTWF0cml4IHR5cGU9InNhdHVyYXRlIiB2YWx1ZXM9IjAiLz48L2ZpbHRlcj48L3N2Zz4=")'
    };
    
    document.body.style.filter = filters[type] || filters.deuteranopia;
  }

  // Remove color blindness simulation
  removeColorBlindnessSimulation() {
    document.body.style.filter = '';
  }
}

// Export singleton instance
export const accessibilityHelper = new AccessibilityHelper();

// Utility functions
export const accessibilityUtils = {
  // Add skip link to page
  addSkipLink: (targetId, text) => {
    const skipLink = accessibilityHelper.createSkipLink(targetId, text);
    document.body.insertBefore(skipLink, document.body.firstChild);
  },

  // Announce page changes
  announcePageChange: (title) => {
    accessibilityHelper.announceToScreenReader(`Page loaded: ${title}`);
  },

  // Focus management for modals
  focusModal: (modalElement) => {
    const focusableElements = modalElement.querySelectorAll(accessibilityHelper.focusableElements);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
    return accessibilityHelper.trapFocus(modalElement);
  },

  // Validate current page accessibility
  validatePage: () => {
    return accessibilityHelper.generateAccessibilityReport(document.body);
  }
}; 