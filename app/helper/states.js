export const states = [
  { label: "AL", value: "AL" },
  { label: "AK", value: "AK" },
  { label: "AZ", value: "AZ" },
  { label: "AR", value: "AR" },
  { label: "CA", value: "CA" },
  { label: "CO", value: "CO" },
  { label: "CT", value: "CT" },
  { label: "DE", value: "DE" },
  { label: "FL", value: "FL" },
  { label: "GA", value: "GA" },
  { label: "HI", value: "HI" },
  { label: "ID", value: "ID" },
  { label: "IL", value: "IL" },
  { label: "IN", value: "IN" },
  { label: "IA", value: "IA" },
  { label: "KS", value: "KS" },
  { label: "KY", value: "KY" },
  { label: "LA", value: "LA" },
  { label: "ME", value: "ME" },
  { label: "MD", value: "MD" },
  { label: "MA", value: "MA" },
  { label: "MI", value: "MI" },
  { label: "MN", value: "MN" },
  { label: "MS", value: "MS" },
  { label: "MO", value: "MO" },
  { label: "MT", value: "MT" },
  { label: "NE", value: "NE" },
  { label: "NV", value: "NV" },
  { label: "NH", value: "NH" },
  { label: "NJ", value: "NJ" },
  { label: "NM", value: "NM" },
  { label: "NY", value: "NY" },
  { label: "NC", value: "NC" },
  { label: "ND", value: "ND" },
  { label: "OH", value: "OH" },
  { label: "OK", value: "OK" },
  { label: "OR", value: "OR" },
  { label: "PA", value: "PA" },
  { label: "RI", value: "RI" },
  { label: "SC", value: "SC" },
  { label: "SD", value: "SD" },
  { label: "TN", value: "TN" },
  { label: "TX", value: "TX" },
  { label: "UT", value: "UT" },
  { label: "VT", value: "VT" },
  { label: "VA", value: "VA" },
  { label: "WA", value: "WA" },
  { label: "WV", value: "WV" },
  { label: "WI", value: "WI" },
  { label: "WY", value: "WY" }
];
// US States with Google Maps Place IDs for choropleth mapping
export const US_STATES_PLACE_IDS = {
  // Alabama
  AL: "ChIJdf5LHzR_hogR6czIUzU0VV4",
  // Alaska
  AK: "ChIJG8CuwJzfAFQRNduKqSde27w",
  // Arizona
  AZ: "ChIJaxhMy-sIK4cRcc3Bf7EnOUI",
  // Arkansas
  AR: "ChIJYSc_dD-e0ocR0NLf_z5pBaQ",
  // California
  CA: "ChIJPV4oX_65j4ARVW8IJ6IJUYs",
  // Colorado
  CO: "ChIJt1YYm3QUQIcR_6eQSTGDVMc",
  // Connecticut
  CT: "ChIJpVER8hFT5okR5XBhBVttmq4",
  // Delaware
  DE: "ChIJO9YMTXYFx4kReOgEjBItHZQ",
  // Florida
  FL: "ChIJvypWkWV2wYgR0E7HW9MTLvc",
  // Georgia
  GA: "ChIJV4FfHcU28YgR5xBP7BC8hGY",
  // Hawaii
  HI: "ChIJBeB5Twbb_3sRKIbMdNKCd0s",
  // Idaho
  ID: "ChIJ6Znkhaj_WFMRWIf3FQUwa9A",
  // Illinois
  IL: "ChIJGSZubzgtC4gRVlkRZFCCFX8",
  // Indiana
  IN: "ChIJHRv42bxQa4gRcuwyy84vEH4",
  // Iowa
  IA: "ChIJGWD48W9e7ocR2VnHV0pj78Y",
  // Kansas
  KS: "ChIJawF8cXEXo4cRXwk-S6m0wmg",
  // Kentucky
  KY: "ChIJyVMZi0xzQogR_N_MxU5vH3c",
  // Louisiana
  LA: "ChIJZYIRslSkIIYRA0flgTL3Vck",
  // Maine
  ME: "ChIJ1YpTHd4dsEwR0KggZ2_MedY",
  // Maryland
  MD: "ChIJ35Dx6etNtokRsfZVdmU3r_I",
  // Massachusetts
  MA: "ChIJ_b9z6W1l44kRHA2DVTbQxkU",
  // Michigan
  MI: "ChIJEQTKxz2qTE0Rs8liellI3Zc",
  // Minnesota
  MN: "ChIJmwt4YJpbWE0RD6L-EJvJogI",
  // Mississippi
  MS: "ChIJGdRK5OQyKIYR2qbc6X8XDWI",
  // Missouri
  MO: "ChIJfeMiSNXmwIcRcr1mBFnEW7U",
  // Montana
  MT: "ChIJ04p7LZwrQVMRGGwqz1jWcfU",
  // Nebraska
  NE: "ChIJ7fwMtciNk4cRxArzDwyQJ6E",
  // Nevada
  NV: "ChIJcbTe-KEKmYARs5X8qooDR88",
  // New Hampshire
  NH: "ChIJ66bAnUtEs0wR64CmJa8CyNc",
  // New Jersey
  NJ: "ChIJn0AAnpX7wIkRjW0_-Ad70iw",
  // New Mexico
  NM: "ChIJqVKY50NQGIcRup41Yxpuv0Y",
  // New York
  NY: "ChIJqaUj8fBLzEwRZ5UY3sHGz90",
  // North Carolina
  NC: "ChIJgRo4_MQfVIgRGa4i6fUwP60",
  // North Dakota
  ND: "ChIJY-nYVxKD11IRyc9egzmahA0",
  // Ohio
  OH: "ChIJwY5NtXrpNogRFtmfnDlkzeU",
  // Oklahoma
  OK: "ChIJnU-ssRE5rIcRSOoKQDPPHF0",
  // Oregon
  OR: "ChIJVWqfm3xuk1QRdrgLettlTH0",
  // Pennsylvania
  PA: "ChIJieUyHiaALYgRPbQiUEchRsI",
  // Rhode Island
  RI: "ChIJD9cOYhQ15IkR5wbB57wYTh4",
  // South Carolina
  SC: "ChIJ49ExeWml-IgRnhcF9TKh_7k",
  // South Dakota
  SD: "ChIJkTZ9V9oEQkYRL5xI_GN1jjk",
  // Tennessee
  TN: "ChIJ9dR5qokWKIgRY6CXccL9VQk",
  // Texas
  TX: "ChIJSTKCCzZwQIYRPN4IGI8IC6E",
  // Utah
  UT: "ChIJuUD2z-cPQIYRPN4IGI8IC6E",
  // Vermont
  VT: "ChIJ_7aj2b1W5IkR5wbB57wYTh4",
  // Virginia
  VA: "ChIJzbx8o2lpTIgRZmTU5WxVMgM",
  // Washington
  WA: "ChIJ-bDD5__lhVQRuvNfbGh4QpQ",
  // West Virginia
  WV: "ChIJRQnL1J9XpYcR0NLf_z5pBaQ",
  // Wisconsin
  WI: "ChIJr-OEkw_0qFIR1kmGahnsySM",
  // Wyoming
  WY: "ChIJaSxHnpR7X4cRPd3GhnSk6M0",
};

// Helper function to get store counts by state for choropleth
export function getStoreCountsByState(stores) {
  const storeCounts = {};
  
  // Initialize all states with 0
  Object.keys(US_STATES_PLACE_IDS).forEach(stateCode => {
    storeCounts[stateCode] = 0;
  });
  
  // Count stores by state
  stores.forEach(store => {
    if (store.state && US_STATES_PLACE_IDS[store.state]) {
      storeCounts[store.state]++;
    }
  });
  
  return storeCounts;
}

// Helper function to create states object for Google Maps choropleth
export function createStatesDataForChoropleth(stores) {
  const storeCounts = getStoreCountsByState(stores);
  const states = {};
  
  // Create the format expected by Google Maps choropleth
  Object.entries(US_STATES_PLACE_IDS).forEach(([stateCode, placeId]) => {
    states[placeId] = storeCounts[stateCode] || 0;
  });
  
  return states;
}
