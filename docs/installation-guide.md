# Store Locator - Installation Guide

**Welcome to Store Locator!** This guide will walk you through installing and setting up the app on your Shopify store.

## 📋 Prerequisites

Before installing Store Locator, ensure you have:
- ✅ An active Shopify store (Basic plan or higher)
- ✅ Admin access to your Shopify store
- ✅ A Google Maps API key (optional, but recommended for full functionality)

## 🚀 Installation Steps

### Step 1: Install the App

1. **Navigate to the Shopify App Store**
   - Go to your Shopify admin panel
   - Click on "Apps" in the left sidebar
   - Click "Visit Shopify App Store"

2. **Find Store Locator**
   - Search for "Store Locator" in the app store
   - Or use the direct link provided by your app developer

3. **Install the App**
   - Click "Add app" on the Store Locator page
   - Review the app permissions (see section below)
   - Click "Install app" to confirm

### Step 2: Review App Permissions

Store Locator requires the following permissions:

| Permission | Purpose |
|------------|---------|
| **Read themes** | Access your theme files to install the store locator widget |
| **Write app proxy** | Create proxy routes for external access to store data |
| **Write products** | Manage store location data in your product catalog |
| **Write themes** | Install and configure the store locator widget in your theme |

**Note:** These permissions are standard for store locator apps and are necessary for full functionality.

### Step 3: Initial Setup

After installation, you'll be redirected to the Store Locator dashboard. Here's what to do next:

1. **Welcome Screen**
   - Review the welcome message and app overview
   - Click "Get Started" to begin setup

2. **Add Your First Store**
   - Click "Add Store" in the dashboard
   - Fill in your store details:
     - **Store Name**: Your business name
     - **Address**: Complete street address
     - **City, State, ZIP**: Location details
     - **Phone**: Contact number
     - **Email**: Contact email
     - **Website**: Store website (optional)
     - **Hours**: Business hours (optional)
     - **Notes**: Additional information (optional)

3. **Save Your Store**
   - Click "Save Store" to add it to your database
   - The app will automatically geocode the address using Google Maps

### Step 4: Install the Store Locator Widget

1. **Navigate to Theme Customization**
   - Go to "Online Store" → "Themes" in your Shopify admin
   - Click "Customize" on your active theme

2. **Add the Store Locator Block**
   - In the theme editor, click "Add section"
   - Search for "Store Locator" or "Store Locations"
   - Click to add the block to your page

3. **Configure the Widget**
   - **Title**: Set a custom title for your store locator
   - **Description**: Add a description for customers
   - **Map Height**: Set the height of the map (recommended: 400px)
   - **Show Search**: Enable/disable the search functionality
   - **Show Directions**: Enable/disable directions feature
   - **Stores to Display**: Choose which stores to show

4. **Save Your Changes**
   - Click "Save" to apply the changes
   - Preview your store to see the widget in action

## ⚙️ Advanced Configuration

### Google Maps API Key (Recommended)

For optimal performance and reliability, we recommend setting up a Google Maps API key:

1. **Get a Google Maps API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Geocoding API
     - Places API
   - Create credentials (API key)
   - Restrict the API key to your domain for security

2. **Add the API Key to Store Locator**
   - Go to Store Locator settings in your app
   - Enter your Google Maps API key
   - Save the configuration

**Benefits of using your own API key:**
- Higher usage limits
- Better performance
- Custom styling options
- Detailed usage analytics

### Import Store Data (Bulk Import)

If you have multiple store locations, you can import them via CSV:

1. **Prepare Your CSV File**
   - Download the sample CSV template from the app
   - Fill in your store data following the template format
   - Save as CSV file

2. **Import the Data**
   - Go to "Import Stores" in the app dashboard
   - Upload your CSV file
   - Review the preview of your data
   - Click "Import" to add all stores

**CSV Template Format:**
```csv
name,address,city,state,zip,phone,email,website,hours,notes
Store Name,123 Main St,City,State,12345,555-123-4567,store@example.com,https://example.com,Mon-Fri 9-5,Additional info
```

## 🎨 Customization Options

### Widget Styling

Customize the appearance of your store locator widget:

1. **Colors**
   - Primary color: Main accent color
   - Secondary color: Supporting elements
   - Text color: Readable text color

2. **Typography**
   - Font family: Choose from available fonts
   - Font size: Adjust text size for readability

3. **Layout**
   - Map position: Left, right, or full width
   - Store list layout: Grid or list view
   - Responsive design: Mobile-friendly layout

### Advanced Features

1. **Search Functionality**
   - Enable customer search by location
   - Set default search radius
   - Add search filters (by store type, services, etc.)

2. **Directions Integration**
   - Enable "Get Directions" feature
   - Integrate with Google Maps directions
   - Show estimated travel time

3. **Store Information**
   - Display business hours
   - Show special services or features
   - Add store photos or logos

## 🔧 Troubleshooting

### Common Issues and Solutions

**Widget Not Appearing**
- Ensure the store locator block is added to your theme
- Check that your theme supports app blocks
- Clear your browser cache and refresh

**Stores Not Loading**
- Verify your store addresses are complete and valid
- Check your internet connection
- Ensure Google Maps services are available

**Map Not Displaying**
- Check if you have a valid Google Maps API key
- Verify the API key has the correct permissions
- Ensure the Maps JavaScript API is enabled

**Import Errors**
- Check your CSV file format matches the template
- Verify all required fields are filled
- Ensure addresses are valid and complete

### Getting Help

If you encounter any issues:

1. **Check the Help Documentation**
   - Review this installation guide
   - Check the app's help section

2. **Contact Support**
   - Email: support@mbernier.com
   - Response time: 24-48 hours
   - Include your store URL and issue description

3. **Community Support**
   - Check Shopify Community forums
   - Look for similar issues and solutions

## ✅ Verification Checklist

After installation, verify these items:

- [ ] App is installed and accessible in your Shopify admin
- [ ] At least one store location is added
- [ ] Store locator widget is visible on your store
- [ ] Map displays correctly with your store location
- [ ] Search functionality works (if enabled)
- [ ] Mobile responsiveness is working
- [ ] Google Maps API key is configured (optional)

## 🎉 Congratulations!

You've successfully installed and configured Store Locator! Your customers can now easily find your store locations and get directions.

**Next Steps:**
- Add more store locations if needed
- Customize the widget appearance
- Test the functionality from a customer's perspective
- Consider setting up Google Maps API key for enhanced features

---

**Need Help?** Contact us at support@mbernier.com or visit our help center for additional resources. 