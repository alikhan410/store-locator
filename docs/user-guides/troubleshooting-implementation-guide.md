# Store Locator - Troubleshooting Guide

**Quick Solutions to Common Issues**

This troubleshooting guide helps you resolve common issues with the Store Locator app quickly and efficiently.

## 🚨 Emergency Quick Fixes

### Widget Not Showing on Your Store
**Immediate Steps:**
1. Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
2. Check if widget block is added to theme
3. Verify theme supports app blocks
4. Check for JavaScript errors in browser console

### Map Not Loading
**Immediate Steps:**
1. Check internet connection
2. Verify Google Maps API key is configured
3. Check API key usage limits
4. Try refreshing the page

### Import/Export Not Working
**Immediate Steps:**
1. Check file format (CSV for import)
2. Verify all required fields are filled
3. Check file size (max 10MB)
4. Ensure addresses are complete

## 🔍 Common Issues & Solutions

### Widget Display Issues

#### Problem: Widget Not Appearing on Store
**Symptoms:**
- Store locator widget is not visible on your store
- Widget block shows in theme editor but not on live site

**Solutions:**

1. **Check Theme Compatibility**
   ```
   - Go to Online Store → Themes
   - Verify your theme supports app blocks
   - Check theme documentation for app block support
   ```

2. **Verify Widget Installation**
   ```
   - Go to Online Store → Themes → Customize
   - Check if Store Locator block is added to page
   - Ensure block is not hidden or disabled
   ```

3. **Clear Cache and Refresh**
   ```
   - Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
   - Clear Shopify cache if using CDN
   - Wait 5-10 minutes for changes to propagate
   ```

4. **Check for JavaScript Errors**
   ```
   - Open browser developer tools (F12)
   - Check Console tab for errors
   - Look for any red error messages
   - Report errors to support if found
   ```

#### Problem: Widget Appears But Map is Blank
**Symptoms:**
- Widget loads but map area is empty
- No store markers visible
- Map shows loading spinner indefinitely

**Solutions:**

1. **Check Google Maps API Key**
   ```
   - Go to app settings
   - Verify API key is entered correctly
   - Check API key is not restricted too heavily
   - Ensure key has required permissions
   ```

2. **Verify API Services**
   ```
   - Check Google Cloud Console
   - Ensure Maps JavaScript API is enabled
   - Verify Geocoding API is enabled
   - Check API usage limits and billing
   ```

3. **Test API Key**
   ```
   - Visit Google Maps Platform documentation
   - Test your API key with sample code
   - Verify key works in browser console
   ```

### Store Management Issues

#### Problem: Can't Add New Store
**Symptoms:**
- Add Store button doesn't work
- Form submission fails
- Error messages appear

**Solutions:**

1. **Check Required Fields**
   ```
   - Ensure all required fields are filled
   - Verify email format is valid
   - Check phone number format
   - Ensure address is complete
   ```

2. **Clear Form and Retry**
   ```
   - Refresh the page
   - Clear browser cache
   - Try adding store again
   - Check for JavaScript errors
   ```

3. **Check Network Connection**
   ```
   - Verify internet connection
   - Check if other apps work
   - Try different browser
   - Check firewall settings
   ```

#### Problem: Store Address Not Geocoding
**Symptoms:**
- Store saves but shows "Address not found"
- Map doesn't show store location
- Coordinates are incorrect

**Solutions:**

1. **Verify Address Format**
   ```
   - Use complete street address
   - Include city, state, and ZIP code
   - Avoid abbreviations when possible
   - Check for typos in address
   ```

2. **Try Alternative Address Format**
   ```
   - Use different address format
   - Try with/without suite numbers
   - Use full state name instead of abbreviation
   - Check Google Maps for correct format
   ```

3. **Manual Coordinate Entry**
   ```
   - Find coordinates on Google Maps
   - Right-click on location
   - Copy latitude/longitude
   - Enter manually if needed
   ```

### Import/Export Issues

#### Problem: CSV Import Fails
**Symptoms:**
- Import button doesn't work
- Error messages during import
- Data not imported correctly

**Solutions:**

1. **Check CSV Format**
   ```
   - Download template from app
   - Ensure headers match exactly
   - Check for extra spaces or characters
   - Verify file is saved as CSV
   ```

2. **Validate Data**
   ```
   - Check all required fields are filled
   - Verify email addresses are valid
   - Ensure phone numbers are formatted correctly
   - Check for special characters in data
   ```

3. **File Size and Encoding**
   ```
   - Keep file under 10MB
   - Use UTF-8 encoding
   - Avoid special characters in file name
   - Try smaller batch if large file fails
   ```

#### Problem: Export Not Working
**Symptoms:**
- Export button doesn't respond
- File doesn't download
- Export is incomplete

**Solutions:**

1. **Check Browser Settings**
   ```
   - Allow pop-ups for your store domain
   - Check download folder permissions
   - Try different browser
   - Clear browser cache
   ```

2. **Verify Data Availability**
   ```
   - Ensure you have stores to export
   - Check app permissions
   - Verify you're logged in
   - Try refreshing the page
   ```

### Performance Issues

#### Problem: Widget Loads Slowly
**Symptoms:**
- Widget takes long time to load
- Map appears slowly
- Search is unresponsive

**Solutions:**

1. **Optimize Settings**
   ```
   - Reduce map height if large
   - Limit number of stores displayed
   - Enable lazy loading if available
   - Use caching features
   ```

2. **Check API Usage**
   ```
   - Monitor Google Maps API usage
   - Check for rate limiting
   - Consider upgrading API plan
   - Optimize API calls
   ```

3. **Network Optimization**
   ```
   - Check internet connection speed
   - Use wired connection if possible
   - Close unnecessary browser tabs
   - Clear browser cache
   ```

#### Problem: Mobile Performance Issues
**Symptoms:**
- Widget doesn't work on mobile
- Slow loading on mobile devices
- Touch interactions don't work

**Solutions:**

1. **Check Mobile Settings**
   ```
   - Verify responsive design is enabled
   - Check mobile-specific settings
   - Test on different mobile devices
   - Check mobile browser compatibility
   ```

2. **Optimize for Mobile**
   ```
   - Reduce map size on mobile
   - Simplify widget layout
   - Enable mobile-specific features
   - Test touch interactions
   ```

### Google Maps Integration Issues

#### Problem: API Key Errors
**Symptoms:**
- "Invalid API key" errors
- Maps not loading
- Geocoding failures

**Solutions:**

1. **Verify API Key**
   ```
   - Check key is copied correctly
   - Verify no extra spaces
   - Ensure key is active
   - Check key restrictions
   ```

2. **Check API Services**
   ```
   - Enable Maps JavaScript API
   - Enable Geocoding API
   - Enable Places API (if using search)
   - Check billing is set up
   ```

3. **API Key Restrictions**
   ```
   - Check domain restrictions
   - Verify referrer restrictions
   - Ensure your domain is allowed
   - Test with unrestricted key temporarily
   ```

#### Problem: Fallback Services Not Working
**Symptoms:**
- Maps don't load when Google Maps is down
- No alternative map display
- Error messages about services

**Solutions:**

1. **Check Fallback Configuration**
   ```
   - Verify fallback is enabled in settings
   - Check OpenStreetMap integration
   - Ensure alternative services are configured
   - Test fallback functionality
   ```

2. **Manual Fallback Activation**
   ```
   - Check app settings for fallback options
   - Enable manual fallback if available
   - Test with Google Maps disabled
   - Verify static map alternatives
   ```

## 🛠️ Advanced Troubleshooting

### Browser-Specific Issues

#### Chrome Issues
```
- Clear Chrome cache and cookies
- Disable Chrome extensions temporarily
- Check Chrome version compatibility
- Try incognito mode
```

#### Firefox Issues
```
- Clear Firefox cache and cookies
- Disable Firefox extensions
- Check Firefox version compatibility
- Try safe mode
```

#### Safari Issues
```
- Clear Safari cache and cookies
- Disable Safari extensions
- Check Safari version compatibility
- Try private browsing mode
```

### Network and Security Issues

#### Firewall Problems
```
- Check firewall settings
- Allow app domain in firewall
- Verify HTTPS connections
- Check corporate network restrictions
```

#### SSL/HTTPS Issues
```
- Ensure store uses HTTPS
- Check SSL certificate validity
- Verify mixed content warnings
- Test with different SSL settings
```

### Shopify-Specific Issues

#### Theme Compatibility
```
- Check theme app block support
- Verify theme version compatibility
- Test with default Shopify theme
- Contact theme developer if needed
```

#### App Conflicts
```
- Disable other apps temporarily
- Check for app conflicts
- Test with minimal app setup
- Contact Shopify support if needed
```

## 📞 Getting Help

### Before Contacting Support

1. **Document the Issue**
   - Take screenshots of the problem
   - Note exact steps to reproduce
   - Record error messages
   - Check browser console for errors

2. **Try Basic Solutions**
   - Clear browser cache
   - Try different browser
   - Check internet connection
   - Restart browser/computer

3. **Gather Information**
   - Your Shopify store URL
   - App version number
   - Browser and version
   - Operating system
   - Steps to reproduce issue

### Contact Information

**Email Support:** support@mbernier.com  
**Response Time:** 24-48 hours  
**Include:** Store URL, issue description, screenshots, error messages

### Support Request Template

```
Subject: Store Locator Issue - [Brief Description]

Store URL: [Your store URL]
Issue Description: [Detailed description]
Steps to Reproduce: [Step-by-step instructions]
Expected Behavior: [What should happen]
Actual Behavior: [What actually happens]
Browser/OS: [Browser and operating system]
Screenshots: [Attach relevant screenshots]
Error Messages: [Copy any error messages]
```

## 🔄 Maintenance and Prevention

### Regular Maintenance

1. **Weekly Checks**
   - Verify widget is working on store
   - Check Google Maps API usage
   - Test import/export functionality
   - Review error logs

2. **Monthly Tasks**
   - Update app to latest version
   - Review and update store information
   - Check API key usage and limits
   - Backup store data

3. **Quarterly Reviews**
   - Review app performance
   - Check for new features
   - Update documentation
   - Plan improvements

### Prevention Tips

1. **Keep App Updated**
   - Enable automatic updates
   - Check for updates regularly
   - Test updates in development environment
   - Backup before major updates

2. **Monitor Performance**
   - Track widget load times
   - Monitor API usage
   - Check for errors regularly
   - Optimize settings as needed

3. **Regular Testing**
   - Test on different devices
   - Verify mobile functionality
   - Check different browsers
   - Test with various data sets

---

**Need Immediate Help?**

- **Email:** support@mbernier.com
- **Response Time:** 24-48 hours
- **Emergency:** Include "URGENT" in subject line
- **Documentation:** Check our help center first

**Last Updated:** January 2025  
**Version:** 1.0 