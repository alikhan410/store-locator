# CSV Import Guide

## Overview

The Store Locator app includes a powerful CSV import feature that allows you to bulk import store locations from CSV files. The system is designed to handle various CSV formats and automatically map columns to the correct fields.

## Features

### 🎯 Smart Auto-Mapping
- **Automatic field detection**: Recognizes 50+ common column name variations
- **Case-insensitive matching**: Works with any capitalization
- **Special character handling**: Processes headers with hyphens, underscores, spaces
- **Partial matching**: Maps similar column names intelligently

### 🔄 Flexible Column Order
- **Order-independent**: Maps by column names, not positions
- **Missing columns**: Optional fields can be omitted
- **Extra columns**: Ignores unmapped columns
- **Partial imports**: Can import with missing optional fields

### 👀 Data Preview
- **Real-time preview**: See how your data will be imported
- **First 5 rows**: Preview shows mapped data before import
- **Validation feedback**: Clear error messages for issues

## How to Import CSV Data

### Step 1: Access the Import Feature
1. Navigate to **Stores** → **View all stores**
2. Click the **Import** button in the top-right corner
3. The import modal will open

### Step 2: Upload Your CSV File
1. Drag and drop your CSV file into the upload area, or click to browse
2. The system will automatically parse your CSV and detect column headers
3. Auto-mapping will attempt to match your columns to expected fields

### Step 3: Review and Adjust Field Mappings
1. Review the auto-mapped fields (marked with ✓ Auto-mapped)
2. Adjust any incorrect mappings using the dropdown selectors
3. Ensure all required fields are mapped (marked with *)

### Step 4: Preview Your Data
1. Review the data preview table showing first 5 rows
2. Verify the mapped data looks correct
3. Check the total number of rows to be imported

### Step 5: Import
1. Click **Import Stores** to begin the import process
2. The system will process your data and import valid stores
3. You'll see a success message with import results

## Expected CSV Fields

### Required Fields
These fields must be present in your CSV (either as columns or mapped):

| Field | Description | Auto-Detection Examples |
|-------|-------------|------------------------|
| **Store Name** | Name of the store/business | `name`, `store name`, `business name`, `company`, `company name` |
| **Address** | Street address | `address`, `address1`, `street`, `street address` |
| **City** | City name | `city`, `town`, `municipality` |
| **State** | State or province | `state`, `province`, `region` |
| **ZIP Code** | Postal/ZIP code | `zip`, `zip code`, `postal code`, `post code` |

### Optional Fields
These fields are optional but recommended:

| Field | Description | Auto-Detection Examples |
|-------|-------------|------------------------|
| **Address 2** | Suite, unit, floor | `address2`, `suite`, `apt`, `apartment`, `unit` |
| **Country** | Country name | `country`, `nation` |
| **Phone** | Phone number | `phone`, `telephone`, `phone number`, `tel` |
| **Website Link** | Store website URL | `link`, `website`, `url`, `web site` |
| **Latitude** | GPS latitude coordinate | `lat`, `latitude`, `lat coordinate` |
| **Longitude** | GPS longitude coordinate | `lng`, `longitude`, `long`, `lon` |

## Supported CSV Formats

### Standard Format
```csv
Name,Address,City,State,Zip,Phone,Website
Store A,123 Main St,New York,NY,10001,555-1234,https://storea.com
Store B,456 Oak Ave,Los Angeles,CA,90210,555-5678,https://storeb.com
```

### Alternative Format
```csv
Business Name,Street Address,Location City,Province,Postal Code,Contact Number,Website URL
Store C,789 Pine Rd,Chicago,IL,60601,555-9012,https://storec.com
Store D,321 Elm St,Boston,MA,02101,555-3456,https://stored.com
```

### Extended Format with Coordinates
```csv
Company,Addr1,Suite,Town,State/Province,Zip/Postal,Phone#,Webpage,Lat Coord,Lng Coord
Store E,654 Maple Ave,Suite 100,Seattle,WA,98101,555-7890,www.storee.com,47.6062,-122.3321
Store F,987 Cedar Ln,Floor 2,Portland,OR,97201,555-2345,https://storef.com,45.5152,-122.6784
```

## Auto-Detection Examples

The system recognizes these variations automatically:

### Store Name Variations
- `Name`, `name`, `NAME`
- `Store Name`, `store name`, `StoreName`
- `Business Name`, `business name`, `BusinessName`
- `Company`, `company`, `Company Name`, `company name`
- `Store`, `store`, `Location Name`, `location name`

### Address Variations
- `Address`, `address`, `ADDRESS`
- `Address1`, `address1`, `Address 1`, `address 1`
- `Street`, `street`, `Street Address`, `street address`
- `Addr`, `addr`, `Physical Address`, `physical address`

### Phone Variations
- `Phone`, `phone`, `PHONE`
- `Telephone`, `telephone`, `Phone Number`, `phone number`
- `Tel`, `tel`, `Contact Number`, `contact number`
- `Phone #`, `phone #`, `Telephone Number`, `telephone number`

## Troubleshooting

### Common Issues

#### "Missing required field mappings" Error
**Problem**: Required fields are not mapped to CSV columns
**Solution**: 
1. Check that your CSV has columns for Store Name, Address, City, State, and ZIP
2. Manually map the fields using the dropdown selectors
3. Ensure column names are clear and recognizable

#### CSV Parsing Errors
**Problem**: System can't read your CSV file
**Solution**:
1. Ensure your file is saved as CSV format
2. Check that the first row contains column headers
3. Verify there are no special characters in headers
4. Try opening the CSV in a text editor to check formatting

#### Data Preview Shows Empty Fields
**Problem**: Mapped fields show empty values
**Solution**:
1. Check that your CSV data is in the correct columns
2. Verify the field mappings are correct
3. Ensure there are no extra spaces in your data

### Best Practices

1. **Use clear column headers**: Avoid special characters and use descriptive names
2. **Include all required fields**: Ensure Store Name, Address, City, State, and ZIP are present
3. **Test with small files**: Start with a few rows to verify the import works
4. **Review the preview**: Always check the data preview before importing
5. **Backup your data**: Keep a copy of your original CSV file

## Technical Details

### File Requirements
- **Format**: CSV (Comma-Separated Values)
- **Encoding**: UTF-8 recommended
- **Size**: Up to 10MB (typical for thousands of stores)
- **Headers**: First row must contain column names

### Data Validation
- **Required fields**: Must have non-empty values
- **Phone numbers**: Accepts various formats
- **Coordinates**: Must be valid decimal numbers
- **URLs**: Should be valid web addresses

### Import Process
1. **File upload**: CSV is uploaded and parsed
2. **Header detection**: Column names are extracted
3. **Auto-mapping**: System attempts to map columns to fields
4. **Manual mapping**: Users can adjust mappings
5. **Data validation**: Each row is validated
6. **Database import**: Valid stores are imported
7. **Error reporting**: Issues are reported back to user

## Support

If you encounter issues with CSV import:

1. **Check the troubleshooting section** above
2. **Verify your CSV format** matches the examples
3. **Try with a smaller test file** first
4. **Contact support** with your CSV file and error details

---

*Last updated: December 2024* 