# CSV Import - Technical Documentation

## Architecture Overview

The CSV import feature is built using React components with Shopify Polaris UI components and integrates with the existing Remix application structure.

## Component Structure

### Main Component: `StoreCSVImport`
**Location**: `app/components/storeCSVImport.jsx`

**Props**:
- `onImport: (stores: Store[]) => void` - Callback when import is confirmed
- `onClose: () => void` - Callback when modal is closed

**State Management**:
```typescript
interface ImportState {
  file: File | null;
  csvHeaders: string[];
  parsedData: any[];
  fieldMappings: Record<string, string>;
  autoMappedFields: Set<string>;
  isProcessing: boolean;
  previewData: any[];
  errors: string[];
}
```

## Key Features Implementation

### 1. Auto-Field Mapping

The auto-mapping system uses a comprehensive dictionary of field variations:

```javascript
const fieldVariations = {
  name: ['name', 'store name', 'storename', 'business name', 'businessname', 'company', 'company name', 'companyname', 'store', 'location name'],
  address: ['address', 'address1', 'address 1', 'street', 'street address', 'streetaddress', 'addr', 'location', 'physical address'],
  // ... more variations
};
```

**Mapping Algorithm**:
1. **Exact Match**: Try exact string matches (case-insensitive)
2. **Clean Match**: Remove special characters and try again
3. **Partial Match**: Check if header contains or is contained in variations
4. **Priority**: First match wins, prevents duplicate mappings

### 2. CSV Parsing

Uses `papaparse` library for robust CSV parsing:

```javascript
Papa.parse(csvFile, {
  header: true,           // Use first row as headers
  skipEmptyLines: true,   // Ignore empty rows
  complete: (results) => {
    // Handle successful parsing
  },
  error: (error) => {
    // Handle parsing errors
  }
});
```

### 3. Data Validation

Validation occurs at multiple levels:

**Field-Level Validation**:
```javascript
const isValidStore = (store) => {
  const requiredFields = ["name", "address", "city", "state", "zip"];
  const errors = [];
  
  for (const field of requiredFields) {
    if (typeof store[field] !== "string" || store[field].trim() === "") {
      errors.push(`${field} is required`);
    }
  }
  
  // Additional validations for optional fields
  return errors;
};
```

**Import Response Structure**:
```javascript
{
  success: boolean;
  imported: number;      // Successfully imported stores
  skipped: number;       // Stores with validation errors
  errors?: Array<{       // Detailed error information
    row: number;
    errors: string[];
  }>;
  partial: boolean;      // True if some stores failed
}
```

## API Integration

### Import Endpoint
**Route**: `app/routes/import-stores.jsx`

**Method**: `POST`

**Request Body**:
```javascript
{
  stores: Array<{
    name: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
    phone?: string;
    link?: string;
    lat?: number;
    lng?: number;
  }>
}
```

**Response**:
```javascript
{
  success: boolean;
  imported: number;
  skipped: number;
  errors?: Array<{
    row: number;
    errors: string[];
  }>;
  partial: boolean;
}
```

## Database Schema

The import creates records in the `Store` table:

```sql
CREATE TABLE Store (
  id        String   @id @default(cuid())
  name      String
  link      String?
  address   String
  address2  String?
  city      String
  state     String
  zip       String
  country   String   @default("United States")
  phone     String?
  lat       Float?
  lng       Float?
  createdAt DateTime @default(now())
);
```

## Error Handling

### CSV Parsing Errors
- Invalid CSV format
- Missing headers
- Encoding issues
- File size limits

### Validation Errors
- Missing required fields
- Invalid data types
- Malformed coordinates
- Invalid URLs

### Database Errors
- Duplicate entries (if skipDuplicates is enabled)
- Constraint violations
- Connection issues

## Performance Considerations

### File Size Limits
- **Recommended**: Up to 10MB
- **Maximum**: Limited by server configuration
- **Typical**: 1,000-10,000 stores per file

### Memory Usage
- CSV is parsed in chunks
- Preview shows only first 5 rows
- Large files are processed incrementally

### Database Performance
- Uses `createMany` for bulk inserts
- Batches large imports
- Transaction-based for consistency

## Security Considerations

### File Upload Security
- File type validation (CSV only)
- File size limits
- Content validation before processing

### Data Sanitization
- Input trimming and cleaning
- SQL injection prevention (via Prisma)
- XSS prevention in preview display

### Access Control
- Requires authenticated session
- Shop-scoped data (in multi-tenant setup)

## Testing

### Unit Tests
**Location**: `app/helper/exportAction.test.js` (example structure)

```javascript
describe('CSV Import', () => {
  test('should auto-map common field variations', () => {
    // Test auto-mapping logic
  });
  
  test('should validate required fields', () => {
    // Test validation logic
  });
  
  test('should handle malformed CSV gracefully', () => {
    // Test error handling
  });
});
```

### Integration Tests
- End-to-end import flow
- Database integration
- Error scenarios
- Performance with large files

## Future Enhancements

### Planned Features
1. **Progress Tracking**: Real-time import progress
2. **Batch Processing**: Handle very large files
3. **Template Download**: Provide CSV templates
4. **Geocoding Integration**: Auto-geocode missing coordinates
5. **Duplicate Detection**: Smart duplicate handling

### Technical Improvements
1. **Web Workers**: Move parsing to background thread
2. **Streaming**: Process files in streams
3. **Caching**: Cache parsed data for large files
4. **Retry Logic**: Handle temporary failures

## Dependencies

### Frontend
- `@shopify/polaris`: UI components
- `papaparse`: CSV parsing
- `react`: Core framework

### Backend
- `prisma`: Database ORM
- `remix`: Web framework
- `@shopify/shopify-app-remix`: Shopify integration

## Configuration

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."

# File upload limits
MAX_FILE_SIZE="10485760"  # 10MB

# Import settings
BATCH_SIZE="1000"         # Stores per batch
```

### Feature Flags
```javascript
// Enable/disable features
const FEATURES = {
  CSV_IMPORT: true,
  AUTO_GEOCODING: false,
  DUPLICATE_DETECTION: true,
  PROGRESS_TRACKING: false
};
```

---

*Last updated: December 2024* 