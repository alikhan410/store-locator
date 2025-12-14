import {
  TextField,
  IndexTable,
  Card,
  IndexFilters,
  useSetIndexFiltersMode,
  useIndexResourceState,
  Text,
  ChoiceList,
  RangeSlider,
  Badge,
  useBreakpoints,
  Page,
  Spinner,
  Divider,
  Pagination,
  Link,
} from "@shopify/polaris";
import { useState, useCallback, useEffect, useMemo } from "react";
import {
  useLoaderData,
  useSubmit,
  useActionData,
  useNavigate,
} from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  exportAllStoresToCSV,
  exportFilteredStoresToCSV,
} from "../helper/exportAction";
import StoreCSVImport from "../components/storeCSVImport";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  ExportIcon,
  ImportIcon,
  GlobeIcon,
  DeleteIcon,
} from "@shopify/polaris-icons";
import { ExportModal, BulkDeleteModal } from "../components/modals";
import { states } from "../helper/states";

export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const prisma = (await import("../db.server")).default;

  // Get subscription information
  const { appSubscriptions } = await billing.check();
  const subscription = appSubscriptions?.[0];

  // Parse URL parameters for pagination
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 50; // Stores per page
  const skip = (page - 1) * limit;

  // Build base where clause
  const whereClause = {
    shop: session.shop, // GDPR compliance
  };

  // Get total count for pagination info
  const totalCount = await prisma.store.count({
    where: whereClause,
  });

  // Get paginated stores
  const stores = await prisma.store.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: { name: "asc" }, // Consistent ordering
  });

  return {
    stores,
    subscription,
    pagination: {
      currentPage: page,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrevious: page > 1,
      limit,
    },
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "bulk_delete") {
    const storeIds = formData.getAll("storeIds");

    if (!storeIds || storeIds.length === 0) {
      return { success: false, error: "No stores selected for deletion" };
    }

    try {
      const prisma = (await import("../db.server")).default;

      // Delete stores that belong to the current shop (security check)
      const deletedStores = await prisma.store.deleteMany({
        where: {
          id: { in: storeIds },
          shop: session.shop, // Ensure only stores from current shop are deleted
        },
      });

      return {
        success: true,
        message: `Successfully deleted ${deletedStores.count} stores`,
        deletedCount: deletedStores.count,
      };
    } catch (error) {
      console.error("Bulk delete error:", error);
      return { success: false, error: "Failed to delete stores" };
    }
  }

  return { success: false, error: "Invalid action" };
};

export default function IndexTableWithViewsSearchFilterSorting() {
  const [isMounted, setIsMounted] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const breakpoints = useBreakpoints();

  const { stores, subscription, pagination } = useLoaderData();
  const submit = useSubmit();
  const actionData = useActionData();
  const navigate = useNavigate();
  const shopify = useAppBridge();

  const [accountStatus, setAccountStatus] = useState(undefined);
  const [hasCoordinates, setHasCoordinates] = useState(undefined);
  const [hasPhone, setHasPhone] = useState(undefined);
  const [hasLink, setHasLink] = useState(undefined);
  const [taggedWith, setTaggedWith] = useState("");
  const [queryValue, setQueryValue] = useState("");
  const [stateFilter, setStateFilter] = useState([]);

  // Add back client-side filtering for Phase 1
  const [filteredStores, setFilteredStores] = useState(stores);

  // 1. Mount check
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle action data response
  useEffect(() => {
    if (actionData?.success) {
      // Refresh the page to show updated data
      window.location.reload();
    } else if (actionData?.error) {
      console.error("Action failed:", actionData.error);
    }
  }, [actionData]);

  useEffect(() => {
    let filtered = stores;

    // Filter by query (search)
    if (queryValue) {
      const query = queryValue.toLowerCase();
      filtered = filtered.filter(
        (store) =>
          store.name?.toLowerCase().includes(query) ||
          store.address?.toLowerCase().includes(query) ||
          store.city?.toLowerCase().includes(query) ||
          store.state?.toLowerCase().includes(query) ||
          store.country?.toLowerCase().includes(query) ||
          store.phone?.toLowerCase().includes(query),
      );
    }

    // Filter by account status
    if (accountStatus && accountStatus.length > 0) {
      // For now, we'll keep all stores since we don't have account status data
      // This can be implemented when account status data is available
    }

    // Filter by has coordinates
    if (hasCoordinates && hasCoordinates.length > 0) {
      if (hasCoordinates.includes("has")) {
        filtered = filtered.filter((store) => {
          const hasLat =
            store.lat !== null && store.lat !== undefined && store.lat !== "";
          const hasLng =
            store.lng !== null && store.lng !== undefined && store.lng !== "";
          return hasLat && hasLng;
        });
      }
      if (hasCoordinates.includes("none")) {
        filtered = filtered.filter((store) => {
          const hasLat =
            store.lat !== null && store.lat !== undefined && store.lat !== "";
          const hasLng =
            store.lng !== null && store.lng !== undefined && store.lng !== "";
          return !hasLat || !hasLng;
        });
      }
    }

    // Filter by has phone
    if (hasPhone && hasPhone.length > 0) {
      if (hasPhone.includes("has")) {
        filtered = filtered.filter((store) => {
          return (
            store.phone !== null &&
            store.phone !== undefined &&
            store.phone !== ""
          );
        });
      }
      if (hasPhone.includes("none")) {
        filtered = filtered.filter((store) => {
          return !store.phone || store.phone === null || store.phone === "";
        });
      }
    }

    // Filter by has link
    if (hasLink && hasLink.length > 0) {
      if (hasLink.includes("has")) {
        filtered = filtered.filter((store) => {
          return (
            store.link !== null && store.link !== undefined && store.link !== ""
          );
        });
      }
      if (hasLink.includes("none")) {
        filtered = filtered.filter((store) => {
          return !store.link || store.link === null || store.link === "";
        });
      }
    }

    // Filter by tagged with (city)
    if (taggedWith) {
      const city = taggedWith.toLowerCase();
      filtered = filtered.filter((store) =>
        store.city?.toLowerCase().includes(city),
      );
    }

    // Filter by state
    if (stateFilter && stateFilter.length > 0) {
      filtered = filtered.filter((store) => stateFilter.includes(store.state));
    }

    setFilteredStores(filtered);
  }, [
    stores,
    queryValue,
    accountStatus,
    hasCoordinates,
    hasPhone,
    hasLink,
    taggedWith,
    stateFilter,
  ]);

  // Use filtered stores for display
  const paginatedStores = filteredStores;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const [itemStrings, setItemStrings] = useState([
    "All",
    "Colorado",
    "Phone Missing",
  ]);
  const deleteView = (index) => {
    const newItemStrings = [...itemStrings];
    newItemStrings.splice(index, 1);
    setItemStrings(newItemStrings);
    setSelected(0);
  };

  const duplicateView = async (name) => {
    setItemStrings([...itemStrings, name]);
    setSelected(itemStrings.length);
    await sleep(1);
    return true;
  };

  const tabs = itemStrings.map((item, index) => ({
    content: item,
    index,
    onAction: () => {},
    id: `${item}-${index}`,
    isLocked: index === 0,
    actions:
      index === 0
        ? []
        : [
            {
              type: "rename",
              onAction: () => {},
              onPrimaryAction: async (value) => {
                const newItemsStrings = tabs.map((item, idx) => {
                  if (idx === index) {
                    return value;
                  }
                  return item.content;
                });
                await sleep(1);
                setItemStrings(newItemsStrings);
                return true;
              },
            },
            {
              type: "duplicate",
              onPrimaryAction: async (value) => {
                await sleep(1);
                duplicateView(value);
                return true;
              },
            },
            {
              type: "edit",
            },
            {
              type: "delete",
              onPrimaryAction: async () => {
                await sleep(1);
                deleteView(index);
                return true;
              },
            },
          ],
  }));
  const [selected, setSelected] = useState(0);
  const onCreateNewView = async (value) => {
    await sleep(500);
    setItemStrings([...itemStrings, value]);
    setSelected(itemStrings.length);
    return true;
  };
  const sortOptions = [
    { label: "Order", value: "order asc", directionLabel: "Ascending" },
    { label: "Order", value: "order desc", directionLabel: "Descending" },
    { label: "Customer", value: "customer asc", directionLabel: "A-Z" },
    { label: "Customer", value: "customer desc", directionLabel: "Z-A" },
    { label: "Date", value: "date asc", directionLabel: "A-Z" },
    { label: "Date", value: "date desc", directionLabel: "Z-A" },
    { label: "Total", value: "total asc", directionLabel: "Ascending" },
    { label: "Total", value: "total desc", directionLabel: "Descending" },
  ];
  const [sortSelected, setSortSelected] = useState(["order asc"]);
  const { mode, setMode } = useSetIndexFiltersMode();
  const onHandleCancel = () => {};

  const onHandleSave = async () => {
    await sleep(1);
    return true;
  };

  const primaryAction =
    selected === 0
      ? {
          type: "save-as",
          onAction: onCreateNewView,
          disabled: false,
          loading: false,
        }
      : {
          type: "save",
          onAction: onHandleSave,
          disabled: false,
          loading: false,
        };

  // Export functions - moved here after all state variables are declared
  const handleExportAll = useCallback(() => {
    // Note: This only exports current page data for Phase 1
    // In Phase 2, we'll implement server-side export for all data
    exportAllStoresToCSV(stores);
  }, [stores]);

  const handleExportFiltered = useCallback(() => {
    // Note: This only exports current page data for Phase 1
    // In Phase 2, we'll implement server-side export for filtered data
    const currentFilters = {
      query: queryValue,
      state: stateFilter,
      city: taggedWith,
      hasCoordinates: hasCoordinates,
    };
    exportFilteredStoresToCSV(paginatedStores, currentFilters);
  }, [paginatedStores, queryValue, stateFilter, taggedWith, hasCoordinates]);

  function onImport(parsedStores) {
    fetch("/import-stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stores: parsedStores }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Refresh the stores list
          window.location.reload();
        } else {
          console.error("Import failed:", data.error);
        }
      })
      .catch((error) => {
        console.error("Import error:", error);
      });
  }

  const handleExportModalClose = () => {
    shopify.modal.hide("export-modal");
  };

  const handleAccountStatusChange = useCallback(
    (value) => setAccountStatus(value),
    [],
  );
  const handleHasCoordinatesChange = useCallback(
    (value) => setHasCoordinates(value),
    [],
  );
  const handleHasPhoneChange = useCallback((value) => setHasPhone(value), []);
  const handleHasLinkChange = useCallback((value) => setHasLink(value), []);
  const handleTaggedWithChange = useCallback(
    (value) => setTaggedWith(value),
    [],
  );
  const handleStateFilterChange = useCallback(
    (value) => setStateFilter(value),
    [],
  );
  const handleFiltersQueryChange = useCallback(
    (value) => setQueryValue(value),
    [],
  );
  const handleAccountStatusRemove = useCallback(
    () => setAccountStatus(undefined),
    [],
  );
  const handleHasCoordinatesRemove = useCallback(
    () => setHasCoordinates(undefined),
    [],
  );
  const handleHasPhoneRemove = useCallback(() => setHasPhone(undefined), []);
  const handleHasLinkRemove = useCallback(() => setHasLink(undefined), []);
  const handleTaggedWithRemove = useCallback(() => setTaggedWith(""), []);
  const handleStateFilterRemove = useCallback(() => setStateFilter([]), []);
  const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);
  const handleFiltersClearAll = useCallback(() => {
    handleAccountStatusRemove();
    handleHasCoordinatesRemove();
    handleHasPhoneRemove();
    handleHasLinkRemove();
    handleQueryValueRemove();
    handleTaggedWithRemove();
    handleStateFilterRemove();
  }, [
    handleAccountStatusRemove,
    handleHasCoordinatesRemove,
    handleHasPhoneRemove,
    handleHasLinkRemove,
    handleQueryValueRemove,
    handleTaggedWithRemove,
    handleStateFilterRemove,
  ]);

  const filters = [
    {
      key: "accountStatus",
      label: "Account status",
      filter: (
        <ChoiceList
          title="Account status"
          titleHidden
          choices={[
            { label: "Enabled", value: "enabled" },
            { label: "Not invited", value: "not invited" },
            { label: "Invited", value: "invited" },
            { label: "Declined", value: "declined" },
          ]}
          selected={accountStatus || []}
          onChange={handleAccountStatusChange}
        />
      ),
      shortcut: true,
    },
    {
      key: "taggedWith",
      label: "Tagged with",
      filter: (
        <TextField
          label="Tagged with"
          value={taggedWith}
          onChange={handleTaggedWithChange}
          autoComplete="off"
          labelHidden
        />
      ),
      shortcut: true,
    },
    {
      key: "hasCoordinates",
      label: "Has coordinates",
      filter: (
        <ChoiceList
          title="Has coordinates"
          titleHidden
          choices={[
            { label: "Has coordinates", value: "has" },
            { label: "No coordinates", value: "none" },
          ]}
          selected={hasCoordinates || []}
          onChange={handleHasCoordinatesChange}
        />
      ),
      shortcut: true,
    },
    {
      key: "hasPhone",
      label: "Has phone",
      filter: (
        <ChoiceList
          title="Has phone"
          titleHidden
          choices={[
            { label: "Has phone", value: "has" },
            { label: "No phone", value: "none" },
          ]}
          selected={hasPhone || []}
          onChange={handleHasPhoneChange}
        />
      ),
      shortcut: true,
    },
    {
      key: "hasLink",
      label: "Has link",
      filter: (
        <ChoiceList
          title="Has link"
          titleHidden
          choices={[
            { label: "Has link", value: "has" },
            { label: "No link", value: "none" },
          ]}
          selected={hasLink || []}
          onChange={handleHasLinkChange}
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
          choices={states}
          selected={stateFilter}
          onChange={handleStateFilterChange}
          allowMultiple
        />
      ),
    },
  ];

  const appliedFilters = [];
  if (accountStatus && !isEmpty(accountStatus)) {
    const key = "accountStatus";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, accountStatus),
      onRemove: handleAccountStatusRemove,
    });
  }
  if (hasCoordinates) {
    const key = "hasCoordinates";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, hasCoordinates),
      onRemove: handleHasCoordinatesRemove,
    });
  }
  if (hasPhone) {
    const key = "hasPhone";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, hasPhone),
      onRemove: handleHasPhoneRemove,
    });
  }
  if (hasLink) {
    const key = "hasLink";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, hasLink),
      onRemove: handleHasLinkRemove,
    });
  }
  if (!isEmpty(taggedWith)) {
    const key = "taggedWith";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, taggedWith),
      onRemove: handleTaggedWithRemove,
    });
  }
  if (stateFilter && stateFilter.length > 0) {
    const key = "state";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, stateFilter),
      onRemove: handleStateFilterRemove,
    });
  }

  const resourceName = {
    singular: "store",
    plural: "stores",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(paginatedStores);

  // Clear selection when stores change (e.g., when navigating pages)
  useEffect(() => {
    // This will clear the selection when the stores array changes
    // The useIndexResourceState hook will handle the clearing automatically
  }, [paginatedStores]);

  // Bulk delete functionality - moved here after selectedResources is declared
  const handleBulkDelete = useCallback(() => {
    shopify.modal.show("bulk-delete-modal");
  }, []);

  const handleConfirmDelete = useCallback(() => {
    setDeleteLoading(true);

    const formData = new FormData();
    formData.append("action", "bulk_delete");

    // Add selected store IDs
    selectedResources.forEach((storeId) => {
      formData.append("storeIds", storeId);
    });

    submit(formData, { method: "post" });
    shopify.modal.hide("bulk-delete-modal");
  }, [selectedResources, submit]);

  const handleCancelDelete = useCallback(() => {
    shopify.modal.hide("bulk-delete-modal");
    setDeleteLoading(false);
  }, []);

  const promotedBulkActions = [
    {
      icon: DeleteIcon,
      destructive: true,
      content: `Delete ${selectedResources.length} ${selectedResources.length === 1 ? "store" : "stores"}`,
      onAction: handleBulkDelete,
      disabled: selectedResources.length === 0,
    },
  ];

  const rowMarkup = paginatedStores.map((store, index) => (
    <IndexTable.Row
      dataPrimaryLink
      id={store.id}
      key={store.id}
      selected={selectedResources.includes(store.id)}
      position={index}
    >
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
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
      title="Stores"
      primaryAction={{
        content: "Add a store",
        onAction: () => navigate("/app/add-store"),
      }}
      secondaryActions={[
        {
          icon: GlobeIcon,
          content: "Distribution Map",
          accessibilityLabel: "View store distribution map",
          onAction: () => navigate("/app/choropleth"),
        },
        {
          icon: ExportIcon,
          content: "Export",
          accessibilityLabel: "export store list",
          onAction: () => {
            shopify.modal.show("export-modal");
          },
        },
        {
          icon: ImportIcon,
          content: "Import",
          accessibilityLabel: "Import store list",
          onAction: () => {
            shopify.modal.show("import-csv-modal");
          },
        },
      ]}
    >
      <Card>
        <IndexFilters
          sortOptions={sortOptions}
          sortSelected={sortSelected}
          queryValue={queryValue}
          queryPlaceholder="Searching in all"
          onQueryChange={handleFiltersQueryChange}
          onQueryClear={() => setQueryValue("")}
          onSort={setSortSelected}
          primaryAction={primaryAction}
          cancelAction={{
            onAction: onHandleCancel,
            disabled: false,
            loading: false,
          }}
          tabs={tabs}
          selected={selected}
          onSelect={setSelected}
          canCreateNewView
          onCreateNewView={onCreateNewView}
          filters={filters}
          appliedFilters={appliedFilters}
          onClearAll={handleFiltersClearAll}
          mode={mode}
          setMode={setMode}
        />
        <IndexTable
          condensed={breakpoints.smDown}
          resourceName={resourceName}
          itemCount={paginatedStores.length}
          selectedItemsCount={
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          promotedBulkActions={promotedBulkActions}
          headings={[
            { title: "Name" },
            { title: "Address" },
            { title: "City" },
            { title: "State" },
            { title: "Country" },
            { title: "Latitude" },
            { title: "Longitude" },
            { title: "Phone" },
          ]}
        >
          {rowMarkup}
        </IndexTable>
        <Divider />
        <div style={{ paddingTop: "10px" }}>
          <Pagination
            onPrevious={() => {
              const params = new URLSearchParams(window.location.search);
              const currentPage = parseInt(params.get("page") || "1");
              params.set("page", (currentPage - 1).toString());
              navigate(`/app/view-stores?${params.toString()}`);
            }}
            onNext={() => {
              const params = new URLSearchParams(window.location.search);
              const currentPage = parseInt(params.get("page") || "1");
              params.set("page", (currentPage + 1).toString());
              navigate(`/app/view-stores?${params.toString()}`);
            }}
            type="page"
            hasPrevious={pagination.hasPrevious}
            hasNext={pagination.hasNext}
            label={`${(pagination.currentPage - 1) * pagination.limit + 1}-${Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of ${pagination.totalCount} stores`}
          />
        </div>
      </Card>

      <StoreCSVImport
        onImport={onImport}
        onClose={() => shopify.modal.hide("import-csv-modal")}
      />

      <ExportModal
        onClose={handleExportModalClose}
        onExport={handleExportModalClose}
        exportCounts={{
          current: paginatedStores.length,
          all: pagination.totalCount,
          selected: selectedResources.length,
          filtered: paginatedStores.length,
        }}
        selectedCount={selectedResources.length}
        filteredCount={paginatedStores.length}
        canExportSelected={true}
        canExportFiltered={true}
      />

      <BulkDeleteModal
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        selectedCount={selectedResources.length}
        loading={deleteLoading}
      />
    </Page>
  );

  function disambiguateLabel(key, value) {
    switch (key) {
      case "hasCoordinates":
        return value
          .map((val) => (val === "has" ? "Has coordinates" : "No coordinates"))
          .join(", ");
      case "hasPhone":
        return value
          .map((val) => (val === "has" ? "Has phone" : "No phone"))
          .join(", ");
      case "hasLink":
        return value
          .map((val) => (val === "has" ? "Has link" : "No link"))
          .join(", ");
      case "taggedWith":
        return `Tagged with ${value}`;
      case "accountStatus":
        return value.map((val) => `Customer ${val}`).join(", ");
      case "state":
        return `State: ${value.join(", ")}`;
      default:
        return value;
    }
  }

  function isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    } else {
      return value === "" || value == null;
    }
  }
}
