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
