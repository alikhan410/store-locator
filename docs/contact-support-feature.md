# Contact Support Feature

## Overview

The Store Locator app now includes easy access to contact support through multiple locations in the interface. Users can quickly reach out for help with any questions or issues.

## Contact Button Locations

### 1. Main Navigation
- **Location**: Top navigation bar in the app
- **Label**: "💬 Support"
- **Behavior**: Opens contact form in new tab
- **Accessibility**: Includes proper ARIA labels

### 2. Dashboard Quick Actions
- **Location**: Quick Actions section on the main dashboard
- **Label**: "Contact Support"
- **Icon**: 💬
- **Behavior**: Opens contact form in new tab
- **Accessibility**: Includes proper ARIA labels

## Configuration

### Environment Variable
Set the `CONTACT_URL` environment variable to specify the contact form URL:

```env
CONTACT_URL=https://storetrail.app/support
```

### Default URL
If no environment variable is set, the app defaults to:
```
https://storetrail.app/support
```

## User Experience

### Accessibility
- All contact buttons include proper ARIA labels
- Opens in new tab to preserve app context
- Keyboard accessible
- Screen reader friendly

### Visual Design
- Consistent with existing app design
- Clear iconography (💬)
- Non-obtrusive placement
- Easy to find but not distracting

## Technical Implementation

### Files Modified
- `app/routes/app.jsx` - Added to main navigation
- `app/routes/app._index.jsx` - Added to dashboard Quick Actions

### Data Flow
1. Environment variable loaded in route loaders
2. Contact URL passed to client components
3. Button click opens URL in new tab
4. Preserves app context for user

## Support Workflow

1. **User clicks contact button** → Opens StoreTrail.app support page
2. **User fills contact form** → Form submits to webhook
3. **Support team receives request** → Responds via email
4. **User gets help** → Returns to app with solution

## Benefits

- **Easy Access**: Support is just one click away
- **Context Preservation**: Opens in new tab, keeps app open
- **Consistent Experience**: Same contact form for all users
- **Professional Support**: Centralized support system
- **Accessibility**: Inclusive design for all users

---

**Note**: This feature enhances the user experience by providing easy access to support while maintaining the app's professional appearance and functionality. 