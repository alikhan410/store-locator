# Google Maps Setup Guide

## Overview

The Store Locator app uses Google Maps for displaying store locations. If you're experiencing map flickering or "Map temporarily unavailable" errors, follow this guide to set up your Google Maps API key.

## Prerequisites

1. A Google Cloud Platform account
2. A Google Maps API key with the following APIs enabled:
   - Maps JavaScript API
   - Geocoding API (optional, for address lookup)

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for your project

### 2. Enable Required APIs

1. Go to "APIs & Services" > "Library"
2. Search for and enable these APIs:
   - **Maps JavaScript API** (required for map display)
   - **Geocoding API** (optional, for address to coordinates conversion)

### 3. Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

### 4. Configure Environment Variables

Add your Google Maps API key to your environment variables:

```bash
# For development
export GOOGLE_MAPS_PUBLIC_KEY="your-api-key-here"

# Or add to your .env file
GOOGLE_MAPS_PUBLIC_KEY=your-api-key-here
```

### 5. Restrict API Key (Recommended)

1. In Google Cloud Console, click on your API key
2. Under "Application restrictions", select "HTTP referrers"
3. Add your domain(s):
   - `https://your-app-domain.com/*`
   - `http://localhost:3000/*` (for development)

## Troubleshooting

### Map Flickering Issues

If you see the map flickering for 3 minutes with "Map temporarily unavailable", check:

1. **API Key Configuration**

   ```bash
   # Verify your API key is set
   echo $GOOGLE_MAPS_PUBLIC_KEY
   ```

2. **API Quotas**
   - Check your Google Cloud Console for quota limits
   - Ensure billing is enabled

3. **Network Issues**
   - Check your internet connection
   - Verify no firewall is blocking Google Maps requests

### Common Error Messages

| Error                         | Solution                                        |
| ----------------------------- | ----------------------------------------------- |
| "Map temporarily unavailable" | Check API key and network connection            |
| "REQUEST_DENIED"              | Verify API key is correct and APIs are enabled  |
| "OVER_QUERY_LIMIT"            | Check quota limits in Google Cloud Console      |
| "Network Error"               | Check internet connection and firewall settings |

### Fallback Mode

The app includes a fallback system that displays:

- Static map images when Google Maps is unavailable
- Store list view as a last resort
- Clear error messages to help users understand the issue

## Testing Your Setup

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to the map page in your app

3. Check the browser console for any error messages

4. Verify that stores with coordinates appear on the map

## Production Deployment

For production deployment:

1. Set the environment variable in your hosting platform
2. Ensure your domain is added to API key restrictions
3. Monitor API usage in Google Cloud Console
4. Consider setting up billing alerts

## Cost Considerations

- Google Maps JavaScript API: Free tier includes 28,500 map loads per month
- Geocoding API: Free tier includes 2,500 requests per month
- Monitor usage in Google Cloud Console to avoid unexpected charges

## Support

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Verify your API key is working with a simple test
3. Contact support with specific error messages and your setup details
