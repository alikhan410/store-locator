import {
  TextField,
  IndexTable,
  Card,
  IndexFilters,
  useSetIndexFiltersMode,
  useIndexResourceState,
  Text,
  ChoiceList,
  useBreakpoints,
  Page,
  Spinner,
  Divider,
  Pagination,
  Link,
} from "@shopify/polaris";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  useLoaderData,
  useSubmit,
  useActionData,
  useNavigate,
  useLocation,
  useNavigation,
  useRevalidator,
} from "@remix-run/react";
import { authenticate } from "../shopify.server";
import StoreCSVImport from "../components/storeCSVImport";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  ExportIcon,
  ImportIcon,
  GlobeIcon,
  DeleteIcon,
  SaveIcon,
} from "@shopify/polaris-icons";
import { ExportModal, BulkDeleteModal, SaveViewModal } from "../components/modals";
import { states } from "../helper/states";

// Helper function to build where clause from filters (reusable for loader and action)
function buildWhereClause(shop, filters = {}) {
  const conditions = [
    { shop }, // GDPR compliance - always required
  ];

  const { query, hasCoordinates, hasPhone, hasLink } = filters;

  // Add search conditions if query is provided
  if (query) {
    const searchTerm = query.trim();
    if (searchTerm) {
      conditions.push({
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { address: { contains: searchTerm, mode: "insensitive" } },
          { city: { contains: searchTerm, mode: "insensitive" } },
          { state: { contains: searchTerm, mode: "insensitive" } },
          { country: { contains: searchTerm, mode: "insensitive" } },
          { phone: { contains: searchTerm, mode: "insensitive" } },
        ],
      });
    }
  }

  // Add hasCoordinates filter
  if (hasCoordinates === "has") {
    conditions.push({
      lat: { not: null },
      lng: { not: null },
    });
  } else if (hasCoordinates === "none") {
    conditions.push({
      OR: [
        { lat: null },
        { lng: null },
      ],
    });
  }

  // Add hasPhone filter
  if (hasPhone === "has") {
    conditions.push({
      phone: { not: null, not: "" },
    });
  } else if (hasPhone === "none") {
    conditions.push({
      OR: [
        { phone: null },
        { phone: "" },
      ],
    });
  }

  // Add hasLink filter
  if (hasLink === "has") {
    conditions.push({
      link: { not: null, not: "" },
    });
  } else if (hasLink === "none") {
    conditions.push({
      OR: [
        { link: null },
        { link: "" },
      ],
    });
  }

  // Add state filter if provided
  if (filters.stateFilter && Array.isArray(filters.stateFilter) && filters.stateFilter.length > 0) {
    conditions.push({
      state: { in: filters.stateFilter },
    });
  }

  // Add city filter if provided (taggedWith)
  if (filters.city) {
    conditions.push({
      city: { contains: filters.city, mode: "insensitive" },
    });
  }

  return {
    AND: conditions,
  };
}

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const prisma = (await import("../db.server")).default;

  // Parse URL parameters for pagination, search, and filters
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const query = url.searchParams.get("query") || "";
  const hasCoordinates = url.searchParams.get("hasCoordinates");
  const hasPhone = url.searchParams.get("hasPhone");
  const hasLink = url.searchParams.get("hasLink");
  const city = url.searchParams.get("city") || "";
  const stateFilterStr = url.searchParams.get("stateFilter");
  const stateFilter = stateFilterStr ? JSON.parse(stateFilterStr) : [];
  const limit = 50; // Stores per page
  const skip = (page - 1) * limit;

  // Build where clause using helper function
  const whereClause = buildWhereClause(session.shop, {
    query,
    hasCoordinates,
    hasPhone,
    hasLink,
    city,
    stateFilter,
  });

  // Get total count for pagination info (with filters applied)
  const totalCount = await prisma.store.count({
    where: whereClause,
  });

  // Get total count of ALL stores (no filters, just shop)
  const totalAllStores = await prisma.store.count({
    where: { shop: session.shop },
  });

  // Get paginated stores (with filters applied)
  const stores = await prisma.store.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: { name: "asc" }, // Consistent ordering
  });

  // Ensure default saved views exist
  const defaultViews = [
    {
      name: "Missing Coordinates",
      filters: JSON.stringify({ hasCoordinates: ["none"] }),
      isDefault: true,
    },
    {
      name: "Missing Phone",
      filters: JSON.stringify({ hasPhone: ["none"] }),
      isDefault: true,
    },
  ];

  // Create default views if they don't exist
  for (const defaultView of defaultViews) {
    await prisma.savedView.upsert({
      where: {
        shop_name: {
          shop: session.shop,
          name: defaultView.name,
        },
      },
      update: {},
      create: {
        shop: session.shop,
        ...defaultView,
      },
    });
  }

  // Fetch all saved views for this shop
  const savedViews = await prisma.savedView.findMany({
    where: { shop: session.shop },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return {
    stores,
    savedViews,
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

  // Handle export_stores action
  if (action === "export_stores") {
    try {
      const prisma = (await import("../db.server")).default;
      
      // Get filter parameters
      const query = formData.get("query") || "";
      const hasCoordinates = formData.get("hasCoordinates") || null;
      const hasPhone = formData.get("hasPhone") || null;
      const hasLink = formData.get("hasLink") || null;
      const stateFilterStr = formData.get("stateFilter");
      const city = formData.get("city") || "";
      
      const stateFilter = stateFilterStr ? JSON.parse(stateFilterStr) : [];
      
      // Build where clause using same logic as loader
      const whereClause = buildWhereClause(session.shop, {
        query,
        hasCoordinates,
        hasPhone,
        hasLink,
        stateFilter,
        city,
      });

      // Fetch ALL stores matching filters (no pagination)
      const stores = await prisma.store.findMany({
        where: whereClause,
        orderBy: { name: "asc" },
      });

      // Generate CSV content
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

      // Generate filename based on filters
      const filterParts = [];
      if (query) filterParts.push(`search-${query.substring(0, 20)}`);
      if (hasCoordinates) filterParts.push(`coords-${hasCoordinates}`);
      if (hasPhone) filterParts.push(`phone-${hasPhone}`);
      if (hasLink) filterParts.push(`link-${hasLink}`);
      if (stateFilter.length > 0) filterParts.push(`${stateFilter.length}-states`);
      if (city) filterParts.push(`city-${city.substring(0, 15)}`);
      
      const filename = filterParts.length > 0 
        ? `stores-${filterParts.join("-")}-${stores.length}.csv`
        : `all-stores-${stores.length}.csv`;

      // Return CSV response
      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv;charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (error) {
      console.error("Export error:", error);
      return new Response(
        `Failed to export stores: ${error.message}`,
        {
          status: 500,
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );
    }
  }

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

  if (action === "save_view") {
    const viewName = formData.get("viewName");
    const filters = formData.get("filters");

    if (!viewName || !filters) {
      return { success: false, error: "View name and filters are required" };
    }

    try {
      const prisma = (await import("../db.server")).default;

      const savedView = await prisma.savedView.create({
        data: {
          shop: session.shop,
          name: viewName,
          filters: filters,
          isDefault: false,
        },
      });

      return {
        success: true,
        action: "save_view",
        savedView,
      };
    } catch (error) {
      console.error("Save view error:", error);
      if (error.code === "P2002") {
        return { success: false, action: "save_view", error: "A view with this name already exists" };
      }
      return { success: false, action: "save_view", error: "Failed to save view" };
    }
  }

  if (action === "update_view") {
    const viewId = formData.get("viewId");
    const filters = formData.get("filters");

    if (!viewId || !filters) {
      return { success: false, action: "update_view", error: "View ID and filters are required" };
    }

    try {
      const prisma = (await import("../db.server")).default;

      const updatedView = await prisma.savedView.update({
        where: {
          id: viewId,
          shop: session.shop, // Ensure user can only update their own views
        },
        data: {
          filters: filters,
        },
      });

      return {
        success: true,
        action: "update_view",
        savedView: updatedView,
      };
    } catch (error) {
      console.error("Update view error:", error);
      return { success: false, action: "update_view", error: "Failed to update view" };
    }
  }

  if (action === "delete_view") {
    const viewId = formData.get("viewId");

    if (!viewId) {
      return { success: false, error: "View ID is required" };
    }

    try {
      const prisma = (await import("../db.server")).default;

      await prisma.savedView.delete({
        where: {
          id: viewId,
          shop: session.shop, // GDPR compliance
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error("Delete view error:", error);
      return { success: false, error: "Failed to delete view" };
    }
  }

  return { success: false, error: "Invalid action" };
};

export default function IndexTableWithViewsSearchFilterSorting() {
  const shopify = useAppBridge();
  const [isMounted, setIsMounted] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const breakpoints = useBreakpoints();

  const { stores, pagination, savedViews } = useLoaderData();
  const submit = useSubmit();
  const actionData = useActionData();
  const navigate = useNavigate();
  const location = useLocation();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  
  const isNavigating = navigation.state === "loading";

  const [hasCoordinates, setHasCoordinates] = useState(undefined);
  const [hasPhone, setHasPhone] = useState(undefined);
  const [hasLink, setHasLink] = useState(undefined);
  const [taggedWith, setTaggedWith] = useState("");
  const [queryValue, setQueryValue] = useState("");
  const [stateFilter, setStateFilter] = useState([]);
  const [navigatingToMap, setNavigatingToMap] = useState(false);
  const searchTimeoutRef = useRef(null);
  const [saveViewLoading, setSaveViewLoading] = useState(false);

  // Sync filters from URL params (on mount and when location changes)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQuery = params.get("query") || "";
    const urlHasCoordinates = params.get("hasCoordinates");
    const urlHasPhone = params.get("hasPhone");
    const urlHasLink = params.get("hasLink");
    const urlCity = params.get("city") || "";
    const urlStateFilterStr = params.get("stateFilter");
    const urlStateFilter = urlStateFilterStr ? JSON.parse(urlStateFilterStr) : [];
    
    setQueryValue(urlQuery);
    setHasCoordinates(urlHasCoordinates ? [urlHasCoordinates] : undefined);
    setHasPhone(urlHasPhone ? [urlHasPhone] : undefined);
    setHasLink(urlHasLink ? [urlHasLink] : undefined);
    setTaggedWith(urlCity);
    setStateFilter(urlStateFilter);
  }, [location.search]); // Sync when URL search params change

  // 1. Mount check
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle action data response
  useEffect(() => {
    if (actionData?.success) {
      // Close save view modal and show success toast
      if (actionData.action === "save_view") {
        shopify.modal.hide("save-view-modal");
        setSaveViewLoading(false);
        shopify.toast.show("Search saved successfully");
        // Revalidate to show the new view in tabs
        revalidator.revalidate();
      } else if (actionData.action === "update_view") {
        setSaveViewLoading(false);
        shopify.toast.show("View updated successfully");
        // Revalidate to reflect the updated filters
        revalidator.revalidate();
      } else {
        // For other actions (bulk delete, delete view), show message if available and revalidate
        if (actionData.message) {
          shopify.toast.show(actionData.message);
        }
        // Reset delete loading state for bulk delete
        if (actionData.deletedCount !== undefined) {
          setDeleteLoading(false);
        }
        revalidator.revalidate();
      }
    } else if (actionData?.error) {
      console.error("Action failed:", actionData.error);
      setSaveViewLoading(false);
      setDeleteLoading(false); // Reset delete loading on error too
      shopify.toast.show(actionData.error, { isError: true });
    }
  }, [actionData, shopify, revalidator]);

  // Use stores directly from loader (already filtered and paginated)
  const paginatedStores = stores;

  // Build tabs from saved views
  const tabs = useMemo(() => {
    // Always start with "All" view
    const allTab = {
      content: "All",
      index: 0,
      onAction: () => {},
      id: "all-0",
      isLocked: true,
      filters: {},
    };

    const viewTabs = savedViews.map((view, index) => {
      const viewIndex = index + 1; // +1 because "All" is at index 0
      const parsedFilters = JSON.parse(view.filters);
      
      return {
        content: view.name,
        index: viewIndex,
        onAction: () => {},
        id: `${view.id}-${viewIndex}`,
        isLocked: view.isDefault, // Lock default views (Missing Coordinates, Missing Phone)
        viewId: view.id,
        filters: parsedFilters,
        actions: view.isDefault
          ? [] // No actions for default views
          : [
              {
                type: "delete",
                onAction: () => {},
                onPrimaryAction: async () => {
                  // Delete view via action
                  const formData = new FormData();
                  formData.append("action", "delete_view");
                  formData.append("viewId", view.id);
                  submit(formData, { method: "post" });
                  return true;
                },
              },
            ],
      };
    });

    return [allTab, ...viewTabs];
  }, [savedViews, submit]);

  const [selected, setSelected] = useState(0);

  // Handle tab selection and apply filters
  const handleTabChange = useCallback((selectedIndex) => {
    setSelected(selectedIndex);
    const selectedTab = tabs[selectedIndex];
    
    if (selectedTab && selectedTab.filters) {
      const filters = selectedTab.filters;
      
      // Apply filters from saved view
      if (filters.query !== undefined) setQueryValue(filters.query || "");
      if (filters.stateFilter !== undefined) setStateFilter(filters.stateFilter || []);
      if (filters.hasCoordinates !== undefined) setHasCoordinates(filters.hasCoordinates);
      if (filters.hasPhone !== undefined) setHasPhone(filters.hasPhone);
      if (filters.hasLink !== undefined) setHasLink(filters.hasLink);
      if (filters.taggedWith !== undefined) setTaggedWith(filters.taggedWith || "");
      
      // Navigate with filters as URL parameters and reset to page 1
      const params = new URLSearchParams();
      params.set("page", "1"); // Always reset to page 1
      
      // Add filters to URL so server can apply them
      if (filters.query) params.set("query", filters.query);
      if (filters.hasCoordinates && filters.hasCoordinates.length > 0) {
        params.set("hasCoordinates", filters.hasCoordinates[0]); // "has" or "none"
      }
      if (filters.hasPhone && filters.hasPhone.length > 0) {
        params.set("hasPhone", filters.hasPhone[0]); // "has" or "none"
      }
      if (filters.hasLink && filters.hasLink.length > 0) {
        params.set("hasLink", filters.hasLink[0]); // "has" or "none"
      }
      if (filters.taggedWith) params.set("city", filters.taggedWith);
      if (filters.stateFilter && filters.stateFilter.length > 0) {
        params.set("stateFilter", JSON.stringify(filters.stateFilter));
      }
      
      navigate(`/app/view-stores?${params.toString()}`);
    } else {
      // "All" view - clear all filters and reset to page 1
      setQueryValue("");
      setStateFilter([]);
      setHasCoordinates(undefined);
      setHasPhone(undefined);
      setHasLink(undefined);
      setTaggedWith("");
      
      // Navigate to page 1 explicitly
      navigate("/app/view-stores?page=1");
    }
  }, [tabs, navigate]);

  const onCreateNewView = async () => {
    // Show save modal when creating new view
    shopify.modal.show("save-view-modal");
    return false; // Return false to prevent default behavior
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
  const onHandleCancel = () => {
    // Clear the search query when cancel is clicked
    handleQueryValueRemove();
  };

  // Handle saving a new view
  const handleSaveView = (viewName) => {
    setSaveViewLoading(true);
    
    // Capture current filter state
    const filters = JSON.stringify({
      query: queryValue,
      stateFilter,
      hasCoordinates,
      hasPhone,
      hasLink,
      taggedWith,
    });
    
    // Submit save_view action
    const formData = new FormData();
    formData.append("action", "save_view");
    formData.append("viewName", viewName);
    formData.append("filters", filters);
    submit(formData, { method: "post" });
  };

  // Disable primaryAction to avoid IndexFilters' built-in modal
  const primaryAction = undefined;

  // Export functions - server-side export for all filtered data
  // Use fetch with credentials to get CSV, then trigger download via blob
  const handleExportAll = useCallback(async () => {
    try {
      const response = await fetch("/app/export-stores?scope=all", {
        method: "GET",
        credentials: "include", // Include cookies for authentication
      });
      
      if (!response.ok) {
        // If we get redirected (302), it means authentication failed
        if (response.redirected || response.status === 302) {
          shopify.toast.show("Authentication failed. Please refresh the page.", { isError: true });
          return;
        }
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }
      
      // Get the CSV content
      const blob = await response.blob();
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : "all-stores.csv";
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      shopify.toast.show(`Failed to export: ${error.message}`, { isError: true });
    }
  }, [shopify]);

  const handleExportCurrent = useCallback(async () => {
    // Export only the current page
    const params = new URLSearchParams(location.search);
    
    // Build export URL with all filter params and pagination
    const exportParams = new URLSearchParams();
    exportParams.set("scope", "current");
    
    const query = params.get("query");
    const hasCoordinates = params.get("hasCoordinates");
    const hasPhone = params.get("hasPhone");
    const hasLink = params.get("hasLink");
    const city = params.get("city");
    const stateFilterStr = params.get("stateFilter");
    const page = params.get("page") || "1";
    const limit = pagination.limit.toString();
    
    if (query) exportParams.set("query", query);
    if (hasCoordinates) exportParams.set("hasCoordinates", hasCoordinates);
    if (hasPhone) exportParams.set("hasPhone", hasPhone);
    if (hasLink) exportParams.set("hasLink", hasLink);
    if (city) exportParams.set("city", city);
    if (stateFilterStr) exportParams.set("stateFilter", stateFilterStr);
    exportParams.set("page", page);
    exportParams.set("limit", limit);
    
    try {
      const response = await fetch(`/app/export-stores?${exportParams.toString()}`, {
        method: "GET",
        credentials: "include", // Include cookies for authentication
      });
      
      if (!response.ok) {
        // If we get redirected (302), it means authentication failed
        if (response.redirected || response.status === 302) {
          shopify.toast.show("Authentication failed. Please refresh the page.", { isError: true });
          return;
        }
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }
      
      // Get the CSV content
      const blob = await response.blob();
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : "current-page-stores.csv";
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      shopify.toast.show(`Failed to export: ${error.message}`, { isError: true });
    }
  }, [location.search, pagination.limit, shopify]);

  const handleExportFiltered = useCallback(async () => {
    // Export filtered stores using current filters from URL
    const params = new URLSearchParams(location.search);
    
    // Build export URL with all filter params
    const exportParams = new URLSearchParams();
    exportParams.set("scope", "filtered");
    
    const query = params.get("query");
    const hasCoordinates = params.get("hasCoordinates");
    const hasPhone = params.get("hasPhone");
    const hasLink = params.get("hasLink");
    const city = params.get("city");
    const stateFilterStr = params.get("stateFilter");
    
    if (query) exportParams.set("query", query);
    if (hasCoordinates) exportParams.set("hasCoordinates", hasCoordinates);
    if (hasPhone) exportParams.set("hasPhone", hasPhone);
    if (hasLink) exportParams.set("hasLink", hasLink);
    if (city) exportParams.set("city", city);
    if (stateFilterStr) exportParams.set("stateFilter", stateFilterStr);
    
    try {
      const response = await fetch(`/app/export-stores?${exportParams.toString()}`, {
        method: "GET",
        credentials: "include", // Include cookies for authentication
      });
      
      if (!response.ok) {
        // If we get redirected (302), it means authentication failed
        if (response.redirected || response.status === 302) {
          shopify.toast.show("Authentication failed. Please refresh the page.", { isError: true });
          return;
        }
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }
      
      // Get the CSV content
      const blob = await response.blob();
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : "filtered-stores.csv";
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      shopify.toast.show(`Failed to export: ${error.message}`, { isError: true });
    }
  }, [location.search, shopify]);

  const onImport = useCallback((parsedStores) => {
    // The component already handles the import fetch
    // This callback is just to refresh the data and close the modal
    shopify.modal.hide("import-csv-modal");
    revalidator.revalidate();
  }, [shopify, revalidator]);

  const handleExportModalClose = () => {
    shopify.modal.hide("export-modal");
  };


  const handleHasCoordinatesChange = useCallback(
    (value) => {
      setHasCoordinates(value);
      const params = new URLSearchParams(window.location.search);
      params.set("page", "1"); // Reset to page 1
      
      if (value && value.length > 0) {
        params.set("hasCoordinates", value[0]);
      } else {
        params.delete("hasCoordinates");
      }
      
      navigate(`/app/view-stores?${params.toString()}`);
    },
    [navigate],
  );
  
  const handleHasPhoneChange = useCallback(
    (value) => {
      setHasPhone(value);
      const params = new URLSearchParams(window.location.search);
      params.set("page", "1"); // Reset to page 1
      
      if (value && value.length > 0) {
        params.set("hasPhone", value[0]);
      } else {
        params.delete("hasPhone");
      }
      
      navigate(`/app/view-stores?${params.toString()}`);
    },
    [navigate],
  );
  
  const handleHasLinkChange = useCallback(
    (value) => {
      setHasLink(value);
      const params = new URLSearchParams(window.location.search);
      params.set("page", "1"); // Reset to page 1
      
      if (value && value.length > 0) {
        params.set("hasLink", value[0]);
      } else {
        params.delete("hasLink");
      }
      
      navigate(`/app/view-stores?${params.toString()}`);
    },
    [navigate],
  );
  const handleTaggedWithChange = useCallback(
    (value) => {
      setTaggedWith(value);
      const params = new URLSearchParams(window.location.search);
      params.set("page", "1"); // Reset to page 1
      
      if (value && value.trim()) {
        params.set("city", value);
      } else {
        params.delete("city");
      }
      
      navigate(`/app/view-stores?${params.toString()}`);
    },
    [navigate],
  );
  const handleStateFilterChange = useCallback(
    (value) => {
      setStateFilter(value);
      const params = new URLSearchParams(window.location.search);
      params.set("page", "1"); // Reset to page 1
      
      if (value && value.length > 0) {
        params.set("stateFilter", JSON.stringify(value));
      } else {
        params.delete("stateFilter");
      }
      
      navigate(`/app/view-stores?${params.toString()}`);
    },
    [navigate],
  );
  const handleFiltersQueryChange = useCallback(
    (value) => {
      setQueryValue(value);
      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      // Debounce navigation to avoid too many requests while typing
      searchTimeoutRef.current = setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        if (value.trim()) {
          params.set("query", value);
        } else {
          params.delete("query");
        }
        params.set("page", "1"); // Reset to first page when searching
        navigate(`/app/view-stores?${params.toString()}`);
      }, 200); // 200ms debounce
    },
    [navigate],
  );
  const handleHasCoordinatesRemove = useCallback(() => {
    setHasCoordinates(undefined);
    const params = new URLSearchParams(window.location.search);
    params.delete("hasCoordinates");
    params.set("page", "1");
    navigate(`/app/view-stores?${params.toString()}`);
  }, [navigate]);
  
  const handleHasPhoneRemove = useCallback(() => {
    setHasPhone(undefined);
    const params = new URLSearchParams(window.location.search);
    params.delete("hasPhone");
    params.set("page", "1");
    navigate(`/app/view-stores?${params.toString()}`);
  }, [navigate]);
  
  const handleHasLinkRemove = useCallback(() => {
    setHasLink(undefined);
    const params = new URLSearchParams(window.location.search);
    params.delete("hasLink");
    params.set("page", "1");
    navigate(`/app/view-stores?${params.toString()}`);
  }, [navigate]);
  const handleTaggedWithRemove = useCallback(() => {
    setTaggedWith("");
    const params = new URLSearchParams(window.location.search);
    params.delete("city");
    params.set("page", "1");
    navigate(`/app/view-stores?${params.toString()}`);
  }, [navigate]);
  const handleStateFilterRemove = useCallback(() => {
    setStateFilter([]);
    const params = new URLSearchParams(window.location.search);
    params.delete("stateFilter");
    params.set("page", "1");
    navigate(`/app/view-stores?${params.toString()}`);
  }, [navigate]);
  const handleQueryValueRemove = useCallback(() => {
    // Clear any pending debounced navigation
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    setQueryValue("");
    const params = new URLSearchParams(window.location.search);
    params.delete("query");
    params.set("page", "1"); // Reset to first page when clearing search
    navigate(`/app/view-stores?${params.toString()}`);
  }, [navigate]);
  const handleFiltersClearAll = useCallback(() => {
    handleHasCoordinatesRemove();
    handleHasPhoneRemove();
    handleHasLinkRemove();
    handleQueryValueRemove();
    handleTaggedWithRemove();
    handleStateFilterRemove();
  }, [
    handleHasCoordinatesRemove,
    handleHasPhoneRemove,
    handleHasLinkRemove,
    handleQueryValueRemove,
    handleTaggedWithRemove,
    handleStateFilterRemove,
  ]);

  const filters = [
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

  const { selectedResources, allResourcesSelected, handleSelectionChange, clearSelection } =
    useIndexResourceState(paginatedStores);

  // Clear selection after bulk delete
  useEffect(() => {
    if (actionData?.success && actionData?.deletedCount !== undefined && selectedResources.length > 0) {
      // Clear selection after successful bulk delete
      clearSelection();
    }
  }, [actionData?.success, actionData?.deletedCount, selectedResources.length, clearSelection]);

  // Clear selection when stores change (e.g., when navigating pages)
  useEffect(() => {
    // This will clear the selection when the stores array changes
    // The useIndexResourceState hook will handle the clearing automatically
  }, [paginatedStores]);

  // Export selected stores - moved here after selectedResources is declared
  const handleExportSelected = useCallback(async () => {
    if (selectedResources.length === 0) {
      shopify.toast.show("No stores selected", { isError: true });
      return;
    }
    
    // Build export URL with selected store IDs
    const exportParams = new URLSearchParams();
    exportParams.set("scope", "selected");
    selectedResources.forEach((storeId) => {
      exportParams.append("storeIds", storeId);
    });
    
    try {
      const response = await fetch(`/app/export-stores?${exportParams.toString()}`, {
        method: "GET",
        credentials: "include", // Include cookies for authentication
      });
      
      if (!response.ok) {
        // If we get redirected (302), it means authentication failed
        if (response.redirected || response.status === 302) {
          shopify.toast.show("Authentication failed. Please refresh the page.", { isError: true });
          return;
        }
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }
      
      // Get the CSV content
      const blob = await response.blob();
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `selected-stores-${selectedResources.length}.csv`;
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      shopify.toast.show(`Failed to export: ${error.message}`, { isError: true });
    }
  }, [selectedResources, shopify]);

  // Export modal handler - moved here after all export handlers are defined
  const handleExportFromModal = useCallback(({ exportScope }) => {
    shopify.modal.hide("export-modal");
    
    if (exportScope === "all") {
      handleExportAll();
    } else if (exportScope === "filtered") {
      handleExportFiltered();
    } else if (exportScope === "current") {
      handleExportCurrent();
    } else if (exportScope === "selected") {
      handleExportSelected();
    }
  }, [handleExportAll, handleExportFiltered, handleExportCurrent, handleExportSelected, shopify]);

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
    <>
      {/* Save View Modal */}
      <SaveViewModal
        onClose={() => {
          shopify.modal.hide("save-view-modal");
          setSaveViewLoading(false);
        }}
        onSave={handleSaveView}
        loading={saveViewLoading}
      />

      <Page
        title="Stores"
      primaryAction={{
        content: "Add a store",
        onAction: () => navigate("/app/add-store"),
      }}
      secondaryActions={[
        {
          icon: SaveIcon,
          content: "Save View",
          accessibilityLabel: "Save current filters as a view",
          onAction: () => {
            shopify.modal.show("save-view-modal");
          },
        },
        {
          icon: GlobeIcon,
          content: "Distribution Map",
          accessibilityLabel: "View store distribution map",
          loading: navigatingToMap,
          onAction: () => {
            setNavigatingToMap(true);
            navigate("/app/choropleth");
          },
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
          onQueryClear={handleQueryValueRemove}
          onSort={setSortSelected}
          primaryAction={primaryAction}
          cancelAction={{
            onAction: onHandleCancel,
            disabled: false,
            loading: false,
          }}
          tabs={tabs}
          selected={selected}
          onSelect={handleTabChange}
          canCreateNewView
          onCreateNewView={onCreateNewView}
          filters={filters}
          appliedFilters={appliedFilters}
          onClearAll={handleFiltersClearAll}
          mode={mode}
          setMode={setMode}
        />
        
        {/* Loading overlay */}
        {isNavigating && (
          <div style={{
            position: 'relative',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Spinner accessibilityLabel="Loading stores..." size="large" />
          </div>
        )}
        
        {/* Show table only when not loading */}
        {!isNavigating && (
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
        )}
        <Divider />
        <div style={{ paddingTop: "10px" }}>
          <Pagination
            onPrevious={() => {
              const params = new URLSearchParams(window.location.search);
              const currentPage = parseInt(params.get("page") || "1");
              params.set("page", (currentPage - 1).toString());
              // Preserve query parameter if it exists
              navigate(`/app/view-stores?${params.toString()}`);
            }}
            onNext={() => {
              const params = new URLSearchParams(window.location.search);
              const currentPage = parseInt(params.get("page") || "1");
              params.set("page", (currentPage + 1).toString());
              // Preserve query parameter if it exists
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
        onExport={handleExportFromModal}
        exportCounts={{
          current: paginatedStores.length,
          all: pagination.totalAllStores,
          selected: selectedResources.length,
          filtered: pagination.totalCount,
        }}
        selectedCount={selectedResources.length}
        filteredCount={pagination.totalCount}
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
    </>
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
