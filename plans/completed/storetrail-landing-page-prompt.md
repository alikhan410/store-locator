git # StoreTrail Landing Page & Documentation Site - Bolt.new Prompt

## 🎯 Project Overview

Create a modern, professional landing page and documentation site for **StoreTrail Store Locator** - a Shopify app that helps merchants manage and display store locations on their websites.

## 📋 Project Requirements

### **Tech Stack**
- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS
- **Content**: Markdown files for documentation
- **Deployment**: Vercel-ready
- **Contact Form**: Webhook integration

### **Domain & Branding**
- **Domain**: StoreTrail.app
- **Support Email**: help@StoreTrail.app
- **Logo**: site_trail_logo_400x400.png (extract colors from this)
- **Parent Company**: mbernier.com (link in footer)

## 🎨 Design Requirements

### **Color Palette**
Extract colors from the StoreTrail logo (site_trail_logo_400x400.png) and create a cohesive palette:
- **Primary**: Main brand color from logo
- **Secondary**: Complementary color from logo
- **Accent**: Highlight color for CTAs
- **Neutral**: Clean grays for text and backgrounds
- **Success/Error**: Green/red for form feedback

### **Design Style**
- **Modern & Clean**: Professional SaaS aesthetic
- **Mobile-First**: Responsive design
- **Accessible**: WCAG 2.1 AA compliant
- **Fast Loading**: Optimized performance
- **Brand Consistency**: Match StoreTrail logo style

## 📄 Page Structure

### **1. Landing Page (`/`)**
```
Hero Section:
- Compelling headline: "Find Your Perfect Store Location"
- Subtitle: "Powerful store locator for Shopify merchants"
- CTA: "Get Started" button
- Hero image: Store locator widget mockup

Features Section:
- Store Management: "Manage unlimited store locations"
- CSV Import/Export: "Bulk import/export store data"
- Google Maps Integration: "Interactive maps with directions"
- Mobile Responsive: "Works perfectly on all devices"
- Customizable Widget: "Match your brand perfectly"

Benefits Section:
- Increase Foot Traffic: "Help customers find your stores"
- Save Time: "Automated geocoding and management"
- Boost Sales: "Drive customers to physical locations"
- Easy Setup: "Install and configure in minutes"

Social Proof:
- "Trusted by X+ Shopify merchants"
- Testimonials (placeholder for now)
- App store rating (placeholder)

Pricing Section:
- Free Plan: Basic features
- Pro Plan: Advanced features + priority support
- Enterprise: Custom solutions

Footer:
- Links to documentation, support, legal pages
- Link to mbernier.com
- Social media links
```

### **2. Documentation Page (`/docs`)**
```
Navigation:
- Sidebar with documentation sections
- Search functionality
- Breadcrumb navigation

Content Sections:
- Getting Started
- Installation Guide
- User Manual
- Troubleshooting
- API Reference
- FAQ

Features:
- Markdown rendering
- Syntax highlighting for code
- Table of contents
- Previous/Next navigation
- Search functionality
```

### **3. Support Page (`/support`)**
```
Contact Form:
- Name (required)
- Email (required)
- Subject (required)
- Message (required)
- Store URL (optional)
- Priority (dropdown: General, Technical, Billing)

Form Features:
- Validation
- Loading states
- Success/error messages
- Webhook integration

Additional Support:
- Email: help@StoreTrail.app
- Response time: 24-48 hours
- FAQ section
- Documentation links
```

### **4. Legal Pages**
```
Privacy Policy (`/privacy`):
- Render from markdown file
- GDPR compliant content
- Data handling practices

Terms of Service (`/terms`):
- Render from markdown file
- App usage terms
- Legal requirements
```

## 🔧 Technical Requirements

### **Next.js Setup**
```typescript
// app/layout.tsx
- Root layout with metadata
- Navigation component
- Footer component
- Global styles

// app/page.tsx
- Landing page with sections
- Hero, features, benefits, pricing
- Responsive design

// app/docs/page.tsx
- Documentation index
- Sidebar navigation
- Search functionality

// app/docs/[...slug]/page.tsx
- Dynamic route for documentation pages
- Markdown rendering
- Table of contents

// app/support/page.tsx
- Contact form
- Support information
- FAQ section

// app/privacy/page.tsx
- Privacy policy content
- Markdown rendering

// app/terms/page.tsx
- Terms of service content
- Markdown rendering
```

### **Components Needed**
```typescript
// components/
- Header.tsx (Navigation)
- Footer.tsx (Links, branding)
- Hero.tsx (Landing page hero)
- FeatureCard.tsx (Feature highlights)
- PricingCard.tsx (Pricing plans)
- ContactForm.tsx (Support form)
- DocSidebar.tsx (Documentation navigation)
- DocContent.tsx (Markdown renderer)
- SearchBar.tsx (Documentation search)
```

### **Styling & Assets**
```css
/* tailwind.config.js */
- Custom color palette from logo
- Typography scale
- Spacing system
- Component variants

/* globals.css */
- Base styles
- Custom fonts
- Animation utilities
```

### **Environment Configuration**
```env
# .env.local
NEXT_PUBLIC_SITE_URL=https://StoreTrail.app
SUPPORT_WEBHOOK_URL=https://your-webhook-url.com/support
CONTACT_EMAIL=help@StoreTrail.app
PARENT_COMPANY_URL=https://mbernier.com
```

## 📝 Content Requirements

### **Landing Page Copy**
```
Headlines:
- "Find Your Perfect Store Location"
- "Powerful store locator for Shopify merchants"
- "Help customers find your stores with ease"

Features:
- "Manage unlimited store locations"
- "Import/export data with CSV"
- "Interactive Google Maps integration"
- "Mobile-responsive design"
- "Customizable to match your brand"

Benefits:
- "Increase foot traffic to your stores"
- "Save time with automated geocoding"
- "Boost sales with better customer experience"
- "Easy setup and configuration"
```

### **Documentation Structure**
```
/docs/
├── getting-started/
│   ├── installation.md
│   └── quick-start.md
├── user-guides/
│   ├── user-manual.md
│   └── troubleshooting.md
├── api/
│   └── reference.md
└── faq.md
```

## 🚀 Deployment & Performance

### **Performance Requirements**
- **Lighthouse Score**: 90+ on all metrics
- **Core Web Vitals**: Pass all thresholds
- **Loading Speed**: < 3 seconds
- **SEO Optimized**: Meta tags, structured data

### **SEO Requirements**
```typescript
// Metadata for each page
- Title tags
- Meta descriptions
- Open Graph tags
- Twitter Card tags
- Structured data (JSON-LD)
```

### **Analytics & Tracking**
- Google Analytics 4
- Conversion tracking
- Form submission tracking
- Documentation page views

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### **Mobile Considerations**
- Touch-friendly buttons (44px minimum)
- Readable text sizes
- Optimized navigation
- Fast loading on mobile networks

## 🔒 Security & Privacy

### **Form Security**
- CSRF protection
- Rate limiting
- Input validation
- Secure webhook integration

### **Privacy Compliance**
- GDPR compliant forms
- Cookie consent
- Privacy policy integration
- Data handling transparency

## 🎯 Success Metrics

### **Conversion Goals**
- App store clicks
- Documentation engagement
- Support form submissions
- Newsletter signups

### **User Experience Goals**
- Low bounce rate
- High time on site
- Easy navigation
- Fast page loads

## 📋 Implementation Checklist

### **Phase 1: Core Setup**
- [ ] Next.js project setup
- [ ] Tailwind CSS configuration
- [ ] Color palette extraction from logo
- [ ] Basic layout components
- [ ] Responsive design system

### **Phase 2: Landing Page**
- [ ] Hero section
- [ ] Features section
- [ ] Benefits section
- [ ] Pricing section
- [ ] Footer with links

### **Phase 3: Documentation**
- [ ] Markdown rendering setup
- [ ] Documentation structure
- [ ] Search functionality
- [ ] Navigation sidebar
- [ ] Content pages

### **Phase 4: Support & Legal**
- [ ] Contact form with webhook
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] FAQ section

### **Phase 5: Polish & Launch**
- [ ] SEO optimization
- [ ] Performance optimization
- [ ] Analytics setup
- [ ] Testing & bug fixes
- [ ] Deployment to Vercel

## 🎨 Brand Guidelines

### **Logo Usage**
- Use site_trail_logo_400x400.png as primary logo
- Maintain aspect ratio
- Ensure good contrast on backgrounds
- Include alt text for accessibility

### **Typography**
- Clean, modern sans-serif fonts
- Good readability on all devices
- Consistent hierarchy
- Accessible font sizes

### **Imagery**
- Professional, clean aesthetic
- Screenshots of the app in action
- Mockups of store locator widget
- High-quality, optimized images

## 🔗 Integration Points

### **External Links**
- Shopify App Store listing
- mbernier.com (parent company)
- Social media profiles
- Support email (help@StoreTrail.app)

### **Webhook Integration**
```typescript
// Contact form submission
POST /api/contact
{
  name: string,
  email: string,
  subject: string,
  message: string,
  storeUrl?: string,
  priority: 'general' | 'technical' | 'billing'
}
```

## 📞 Support & Maintenance

### **Content Management**
- Easy to update documentation
- Markdown file structure
- Version control for content
- Backup and recovery

### **Monitoring**
- Uptime monitoring
- Error tracking
- Performance monitoring
- User analytics

---

**Ready to build an amazing landing page and documentation site for StoreTrail Store Locator!** 🚀 