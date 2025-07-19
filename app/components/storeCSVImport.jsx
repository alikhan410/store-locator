import { 
  DropZone, 
  BlockStack, 
  Thumbnail, 
  Text, 
  Select, 
  Button, 
  InlineStack, 
  Card, 
  DataTable,
  Banner,
  Spinner,
  Modal
} from "@shopify/polaris";
import { NoteIcon } from "@shopify/polaris-icons";
import { useState, useCallback, useMemo } from "react";
import Papa from "papaparse";

// Expected field mappings
const EXPECTED_FIELDS = [
  { key: "name", label: "Store Name", required: true },
  { key: "address", label: "Address", required: true },
  { key: "address2", label: "Address 2", required: false },
  { key: "city", label: "City", required: true },
  { key: "state", label: "State", required: true },
  { key: "zip", label: "ZIP Code", required: true },
  { key: "country", label: "Country", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "link", label: "Website Link", required: false },
  { key: "lat", label: "Latitude", required: false },
  { key: "lng", label: "Longitude", required: false },
];

export default function StoreCSVImport({ onImport, onClose }) {
  const [file, setFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [fieldMappings, setFieldMappings] = useState({});
  const [autoMappedFields, setAutoMappedFields] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);

  // Auto-map fields when CSV headers are loaded
  const autoMapFields = useCallback((headers) => {
    const mappings = {};
    
    // Common variations and synonyms for each field
    const fieldVariations = {
      name: ['name', 'store name', 'storename', 'business name', 'businessname', 'company', 'company name', 'companyname', 'store', 'location name'],
      address: ['address', 'address1', 'address 1', 'street', 'street address', 'streetaddress', 'addr', 'location', 'physical address'],
      address2: ['address2', 'address 2', 'address line 2', 'addressline2', 'suite', 'apt', 'apartment', 'unit', 'floor'],
      city: ['city', 'town', 'municipality', 'locality'],
      state: ['state', 'province', 'region', 'state/province', 'state province'],
      zip: ['zip', 'zip code', 'zipcode', 'postal code', 'postalcode', 'post code', 'postcode', 'zip/postal'],
      country: ['country', 'nation', 'location country'],
      phone: ['phone', 'telephone', 'phone number', 'phonenumber', 'tel', 'telephone number', 'contact number', 'phone #'],
      link: ['link', 'website', 'url', 'web site', 'website url', 'site', 'webpage', 'page'],
      lat: ['lat', 'latitude', 'lat.', 'lat coordinate', 'latcoord'],
      lng: ['lng', 'longitude', 'lng.', 'long', 'longitude coordinate', 'lngcoord', 'lon']
    };

    const autoMapped = new Set();
    
    headers.forEach((header) => {
      const headerLower = header.toLowerCase().trim();
      const headerClean = headerLower.replace(/[^a-z0-9]/g, ''); // Remove special chars
      
      // Try exact matches first
      for (const [fieldKey, variations] of Object.entries(fieldVariations)) {
        if (variations.includes(headerLower) || variations.includes(headerClean)) {
          mappings[fieldKey] = header;
          autoMapped.add(fieldKey);
          break;
        }
      }
      
      // If no exact match, try partial matches
      if (!Object.values(mappings).includes(header)) {
        for (const [fieldKey, variations] of Object.entries(fieldVariations)) {
          const hasMatch = variations.some(variation => 
            headerLower.includes(variation) || 
            variation.includes(headerLower) ||
            headerClean.includes(variation.replace(/[^a-z0-9]/g, ''))
          );
          
          if (hasMatch && !mappings[fieldKey]) {
            mappings[fieldKey] = header;
            autoMapped.add(fieldKey);
            break;
          }
        }
      }
    });
    
    setFieldMappings(mappings);
    setAutoMappedFields(autoMapped);
  }, []);

  const handleDropZoneDrop = useCallback(
    (_dropFiles, acceptedFiles) => {
      const csvFile = acceptedFiles[0];
      setFile(csvFile);
      setErrors([]);
      setParsedData([]);
      setPreviewData([]);

      if (csvFile && csvFile.type === "text/csv") {
        Papa.parse(csvFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              setErrors(results.errors.map(err => `Row ${err.row}: ${err.message}`));
              return;
            }
            
            setCsvHeaders(Object.keys(results.data[0] || {}));
            setParsedData(results.data);
            setPreviewData(results.data.slice(0, 5)); // Show first 5 rows as preview
            autoMapFields(Object.keys(results.data[0] || {}));
          },
          error: (error) => {
            setErrors([`CSV parsing error: ${error.message}`]);
          }
        });
      }
    },
    [autoMapFields],
  );

  const handleFieldMappingChange = useCallback((fieldKey, csvHeader) => {
    setFieldMappings(prev => ({
      ...prev,
      [fieldKey]: csvHeader
    }));
    
    // If user manually changes a mapping, remove it from auto-mapped set
    if (csvHeader && autoMappedFields.has(fieldKey)) {
      setAutoMappedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldKey);
        return newSet;
      });
    }
  }, [autoMappedFields]);

  const validateMappings = useCallback(() => {
    const requiredFields = EXPECTED_FIELDS.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !fieldMappings[field.key]);
    
    if (missingFields.length > 0) {
      setErrors([`Missing required field mappings: ${missingFields.map(f => f.label).join(', ')}`]);
      return false;
    }
    
    setErrors([]);
    return true;
  }, [fieldMappings]);

  const handleImport = useCallback(() => {
    if (!validateMappings()) return;
    
    setIsProcessing(true);
    
    try {
      const mappedStores = parsedData.map((row, index) => {
        const store = {};
        
        EXPECTED_FIELDS.forEach(field => {
          const csvHeader = fieldMappings[field.key];
          if (csvHeader && row[csvHeader] !== undefined) {
            store[field.key] = row[csvHeader];
          }
        });
        
        // Add default country if not provided
        if (!store.country) {
          store.country = "United States";
        }
        
        return store;
      });

      onImport(mappedStores);
    } catch (error) {
      setErrors([`Import error: ${error.message}`]);
      setIsProcessing(false);
    }
  }, [parsedData, fieldMappings, validateMappings, onImport]);

  const fileUpload = !file && <DropZone.FileUpload actionHint="Upload CSV file" />;
  const uploadedFile = file && (
    <BlockStack>
      <Thumbnail size="small" alt={file.name} source={NoteIcon} />
      <div>
        {file.name}
        <Text variant="bodySm" as="p">
          {file.size} bytes
        </Text>
      </div>
    </BlockStack>
  );

  const mappingOptions = useMemo(() => {
    return [
      { label: "Not mapped", value: "" },
      ...csvHeaders.map(header => ({ label: header, value: header }))
    ];
  }, [csvHeaders]);

  const previewRows = useMemo(() => {
    if (!previewData.length) return [];
    
    return previewData.map((row, index) => {
      const mappedRow = [];
      EXPECTED_FIELDS.forEach(field => {
        const csvHeader = fieldMappings[field.key];
        const value = csvHeader ? row[csvHeader] : '';
        mappedRow.push(value || '');
      });
      return mappedRow;
    });
  }, [previewData, fieldMappings]);

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Import Stores from CSV"
      primaryAction={{
        content: "Import Stores",
        onAction: handleImport,
        loading: isProcessing,
        disabled: !file || parsedData.length === 0 || errors.length > 0
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose
        }
      ]}
      large
    >
      <Modal.Section>
        <BlockStack gap="400">
          {/* File Upload */}
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h3">Upload CSV File</Text>
              <DropZone accept=".csv" allowMultiple={false} onDrop={handleDropZoneDrop}>
                {uploadedFile}
                {fileUpload}
              </DropZone>
            </BlockStack>
          </Card>

          {/* Error Display */}
          {errors.length > 0 && (
            <Banner status="critical">
              <BlockStack gap="200">
                {errors.map((error, index) => (
                  <Text key={index} variant="bodyMd">{error}</Text>
                ))}
              </BlockStack>
            </Banner>
          )}

          {/* Field Mapping */}
          {csvHeaders.length > 0 && (
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">Map CSV Fields</Text>
                <Text variant="bodyMd" as="p">
                  Map your CSV columns to the expected store fields. Required fields are marked with an asterisk (*). 
                  The system tries to auto-map common column names, but you can adjust the mappings below.
                </Text>
                <Banner status="info">
                  <Text variant="bodyMd" as="p">
                    <strong>Tip:</strong> Don't worry about column order! The system maps by column names, not positions. 
                    Common variations like "Store Name", "Business Name", "Company" will be auto-detected.
                  </Text>
                </Banner>
                
                                  <BlockStack gap="300">
                    {EXPECTED_FIELDS.map((field) => (
                      <InlineStack key={field.key} align="space-between" gap="400">
                        <InlineStack gap="200" align="center">
                          <Text variant="bodyMd" as="span">
                            {field.label} {field.required && <Text variant="bodyMd" as="span" color="critical">*</Text>}
                          </Text>
                          {autoMappedFields.has(field.key) && fieldMappings[field.key] && (
                            <Text variant="bodySm" as="span" color="success">
                              ✓ Auto-mapped
                            </Text>
                          )}
                        </InlineStack>
                        <div style={{ minWidth: "200px" }}>
                          <Select
                            label=""
                            labelHidden
                            options={mappingOptions}
                            value={fieldMappings[field.key] || ""}
                            onChange={(value) => handleFieldMappingChange(field.key, value)}
                          />
                        </div>
                      </InlineStack>
                    ))}
                  </BlockStack>
              </BlockStack>
            </Card>
          )}

          {/* Data Preview */}
          {previewData.length > 0 && (
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">Data Preview</Text>
                <Text variant="bodyMd" as="p">
                  Preview of how your data will be imported (showing first 5 rows):
                </Text>
                
                <DataTable
                  columnContentTypes={EXPECTED_FIELDS.map(() => 'text')}
                  headings={EXPECTED_FIELDS.map(field => field.label)}
                  rows={previewRows}
                />
                
                <Text variant="bodySm" as="p" color="subdued">
                  Total rows to import: {parsedData.length}
                </Text>
              </BlockStack>
            </Card>
          )}

          {/* Processing State */}
          {isProcessing && (
            <Banner status="info">
              <InlineStack gap="200" align="center">
                <Spinner size="small" />
                <Text variant="bodyMd">Processing import...</Text>
              </InlineStack>
            </Banner>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
