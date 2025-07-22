import { DropZone, BlockStack, Thumbnail, Text } from "@shopify/polaris";
import { NoteIcon } from "@shopify/polaris-icons";
import { useState, useCallback } from "react";
import Papa from "papaparse";

export default function StoreCSVImport({ onImport }) {
  const [file, setFile] = useState(null);

  const handleDropZoneDrop = useCallback(
    (_dropFiles, acceptedFiles) => {
      const csvFile = acceptedFiles[0];
      setFile(csvFile);

      if (csvFile && csvFile.type === "text/csv") {
        Papa.parse(csvFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedStores = results.data.map((row) => ({
              id: crypto.randomUUID(),
              name: row["Name"],
              address: row["Address"],
              address2: row["Address 2"],
              city: row["City"],
              state: row["State"],
              zip: row["Zip"],
              country: row["Country"],
              lat: row["Latitude"],
              lng: row["Longitude"],
              phone: row["Phone"],
              link: row["Link"],
              notes: row["Notes"],
            }));
            onImport(parsedStores);
          },
        });
      }
    },
    [onImport],
  );

  const fileUpload = !file && <DropZone.FileUpload actionHint="Upload CSV" />;
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

  return (
    <DropZone accept=".csv" allowMultiple={false} onDrop={handleDropZoneDrop}>
      {uploadedFile}
      {fileUpload}
    </DropZone>
  );
}
