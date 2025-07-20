export const exportAllStoresToCSV = (stores) => {
  if (!stores?.length) return;

  const headers = [
    "Name",
    "Address",
    "Address 2",
    "City",
    "State",
    "Zip",
    "Country",
    "Latitude",
    "Longitude",
    "Phone",
    "Link",
  ];

  const csvRows = [
    headers.join(","),
    ...stores.map((store) =>
      [
        store.name,
        store.address,
        store.address2 || "",
        store.city,
        store.state,
        store.zip,
        store.country,
        store.lat || "",
        store.lng || "",
        store.phone || "",
        store.link || "",
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "all-stores.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// New function to export filtered stores with descriptive filename
export const exportFilteredStoresToCSV = (stores, filters = {}) => {
  if (!stores?.length) return;

  const headers = [
    "Name",
    "Address",
    "Address 2",
    "City",
    "State",
    "Zip",
    "Country",
    "Latitude",
    "Longitude",
    "Phone",
    "Link",
  ];

  const csvRows = [
    headers.join(","), // Header row
    ...stores.map((store) =>
      [
        store.name,
        store.address,
        store.address2 || "",
        store.city,
        store.state,
        store.zip,
        store.country,
        store.lat || "",
        store.lng || "",
        store.phone || "",
        store.link || "",
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  // Generate descriptive filename based on filters
  const filename = generateFilteredFilename(filters, stores.length);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper function to generate descriptive filename based on filters
const generateFilteredFilename = (filters, count) => {
  const parts = ["stores"];
  
  if (filters.query) {
    parts.push(`search-${filters.query.replace(/[^a-zA-Z0-9]/g, '-')}`);
  }
  
  if (filters.state && filters.state.length > 0) {
    parts.push(`state-${filters.state.join('-')}`);
  }
  
  if (filters.city) {
    parts.push(`city-${filters.city.replace(/[^a-zA-Z0-9]/g, '-')}`);
  }
  
  if (filters.hasCoordinates) {
    parts.push('with-coordinates');
  }
  
  if (filters.hasPhone) {
    parts.push('with-phone');
  }
  
  if (filters.hasLink) {
    parts.push('with-link');
  }
  
  // Add count to filename
  parts.push(`${count}-stores`);
  
  return `${parts.join('-')}.csv`;
};
