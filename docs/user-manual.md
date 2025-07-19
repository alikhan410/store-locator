# Store Locator - User Manual

**Complete Guide to Using Store Locator**

Welcome to the Store Locator user manual! This comprehensive guide covers all features and functionality of the app.

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Store Locations](#managing-store-locations)
4. [Store Locator Widget](#store-locator-widget)
5. [Import/Export Features](#importexport-features)
6. [Settings & Configuration](#settings--configuration)
7. [Advanced Features](#advanced-features)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

## 🚀 Getting Started

### First Time Setup

After installing Store Locator, follow these steps:

1. **Access the Dashboard**
   - Go to your Shopify admin panel
   - Click "Apps" in the left sidebar
   - Find "Store Locator" and click to open

2. **Add Your First Store**
   - Click "Add Store" button
   - Fill in the required information
   - Click "Save Store"

3. **Install the Widget**
   - Go to "Online Store" → "Themes"
   - Click "Customize" on your active theme
   - Add the "Store Locator" block to your desired page

## 📊 Dashboard Overview

The Store Locator dashboard provides a central hub for managing all your store locations.

### Main Dashboard Features

- **Store Count**: Total number of store locations
- **Quick Actions**: Add store, import CSV, export data
- **Recent Activity**: Latest changes and updates
- **Widget Status**: Current widget configuration status

### Navigation Menu

- **Dashboard**: Overview and quick actions
- **Stores**: Manage individual store locations
- **Import/Export**: Bulk data management
- **Settings**: App configuration and preferences
- **Help**: Documentation and support resources

## 🏪 Managing Store Locations

### Adding a New Store

1. **Click "Add Store"**
   - Navigate to the Stores section
   - Click the "Add Store" button

2. **Fill in Store Information**
   - **Store Name** (Required): Your business name
   - **Address** (Required): Complete street address
   - **City** (Required): City name
   - **State** (Required): State or province
   - **ZIP Code** (Required): Postal code
   - **Phone** (Required): Contact phone number
   - **Email** (Required): Contact email address
   - **Website** (Optional): Store website URL
   - **Hours** (Optional): Business hours
   - **Notes** (Optional): Additional information

3. **Save the Store**
   - Click "Save Store" to add to your database
   - The app will automatically geocode the address

### Editing Store Information

1. **Find the Store**
   - Go to the Stores section
   - Locate the store you want to edit
   - Click the "Edit" button

2. **Update Information**
   - Modify any fields as needed
   - Changes are saved automatically
   - Geocoding will update if address changes

### Deleting a Store

1. **Access Store Details**
   - Go to the Stores section
   - Find the store to delete
   - Click "Edit"

2. **Delete the Store**
   - Scroll to the bottom of the form
   - Click "Delete Store"
   - Confirm the deletion

**Note**: Deleted stores cannot be recovered. Export your data before deleting.

### Store Information Fields

| Field | Required | Description |
|-------|----------|-------------|
| **Store Name** | Yes | Your business name as it appears to customers |
| **Address** | Yes | Complete street address for accurate mapping |
| **City** | Yes | City name for location identification |
| **State** | Yes | State or province abbreviation |
| **ZIP Code** | Yes | Postal code for precise location |
| **Phone** | Yes | Contact phone number for customers |
| **Email** | Yes | Contact email for customer inquiries |
| **Website** | No | Store-specific website URL |
| **Hours** | No | Business hours (e.g., "Mon-Fri 9-5") |
| **Notes** | No | Additional information (services, features, etc.) |

## 🎯 Store Locator Widget

### Installing the Widget

1. **Access Theme Editor**
   - Go to "Online Store" → "Themes"
   - Click "Customize" on your active theme

2. **Add the Block**
   - Click "Add section"
   - Search for "Store Locator"
   - Click to add the block

3. **Configure Settings**
   - Set the widget title and description
   - Choose display options
   - Save your changes

### Widget Configuration Options

#### Basic Settings
- **Title**: Custom title for the store locator
- **Description**: Brief description for customers
- **Map Height**: Height of the map in pixels (recommended: 400px)

#### Display Options
- **Show Search**: Enable/disable location search
- **Show Directions**: Enable/disable directions feature
- **Show Store List**: Display list of stores below map
- **Show Contact Info**: Display phone and email information

#### Styling Options
- **Primary Color**: Main accent color for the widget
- **Secondary Color**: Supporting element colors
- **Font Family**: Choose from available fonts
- **Border Radius**: Roundness of widget corners

### Widget Features

#### Interactive Map
- **Zoom Controls**: Customers can zoom in/out
- **Pan Controls**: Navigate around the map
- **Store Markers**: Click to view store details
- **Responsive Design**: Works on all device sizes

#### Search Functionality
- **Location Search**: Customers can search by address
- **Radius Search**: Find stores within a specific distance
- **Auto-complete**: Address suggestions as you type
- **Recent Searches**: Quick access to previous searches

#### Store Information Display
- **Store Details**: Name, address, contact information
- **Business Hours**: Current and upcoming hours
- **Directions Link**: Direct link to Google Maps directions
- **Contact Actions**: Click to call or email

## 📥📤 Import/Export Features

### Importing Store Data

#### CSV Import Process

1. **Prepare Your Data**
   - Download the CSV template from the app
   - Fill in your store information
   - Save as CSV file

2. **Upload and Import**
   - Go to "Import/Export" section
   - Click "Choose File" and select your CSV
   - Review the preview of your data
   - Click "Import Stores"

#### CSV Template Format

```csv
name,address,city,state,zip,phone,email,website,hours,notes
Store Name,123 Main St,City,State,12345,555-123-4567,store@example.com,https://example.com,Mon-Fri 9-5,Additional info
```

#### Import Validation

The app validates your data before import:
- **Required Fields**: All required fields must be filled
- **Address Validation**: Addresses are checked for completeness
- **Duplicate Detection**: Prevents duplicate store entries
- **Format Validation**: Ensures proper data formatting

### Exporting Store Data

#### Export Options

1. **CSV Export**
   - Go to "Import/Export" section
   - Click "Export Stores"
   - Download the CSV file with all store data

2. **GDPR Export**
   - Access the GDPR page in the app
   - Click "Export My Data"
   - Download your complete data package

#### Export Formats

- **CSV Format**: Standard spreadsheet format
- **JSON Format**: Structured data format
- **Complete Package**: All app data including settings

## ⚙️ Settings & Configuration

### General Settings

#### App Configuration
- **Default Map Center**: Set default map location
- **Default Zoom Level**: Initial map zoom setting
- **Search Radius**: Default search distance
- **Units**: Miles or kilometers

#### Display Settings
- **Map Style**: Choose map appearance
- **Marker Style**: Customize store markers
- **Widget Position**: Left, right, or full width
- **Mobile Layout**: Mobile-specific display options

### Google Maps Integration

#### API Key Configuration
1. **Get API Key**
   - Visit Google Cloud Console
   - Enable required APIs
   - Create and restrict API key

2. **Add to App**
   - Go to Settings section
   - Enter your API key
   - Save configuration

#### API Services Used
- **Maps JavaScript API**: Interactive map display
- **Geocoding API**: Address to coordinate conversion
- **Places API**: Location search and autocomplete

### Advanced Settings

#### Performance Options
- **Caching**: Enable data caching for faster loading
- **Lazy Loading**: Load map only when needed
- **Compression**: Reduce data transfer size

#### Security Settings
- **API Key Restrictions**: Domain and referrer restrictions
- **Data Encryption**: Secure data storage
- **Access Controls**: User permission management

## 🚀 Advanced Features

### Custom Styling

#### CSS Customization
- **Custom CSS**: Add your own styling
- **Theme Integration**: Match your store's design
- **Responsive Design**: Mobile-optimized layouts

#### Branding Options
- **Logo Integration**: Add your logo to the widget
- **Color Schemes**: Custom color palettes
- **Typography**: Custom font selections

### Analytics and Reporting

#### Usage Analytics
- **Search Analytics**: Track customer searches
- **Store Views**: Monitor store location views
- **Click Tracking**: Track customer interactions

#### Performance Metrics
- **Load Times**: Monitor widget performance
- **Error Tracking**: Identify and fix issues
- **User Behavior**: Understand customer usage patterns

### Integration Features

#### Third-Party Integrations
- **Google Analytics**: Track widget usage
- **Facebook Pixel**: Conversion tracking
- **Custom APIs**: Connect with other services

#### E-commerce Features
- **Product Integration**: Link stores to products
- **Inventory Sync**: Real-time inventory updates
- **Order Management**: Store-specific order processing

## 🔧 Troubleshooting

### Common Issues

#### Widget Not Displaying
**Problem**: Store locator widget doesn't appear on your store

**Solutions**:
1. Check that the widget block is added to your theme
2. Verify your theme supports app blocks
3. Clear browser cache and refresh
4. Check for JavaScript errors in browser console

#### Map Not Loading
**Problem**: Map displays but doesn't show store locations

**Solutions**:
1. Verify Google Maps API key is configured
2. Check API key permissions and restrictions
3. Ensure Maps JavaScript API is enabled
4. Check internet connection

#### Import Errors
**Problem**: CSV import fails or shows errors

**Solutions**:
1. Verify CSV format matches template
2. Check all required fields are filled
3. Ensure addresses are complete and valid
4. Remove any special characters from data

#### Performance Issues
**Problem**: Widget loads slowly or is unresponsive

**Solutions**:
1. Optimize image sizes and formats
2. Enable caching in settings
3. Check API key usage limits
4. Consider upgrading to paid Google Maps plan

### Getting Help

#### Support Channels
- **Email Support**: support@mbernier.com
- **Response Time**: 24-48 hours
- **Documentation**: Comprehensive help resources
- **Community**: Shopify Community forums

#### Before Contacting Support
1. Check this user manual
2. Review troubleshooting section
3. Clear browser cache and cookies
4. Test in different browser
5. Check for JavaScript errors

## ❓ FAQ

### General Questions

**Q: How many stores can I add?**
A: There's no limit to the number of stores you can add. The app is designed to handle multiple locations efficiently.

**Q: Can I use my own Google Maps API key?**
A: Yes! Using your own API key is recommended for better performance and higher usage limits.

**Q: Is the widget mobile-friendly?**
A: Yes, the store locator widget is fully responsive and works on all device sizes.

**Q: Can I customize the appearance?**
A: Yes, you can customize colors, fonts, layout, and add custom CSS for complete control.

### Technical Questions

**Q: What happens if Google Maps is down?**
A: The app includes fallback services (OpenStreetMap) to ensure your store locator remains functional.

**Q: How often is store data updated?**
A: Store data is updated in real-time when you make changes in the admin panel.

**Q: Can I export my data?**
A: Yes, you can export all your store data in CSV or JSON format at any time.

**Q: Is my data secure?**
A: Yes, all data is encrypted and stored securely with proper access controls.

### Billing and Support

**Q: What's included in the free plan?**
A: The free plan includes basic store locator functionality with limited API usage.

**Q: How do I upgrade my plan?**
A: You can upgrade through the app settings or contact support for assistance.

**Q: What support is included?**
A: All plans include email support and access to documentation resources.

**Q: Can I cancel anytime?**
A: Yes, you can uninstall the app at any time through your Shopify admin panel.

---

**Need Additional Help?**

- **Email**: support@mbernier.com
- **Documentation**: Check our help center
- **Community**: Join Shopify Community discussions
- **Updates**: Follow us for latest features and improvements

**Last Updated**: January 2025  
**Version**: 1.0 