# Store Heatmap Feature

## Overview

The Store Heatmap feature provides a visual representation of store density across the United States using Google Maps heatmap technology. This helps you understand where your stores are concentrated and identify potential expansion opportunities.

## Features

### 🔥 **Heatmap Visualization**

- **Store Density**: Shows the concentration of stores across different regions
- **Weighted Heatmap**: Considers store features (phone, website) for importance weighting
- **Interactive States**: Click on states to zoom in and see detailed store distribution
- **Real-time Updates**: Heatmap updates automatically when stores are added or modified

### 📊 **State Analytics**

- **Top States**: Shows the states with the highest store counts
- **Store Distribution**: Displays how many stores are in each state
- **Interactive Navigation**: Click on any state to zoom the map to that region

### 🎨 **Visual Customization**

- **Color Gradient**: Blue to red gradient showing store density
- **Opacity Control**: Adjustable heatmap intensity
- **Radius Settings**: Configurable heatmap radius for different zoom levels

## How to Use

### Accessing the Heatmap

1. Navigate to **Heatmap** in the main navigation
2. Or click **View Heatmap** from the dashboard Quick Actions

### Heatmap Types

- **Store Density**: Shows equal weight for all stores
- **Weighted**: Gives higher weight to stores with phone numbers and websites

### Interacting with the Heatmap

- **Zoom**: Use mouse wheel or zoom controls to explore different regions
- **Pan**: Click and drag to move around the map
- **State Selection**: Click on any state in the sidebar to zoom to that area
- **Store Details**: Hover over heatmap areas to see store density

## Technical Implementation

### Google Maps Integration

- Uses Google Maps JavaScript API with Visualization library
- Requires `GOOGLE_MAPS_PUBLIC_KEY` environment variable
- Includes fallback handling for API issues

### Data Processing

- Groups stores by state for analytics
- Calculates store density and distribution
- Provides real-time statistics and metrics

### Performance Optimizations

- Efficient data loading and caching
- Responsive design for different screen sizes
- Graceful error handling and fallbacks

## Requirements

### Google Maps API

- **Maps JavaScript API**: Required for map display
- **Visualization Library**: Required for heatmap functionality
- **API Key**: Must be configured in environment variables

### Store Data

- Stores must have valid coordinates (lat/lng)
- State information is used for grouping and analytics
- Store features (phone, website) affect weighted calculations

## Benefits

### Business Intelligence

- **Market Analysis**: Identify your strongest markets
- **Expansion Planning**: See where you have gaps in coverage
- **Performance Tracking**: Monitor store distribution over time

### User Experience

- **Visual Clarity**: Easy to understand store distribution at a glance
- **Interactive Exploration**: Zoom and pan to explore different regions
- **Quick Insights**: Immediate understanding of store density patterns

### Operational Efficiency

- **Quick Assessment**: Rapidly evaluate store network coverage
- **Data-Driven Decisions**: Use visual data for strategic planning
- **Resource Allocation**: Identify areas needing more attention

## Troubleshooting

### Common Issues

#### Heatmap Not Loading

- Check that `GOOGLE_MAPS_PUBLIC_KEY` is set
- Verify Google Maps API is enabled in Google Cloud Console
- Ensure stores have valid coordinates

#### No Data Displayed

- Confirm stores have latitude and longitude values
- Check that stores are associated with the current shop
- Verify state information is properly formatted

#### Performance Issues

- Reduce the number of stores if heatmap is slow
- Check internet connection for Google Maps API calls
- Consider using density mode instead of weighted for large datasets

### Error Messages

| Error                             | Solution                                          |
| --------------------------------- | ------------------------------------------------- |
| "Google Maps API key is required" | Set `GOOGLE_MAPS_PUBLIC_KEY` environment variable |
| "No stores with locations found"  | Add stores with coordinates or fix geocoding      |
| "Heatmap loading timeout"         | Check internet connection and API key validity    |

## Future Enhancements

### Planned Features

- **Custom Weighting**: Allow custom weights for different store attributes
- **Time-based Heatmaps**: Show store density changes over time
- **Export Capabilities**: Export heatmap data and images
- **Advanced Filtering**: Filter heatmap by store type, date range, etc.

### Integration Opportunities

- **Analytics Dashboard**: Integrate with broader analytics platform
- **Reporting**: Generate heatmap reports for stakeholders
- **API Access**: Provide heatmap data via API for external tools

## Support

For technical support with the heatmap feature:

1. Check the troubleshooting section above
2. Verify your Google Maps API configuration
3. Contact support with specific error messages and setup details
