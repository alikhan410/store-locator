import { Modal, TitleBar } from "@shopify/app-bridge-react";
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
  const [importResults, setImportResults] = useState(null);
  const [showErrorReport, setShowErrorReport] = useState(false);
  const [failedRows, setFailedRows] = useState([]);

  // Auto-map fields when CSV headers are loaded
  const autoMapFields = useCallback((headers) => {
    const mappings = {};

    // Common variations and synonyms for each field
    const fieldVariations = {
      name: [
        "name",
        "store name",
        "storename",
        "business name",
        "businessname",
        "company",
        "company name",
        "companyname",
        "store",
        "location name",
      ],
      address: [
        "address",
        "address1",
        "address 1",
        "street",
        "street address",
        "streetaddress",
        "addr",
        "location",
        "physical address",
      ],
      address2: [
        "address2",
        "address 2",
        "address line 2",
        "addressline2",
        "suite",
        "apt",
        "apartment",
        "unit",
        "floor",
      ],
      city: ["city", "town", "municipality", "locality"],
      state: [
        "state",
        "province",
        "region",
        "state/province",
        "state province",
      ],
      zip: [
        "zip",
        "zip code",
        "zipcode",
        "postal code",
        "postalcode",
        "post code",
        "postcode",
        "zip/postal",
      ],
      country: ["country", "nation", "location country"],
      phone: [
        "phone",
        "telephone",
        "phone number",
        "phonenumber",
        "tel",
        "telephone number",
        "contact number",
        "phone #",
      ],
      link: [
        "link",
        "website",
        "url",
        "web site",
        "website url",
        "site",
        "webpage",
        "page",
      ],
      lat: ["lat", "latitude", "lat.", "lat coordinate", "latcoord"],
      lng: [
        "lng",
        "longitude",
        "lng.",
        "long",
        "longitude coordinate",
        "lngcoord",
        "lon",
      ],
    };

    const autoMapped = new Set();

    headers.forEach((header) => {
      const headerLower = header.toLowerCase().trim();
      const headerClean = headerLower.replace(/[^a-z0-9]/g, ""); // Remove special chars

      // Try exact matches first
      for (const [fieldKey, variations] of Object.entries(fieldVariations)) {
        if (
          variations.includes(headerLower) ||
          variations.includes(headerClean)
        ) {
          mappings[fieldKey] = header;
          autoMapped.add(fieldKey);
          break;
        }
      }

      // If no exact match, try partial matches
      if (!Object.values(mappings).includes(header)) {
        for (const [fieldKey, variations] of Object.entries(fieldVariations)) {
          const hasMatch = variations.some(
            (variation) =>
              headerLower.includes(variation) ||
              variation.includes(headerLower) ||
              headerClean.includes(variation.replace(/[^a-z0-9]/g, "")),
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
      
      // Validate that the file is a CSV file by extension
      if (csvFile) {
        const fileName = csvFile.name.toLowerCase();
        const isValidCSV = fileName.endsWith('.csv');
        
        if (!isValidCSV) {
          setErrors(['Please upload a valid CSV file. The file must have a .csv extension.']);
          setFile(null);
          setParsedData([]);
          setPreviewData([]);
          setCsvHeaders([]);
          return;
        }
      }
      
      setFile(csvFile);
      setErrors([]);
      setParsedData([]);
      setPreviewData([]);

      if (csvFile) {
        Papa.parse(csvFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              // Deduplicate errors by row number and message to avoid duplicates
              const errorMap = new Map();
              results.errors.forEach((err) => {
                const errorKey = `${err.row || 'unknown'}-${err.message}`;
                if (!errorMap.has(errorKey)) {
                  errorMap.set(errorKey, `Row ${err.row || 'unknown'}: ${err.message}`);
                }
              });
              const uniqueErrors = Array.from(errorMap.values());
              setErrors(uniqueErrors);
              return;
            }

            setCsvHeaders(Object.keys(results.data[0] || {}));
            setParsedData(results.data);
            setPreviewData(results.data.slice(0, 5)); // Show first 5 rows as preview
            autoMapFields(Object.keys(results.data[0] || {}));
          },
          error: (error) => {
            setErrors([`CSV parsing error: ${error.message}`]);
          },
        });
      }
    },
    [autoMapFields],
  );

  const handleFieldMappingChange = useCallback(
    (fieldKey, csvHeader) => {
      setFieldMappings((prev) => ({
        ...prev,
        [fieldKey]: csvHeader,
      }));

      // If user manually changes a mapping, remove it from auto-mapped set
      if (csvHeader && autoMappedFields.has(fieldKey)) {
        setAutoMappedFields((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fieldKey);
          return newSet;
        });
      }
    },
    [autoMappedFields],
  );

  const validateMappings = useCallback(() => {
    const requiredFields = EXPECTED_FIELDS.filter((field) => field.required);
    const missingFields = requiredFields.filter(
      (field) => !fieldMappings[field.key],
    );

    if (missingFields.length > 0) {
      setErrors([
        `Missing required field mappings: ${missingFields.map((f) => f.label).join(", ")}`,
      ]);
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
        const store = {
          originalRow: index + 1, // Track original row number
          originalData: row, // Keep original data for error reporting
        };

        EXPECTED_FIELDS.forEach((field) => {
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

      // Send to backend for validation and import
      fetch("/import-stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stores: mappedStores }),
      })
        .then((response) => response.json())
        .then((data) => {
          setIsProcessing(false);

          if (data.success) {
            setImportResults(data);

            if (data.errors && data.errors.length > 0) {
              // Process failed rows for the error report
              const failed = data.errors.map((error) => {
                const originalRow = mappedStores[error.row - 1];
                return {
                  row: error.row,
                  originalData: originalRow.originalData,
                  mappedData: originalRow,
                  errors: error.errors,
                  fixed: false,
                };
              });
              setFailedRows(failed);
              setShowErrorReport(true);
            } else {
              // All imports successful
              onImport(mappedStores);
            }
          } else {
            setErrors([data.error || "Import failed"]);
          }
        })
        .catch((error) => {
          setIsProcessing(false);
          setErrors([`Import error: ${error.message}`]);
        });
    } catch (error) {
      setErrors([`Import error: ${error.message}`]);
      setIsProcessing(false);
    }
  }, [parsedData, fieldMappings, validateMappings, onImport]);


  const mappingOptions = useMemo(() => {
    return [
      { label: "Not mapped", value: "" },
      ...csvHeaders.map((header) => ({ label: header, value: header })),
    ];
  }, [csvHeaders]);

  const previewRows = useMemo(() => {
    if (!previewData.length) return [];

    return previewData.map((row, index) => {
      const mappedRow = [];
      EXPECTED_FIELDS.forEach((field) => {
        const csvHeader = fieldMappings[field.key];
        const value = csvHeader ? row[csvHeader] : "";
        mappedRow.push(value || "");
      });
      return mappedRow;
    });
  }, [previewData, fieldMappings]);

  // Generate and download sample CSV
  const downloadSampleCSV = useCallback(() => {
    const headers = EXPECTED_FIELDS.map((field) => field.label);
    const sampleRow = EXPECTED_FIELDS.map((field) => {
      switch (field.key) {
        case "name":
          return "Sample Store Name";
        case "address":
          return "123 Main Street";
        case "address2":
          return "Suite 100";
        case "city":
          return "San Francisco";
        case "state":
          return "CA";
        case "zip":
          return "94102";
        case "country":
          return "United States";
        case "phone":
          return "(555) 123-4567";
        case "link":
          return "https://example.com";
        case "lat":
          return "37.7749";
        case "lng":
          return "-122.4194";
        default:
          return "";
      }
    });

    const csvContent = [
      headers.join(","),
      sampleRow.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "store-import-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  }, []);

  // Use a single close handler for all close actions
  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <Modal id="import-csv-modal" onClose={handleClose} variant="base">
      <TitleBar title="Import Stores from CSV" onClose={handleClose} />
      <s-box padding="base">
        <s-stack direction="block" gap="base">
          {/* File Upload */}
          <s-box background="base" border="base" borderRadius="base" padding="base">
            <s-stack direction="block" gap="small-300">
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <s-text>
                  <strong>Upload CSV file</strong>
                </s-text>
                <s-button
                  variant="secondary"
                  onClick={downloadSampleCSV}
                >
                  Download sample CSV
                </s-button>
              </s-stack>
              <s-paragraph color="subdued">
                Use the sample CSV template to ensure your file has the correct column names. 
                The system will automatically map columns based on their names.
              </s-paragraph>
              <div style={{ marginTop: "16px" }}>
                <s-drop-zone
                  accessibilityLabel="Upload a CSV file to import stores"
                  accept=".csv"
                  onChange={(event) => {
                    const dropZone = event.currentTarget;
                    if (dropZone.files && dropZone.files.length > 0) {
                      const csvFile = dropZone.files[0];
                      handleDropZoneDrop([], [csvFile], []);
                    }
                  }}
                  onDropRejected={() => {
                    setErrors(['Please upload a valid CSV file. The file must have a .csv extension.']);
                  }}
                />
              </div>
            </s-stack>
          </s-box>

          {/* Error Display */}
          {errors.length > 0 && (
            <s-banner heading="Encountered errors while importing" tone="critical">
              <s-stack direction="block" gap="small-200">
                {errors.map((error, index) => (
                  <s-text key={index}>{error}</s-text>
                ))}
              </s-stack>
            </s-banner>
          )}


          {/* Data Preview */}
          {previewData.length > 0 && (
            <s-box background="base" border="base" borderRadius="base" padding="base">
              <s-stack direction="block" gap="small-300">
                <s-heading>Data Preview</s-heading>
                <s-paragraph>
                  Preview of how your data will be imported (showing first 5
                  rows):
                </s-paragraph>
                <div 
                  style={{ 
                    overflowX: "auto",
                    marginLeft: "-16px",
                    marginRight: "-16px",
                    paddingLeft: "16px",
                    paddingRight: "16px"
                  }}
                >
                  <div style={{ width: "max-content", minWidth: "100%" }}>
                    <style>{`
                      .table-scroll-wrapper s-table-cell {
                        white-space: nowrap;
                      }
                    `}</style>
                    <div className="table-scroll-wrapper">
                      <s-table variant="table">
                        <s-table-header-row>
                          {EXPECTED_FIELDS.map((field, index) => (
                            <s-table-header key={field.key} listSlot={index === 0 ? "primary" : "labeled"}>
                              {field.label}
                            </s-table-header>
                          ))}
                        </s-table-header-row>
                        <s-table-body>
                          {previewRows.map((row, rowIndex) => (
                            <s-table-row key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <s-table-cell key={cellIndex}>
                                  {cell || ""}
                                </s-table-cell>
                              ))}
                            </s-table-row>
                          ))}
                        </s-table-body>
                      </s-table>
                    </div>
                  </div>
                </div>
                <s-text color="subdued">
                  Total rows to import: {parsedData.length}
                </s-text>
              </s-stack>
            </s-box>
          )}

          {/* Processing State */}
          {isProcessing && (
            <s-banner tone="info">
              <s-stack direction="block" gap="small-200">
                <s-stack direction="inline" gap="small-200" alignItems="center">
                  <s-spinner size="small" accessibilityLabel="Processing import" />
                  <s-text>Processing import...</s-text>
                </s-stack>
                <s-text color="subdued" fontSize="small">
                  You can close this modal - the import will continue in the background.
                </s-text>
              </s-stack>
            </s-banner>
          )}

          {/* Import Results */}
          {importResults && (
            <s-box background="base" border="base" borderRadius="base" padding="base">
              <s-stack direction="block" gap="small-300">
                <s-heading>Import Results</s-heading>
                <s-banner tone={importResults.partial ? "warning" : "success"}>
                  <s-stack direction="block" gap="small-200">
                    <s-text>
                      <strong>Successfully imported:</strong>{" "}
                      {importResults.imported} stores
                    </s-text>
                    {importResults.skipped > 0 && (
                      <s-text>
                        <strong>Skipped due to errors:</strong>{" "}
                        {importResults.skipped} stores
                      </s-text>
                    )}
                  </s-stack>
                </s-banner>
                {importResults.errors && importResults.errors.length > 0 && (
                  <s-button
                    onClick={() => setShowErrorReport(true)}
                    variant="secondary"
                  >
                    View Error Report ({importResults.errors.length} rows)
                  </s-button>
                )}
              </s-stack>
            </s-box>
          )}

        {/* Error Report */}
        {showErrorReport && failedRows.length > 0 && (
          <ErrorReportModal
            failedRows={failedRows}
            fieldMappings={fieldMappings}
            onClose={() => setShowErrorReport(false)}
            onRetryImport={(fixedRows) => {
              // Re-import the fixed rows
              const fixedStores = fixedRows.map((row) => row.mappedData);
              onImport(fixedStores);
              setShowErrorReport(false);
            }}
          />
        )}

          {/* Import/Cancel Buttons at the bottom */}
          <s-stack direction="inline" gap="base">
            <s-button
              variant="primary"
              onClick={handleImport}
              disabled={isProcessing || !file || parsedData.length === 0 || errors.length > 0}
            >
              {isProcessing ? "Importing..." : "Import Stores"}
            </s-button>
            <s-button onClick={handleClose} variant="secondary">
              Cancel
            </s-button>
          </s-stack>
        </s-stack>
      </s-box>
    </Modal>
  );
}

// Error Report Modal Component
function ErrorReportModal({
  failedRows,
  fieldMappings,
  onClose,
  onRetryImport,
}) {
  const [editableRows, setEditableRows] = useState(
    failedRows.map((row) => ({ ...row })),
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFieldChange = (rowIndex, fieldKey, value) => {
    setEditableRows((prev) =>
      prev.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              mappedData: { ...row.mappedData, [fieldKey]: value },
              fixed: true,
            }
          : row,
      ),
    );
  };

  const handleRetryImport = () => {
    setIsProcessing(true);

    // Validate the fixed rows
    const validRows = editableRows.filter((row) => {
      const requiredFields = EXPECTED_FIELDS.filter((field) => field.required);
      return requiredFields.every(
        (field) =>
          row.mappedData[field.key] && row.mappedData[field.key].trim() !== "",
      );
    });

    if (validRows.length === 0) {
      alert("Please fix at least one row before retrying import.");
      setIsProcessing(false);
      return;
    }

    onRetryImport(validRows);
  };

  const exportFailedRows = () => {
    const csvContent = [
      // Header row
      Object.keys(failedRows[0].originalData).join(","),
      // Data rows
      ...failedRows.map((row) =>
        Object.values(row.originalData)
          .map((value) =>
            typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value,
          )
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "failed_import_rows.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Use a single close handler for all close actions
  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <Modal id="import-error-modal" onClose={handleClose} variant="large">
      <TitleBar title="Import Error Report" onClose={handleClose} />
      <s-box padding="base">
        <s-stack direction="block" gap="base">
          <s-banner tone="warning">
            <s-paragraph>
              The following {failedRows.length} rows could not be imported due to
              validation errors. You can fix the data below and re-import, or
              export the failed rows to fix them externally.
            </s-paragraph>
          </s-banner>
          {editableRows.map((row, rowIndex) => (
            <s-box key={row.row} background="base" border="base" borderRadius="base" padding="base">
              <s-stack direction="block" gap="small-300">
                <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                  <s-heading>
                    Row {row.row} -{" "}
                    {row.originalData[Object.keys(row.originalData)[0]] ||
                      "Unnamed Store"}
                  </s-heading>
                  {row.fixed && (
                    <s-text color="success">✓ Fixed</s-text>
                  )}
                </s-stack>
                {/* Error Messages */}
                <s-banner heading="Validation Errors" tone="critical">
                  <s-unordered-list>
                    {row.errors.map((error, errorIndex) => (
                      <li key={errorIndex}>{error}</li>
                    ))}
                  </s-unordered-list>
                </s-banner>
                {/* Editable Fields */}
                <s-stack direction="block" gap="small-300">
                  {EXPECTED_FIELDS.map((field) => {
                    const csvHeader = fieldMappings[field.key];
                    const originalValue = csvHeader
                      ? row.originalData[csvHeader]
                      : "";
                    const currentValue = row.mappedData[field.key] || "";
                    return (
                      <s-stack
                        key={field.key}
                        direction="inline"
                        justifyContent="space-between"
                        gap="base"
                        alignItems="center"
                      >
                        <s-text>
                          {field.label}{" "}
                          {field.required && (
                            <s-text color="critical">*</s-text>
                          )}
                        </s-text>
                        <div style={{ minWidth: "200px" }}>
                          <s-text-field
                            value={currentValue}
                            onChange={(e) =>
                              handleFieldChange(rowIndex, field.key, e.target.value)
                            }
                            placeholder={
                              originalValue ||
                              `Enter ${field.label.toLowerCase()}`
                            }
                            aria-invalid={
                              field.required && !currentValue.trim() ? "true" : "false"
                            }
                            aria-describedby={
                              field.required && !currentValue.trim()
                                ? `error-${rowIndex}-${field.key}`
                                : undefined
                            }
                          />
                          {field.required && !currentValue.trim() && (
                            <s-text id={`error-${rowIndex}-${field.key}`} color="critical">
                              Required field
                            </s-text>
                          )}
                        </div>
                      </s-stack>
                    );
                  })}
                </s-stack>
              </s-stack>
            </s-box>
          ))}
          {/* Action Buttons at the bottom */}
          <s-stack direction="inline" gap="base">
            <s-button
              variant="primary"
              onClick={handleRetryImport}
              disabled={isProcessing || editableRows.filter((row) => row.fixed).length === 0}
            >
              {isProcessing ? "Re-importing..." : "Re-import Fixed Rows"}
            </s-button>
            <s-button onClick={exportFailedRows} variant="secondary">
              Export Failed Rows
            </s-button>
            <s-button onClick={handleClose} variant="secondary">
              Close
            </s-button>
          </s-stack>
        </s-stack>
      </s-box>
    </Modal>
  );
}
