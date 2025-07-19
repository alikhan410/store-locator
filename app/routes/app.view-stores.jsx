import {
  Page,
  Card,
  IndexTable,
  Text,
  Link,
  useIndexResourceState,
  Filters,
  TextField,
  Spinner,
  ChoiceList,
  Checkbox,
  Box,
  Button,
  Pagination,
  Divider,
  ActionList,
  Popover,
} from "@shopify/polaris";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { states } from "../helper/states";
import { exportAllStoresToCSV, exportFilteredStoresToCSV } from "../helper/exportAction";
import StoreCSVImport from "../components/storeCSVImport";

export const loader = async () => {
  const prisma = (await import("../db.server")).default;
  const stores = await prisma.store.findMany();

  return { stores };
};

export default function StoresPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportPopoverActive, setExportPopoverActive] = useState(false);
  const navigate = useNavigate();

  const itemsPerPage = 50;

  const { stores: allStores } = useLoaderData();
  const [filteredStores, setFilteredStores] = useState(allStores);

  const paginatedStores = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStores.slice(startIndex, endIndex);
  }, [currentPage, filteredStores]);

  // 1. Mount check
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [queryValue, setQueryValue] = useState("");
  const [stateFilter, setStateFilter] = useState([]);
  const [cityFilter, setCityFilter] = useState("");
  const [hasCoordinates, setHasCoordinates] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);
  const [hasLink, setHasLink] = useState(false);

  // Callbacks
  const handleQueryChange = useCallback((value) => setQueryValue(value), []);
  const handleStateChange = useCallback((value) => setStateFilter(value), []);
  const handleCityChange = useCallback((value) => setCityFilter(value), []);

  const handleQueryValueRemove = () => setQueryValue("");
  const handleStateFilterRemove = () => setStateFilter([]);
  const handleCityFilterRemove = () => setCityFilter("");
  const handleCoordinatesRemove = () => setHasCoordinates(false);
  const handlePhoneRemove = () => setHasPhone(false);
  const handleLinkRemove = () => setHasLink(false);

  const handleHasCoordinatesChange = useCallback(
    (checked) => setHasCoordinates(checked),
    [],
  );
  const handleHasPhoneChange = useCallback(
    (checked) => setHasPhone(checked),
    [],
  );
  const handleHasLinkChange = useCallback(
    (checked) => setHasLink(checked),
    [],
  );

  const handleClearAll = useCallback(() => {
    setQueryValue("");
    setStateFilter([]);
    setCityFilter("");
    setHasCoordinates(false);
    setHasPhone(false);
    setHasLink(false);
    setFilteredStores(allStores);
    setCurrentPage(1);
  }, [allStores]);

  const appliedFilters = [];
  if (queryValue) {
    appliedFilters.push({
      key: "query",
      label: `Search: ${queryValue}`,
      onRemove: handleQueryValueRemove,
    });
  }
  if (stateFilter.length > 0) {
    appliedFilters.push({
      key: "state",
      label: `State: ${stateFilter.join(", ")}`,
      onRemove: handleStateFilterRemove,
    });
  }
  if (cityFilter) {
    appliedFilters.push({
      key: "city",
      label: `City: ${cityFilter}`,
      onRemove: handleCityFilterRemove,
    });
  }
  if (hasCoordinates) {
    appliedFilters.push({
      key: "coordinates",
      label: "Has coordinates",
      onRemove: handleCoordinatesRemove,
    });
  }
  if (hasPhone) {
    appliedFilters.push({
      key: "phone",
      label: "Has phone",
      onRemove: handlePhoneRemove,
    });
  }
  if (hasLink) {
    appliedFilters.push({
      key: "link",
      label: "Has link",
      onRemove: handleLinkRemove,
    });
  }

  const filters = [
    {
      key: "query",
      label: "Search",
      filter: (
        <TextField
          label="Search stores"
          value={queryValue}
          onChange={handleQueryChange}
          autoComplete="off"
          labelHidden
        />
      ),
      shortcut: true,
    },
    {
      key: "state",
      label: "State",
      filter: (
        <ChoiceList
          title="State"
          titleHidden
          choices={states.map((state) => ({
            label: state,
            value: state,
          }))}
          selected={stateFilter}
          onChange={handleStateChange}
          allowMultiple
        />
      ),
    },
    {
      key: "city",
      label: "City",
      filter: (
        <TextField
          label="City"
          value={cityFilter}
          onChange={handleCityChange}
          autoComplete="off"
          labelHidden
        />
      ),
    },
    {
      key: "hasCoordinates",
      label: "Has Coordinates",
      filter: (
        <Checkbox
          label="Has Coordinates"
          checked={hasCoordinates}
          onChange={handleHasCoordinatesChange}
        />
      ),
    },
    {
      key: "hasPhone",
      label: "Has Phone",
      filter: (
        <Checkbox
          label="Has Phone"
          checked={hasPhone}
          onChange={handleHasPhoneChange}
        />
      ),
    },
    {
      key: "hasLink",
      label: "Has Link",
      filter: (
        <Checkbox
          label="Has Link"
          checked={hasLink}
          onChange={handleHasLinkChange}
        />
      ),
    },
  ];

  // This would trigger a fetch
  const fetchFilteredStores = useCallback(() => {
    const params = new URLSearchParams();

    if (queryValue) params.append("query", queryValue);
    if (stateFilter.length > 0) params.append("state", stateFilter.join(","));
    if (cityFilter) params.append("city", cityFilter);
    if (hasCoordinates) params.append("hasCoordinates", "true");
    if (hasPhone) params.append("hasPhone", "true");
    if (hasLink) params.append("hasLink", "true");

    fetch(`/filter?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Filtered stores:", data);
        setFilteredStores(data.stores);
        setCurrentPage(1);
      })
      .catch((err) => console.error("Failed to fetch stores:", err));
  }, [queryValue, stateFilter, cityFilter, hasCoordinates, hasPhone, hasLink]);

  function applyFilters() {
    fetchFilteredStores();
  }

  function onImport(parsedStores) {
    fetch("/import-stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stores: parsedStores }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Refresh the stores list
        window.location.reload();
      } else {
        console.error("Import failed:", data.error);
      }
    })
    .catch(error => {
      console.error("Import error:", error);
    });
    setShowImportModal(false);
  }

  // Export functions
  const handleExportAll = useCallback(() => {
    exportAllStoresToCSV(allStores);
    setExportPopoverActive(false);
  }, [allStores]);

  const handleExportFiltered = useCallback(() => {
    const currentFilters = {
      query: queryValue,
      state: stateFilter,
      city: cityFilter,
      hasCoordinates,
      hasPhone,
      hasLink,
    };
    exportFilteredStoresToCSV(filteredStores, currentFilters);
    setExportPopoverActive(false);
  }, [filteredStores, queryValue, stateFilter, cityFilter, hasCoordinates, hasPhone, hasLink]);

  const exportActions = [
    {
      content: `Export all stores (${allStores.length})`,
      onAction: handleExportAll,
    },
    {
      content: `Export filtered stores (${filteredStores.length})`,
      onAction: handleExportFiltered,
      disabled: filteredStores.length === allStores.length && appliedFilters.length === 0,
    },
  ];

  const resourceName = {
    singular: "store",
    plural: "stores",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(filteredStores);

  const rowMarkup = paginatedStores.map((store, index) => (
    <IndexTable.Row
      dataPrimaryLink
      selected={selectedResources.includes(store.id)}
      id={store.id}
      key={store.id}
      position={index}
    >
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd" fontWeight="bold">
          {store.name}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text>
          {store.address}
          {store.address2 ? `, ${store.address2}` : ""}, {store.zip}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{store.city}</IndexTable.Cell>
      <IndexTable.Cell>{store.state}</IndexTable.Cell>
      <IndexTable.Cell>{store.country}</IndexTable.Cell>
      <IndexTable.Cell>{store.lat || "N/A"}</IndexTable.Cell>
      <IndexTable.Cell>{store.lng || "N/A"}</IndexTable.Cell>
      <IndexTable.Cell>{store.phone || "N/A"}</IndexTable.Cell>
      {/* <IndexTable.Cell>
        {store.link ? (
          <Link url={store.link} target="_blank">
            Visit
          </Link>
        ) : (
          "N/A"
        )}
      </IndexTable.Cell> */}
      <IndexTable.Cell>
        <Link dataPrimaryLink url={`/app/edit-store/${store.id}`}></Link>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));
  if (!isMounted) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Spinner accessibilityLabel="Loading stores..." size="large" />
      </div>
    );
  }
  return (
    <Page
      title={"Stores"}
      primaryAction={{
        content: "Add a store",
        onAction: () => navigate("/app/add-store"),
      }}
              secondaryActions={[
          {
            content: "🗺️ Map View",
            accessibilityLabel: "View stores on map",
            onAction: () => navigate("/app/map"),
          },
          {
            content: "Import",
            accessibilityLabel: "Import store list",
            onAction: () => setShowImportModal(true),
          },
        ]}
    >
      <Card>
        {
          <Filters
            queryValue={queryValue}
            filters={filters}
            appliedFilters={appliedFilters}
            onQueryChange={handleQueryChange}
            onQueryClear={() => setQueryValue("")}
            onClearAll={handleClearAll}
          >
            <Box paddingInlineStart="200">
              <Button onClick={applyFilters} size="micro" variant="secondary">
                Apply Filters
              </Button>
            </Box>
          </Filters>
        }
        
        {/* Export Button with Popover */}
        <Box padding="400" paddingBlockStart="200">
          <Popover
            active={exportPopoverActive}
            activator={
              <Button
                onClick={() => setExportPopoverActive(true)}
                disclosure
                accessibilityLabel="Export options"
              >
                Export Stores
              </Button>
            }
            onClose={() => setExportPopoverActive(false)}
            preferredAlignment="right"
          >
            <ActionList
              actionRole="menuitem"
              items={exportActions}
            />
          </Popover>
        </Box>
        
        <IndexTable
          resourceName={resourceName}
          itemCount={filteredStores.length}
          selectedItemsCount={
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          headings={[
            { title: "Name" },
            { title: "Address" },
            { title: "City" },
            { title: "State" },
            { title: "Country" },
            { title: "Latitude" },
            { title: "Longitude" },
            { title: "Phone" },
            // { title: "Link" },
            // { title: "Actions" },
          ]}
          selectable
        >
          {rowMarkup}
        </IndexTable>
        <Divider />
        <div style={{ paddingTop: "10px" }}>
          <Pagination
            onPrevious={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            onNext={() =>
              setCurrentPage((prev) =>
                prev < Math.ceil(filteredStores.length / itemsPerPage)
                  ? prev + 1
                  : prev,
              )
            }
            type="page"
            hasPrevious={currentPage > 1}
            hasNext={
              filteredStores.length > 0 &&
              currentPage < Math.ceil(filteredStores.length / itemsPerPage)
            }
            label={`${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredStores.length)} of ${filteredStores.length} stores`}
          />
        </div>
      </Card>
      {showImportModal && (
        <StoreCSVImport onImport={onImport} onClose={() => setShowImportModal(false)} />
      )}
    </Page>
  );
}
