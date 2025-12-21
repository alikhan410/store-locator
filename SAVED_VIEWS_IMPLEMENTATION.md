# Saved Views Implementation Plan

## Progress So Far

### 1. Database Schema ✅
- Created `SavedView` model in `prisma/schema.prisma`
- Fields: `id`, `shop`, `name`, `filters` (JSON), `isDefault`, timestamps
- Unique constraint on `[shop, name]` to prevent duplicates
- Index on `shop` for performance

### 2. Modal Component ✅
- Created `SaveViewModal` in `app/components/modals.jsx`
- Uses TextField for view name input
- Follows same pattern as existing modals

### 3. Loader Updates ✅
- Added `savedViews` to loader return
- Auto-creates default views: "Missing Coordinates" and "Missing Phone"
- Uses `upsert` to ensure defaults exist for each shop

### 4. Action Handlers ✅
- `save_view`: Creates new saved view in database
- `delete_view`: Deletes saved view (with shop validation)
- Error handling for duplicate names

## Remaining Work

### 5. Component Updates (TODO)

**Replace hardcoded tabs logic:**
```javascript
// Remove:
const [itemStrings, setItemStrings] = useState(["All", "Colorado", "Phone Missing"]);
const deleteView = (index) => {...}
const duplicateView = async (name) => {...}

// Add:
const tabs = useMemo(() => {
  const allTab = { content: "All", index: 0, isLocked: true, filters: {} };
  const viewTabs = savedViews.map((view, index) => ({
    content: view.name,
    index: index + 1,
    id: view.id,
    isLocked: view.isDefault,
    filters: JSON.parse(view.filters),
    actions: view.isDefault ? [] : [
      { type: "delete", onPrimaryAction: async () => {
        // Submit delete_view action
      }}
    ]
  }));
  return [allTab, ...viewTabs];
}, [savedViews]);
```

**Update onHandleSave:**
```javascript
const onHandleSave = async () => {
  setShowSaveViewModal(true);
  return false; // Prevent default
};

const handleSaveView = (viewName) => {
  setSaveViewLoading(true);
  const filters = JSON.stringify({
    query: queryValue,
    stateFilter,
    hasCoordinates,
    hasPhone,
    hasLink,
    taggedWith,
  });
  
  const formData = new FormData();
  formData.append("action", "save_view");
  formData.append("viewName", viewName);
  formData.append("filters", filters);
  submit(formData, { method: "post" });
};
```

**Handle view selection:**
```javascript
const [selected, setSelected] = useState(0);

const handleTabChange = useCallback((selectedIndex) => {
  setSelected(selectedIndex);
  const selectedTab = tabs[selectedIndex];
  
  if (selectedTab && selectedTab.filters) {
    const filters = selectedTab.filters;
    
    // Apply filters from saved view
    setQueryValue(filters.query || "");
    setStateFilter(filters.stateFilter || []);
    setHasCoordinates(filters.hasCoordinates);
    setHasPhone(filters.hasPhone);
    setHasLink(filters.hasLink);
    setTaggedWith(filters.taggedWith || "");
    
    // Navigate with filters
    const params = new URLSearchParams();
    if (filters.query) params.set("query", filters.query);
    params.set("page", "1");
    navigate(`/app/view-stores?${params.toString()}`);
  }
}, [tabs, navigate]);
```

**Add modal to JSX:**
```jsx
{showSaveViewModal && (
  <SaveViewModal
    onClose={() => {
      setShowSaveViewModal(false);
      setSaveViewLoading(false);
    }}
    onSave={handleSaveView}
    loading={saveViewLoading}
  />
)}
```

### 6. Migration (TODO)
```bash
npx prisma migrate dev --name add_saved_views
```

### 7. Test Cases
- [ ] Create new saved view with filters
- [ ] Switch between views and filters apply correctly
- [ ] Delete custom view (defaults can't be deleted)
- [ ] Duplicate view name shows error
- [ ] Team members see same saved views
- [ ] Views persist across devices/sessions

## Benefits
- ✅ Database-backed (persists across devices)
- ✅ Team collaboration (all see same views)
- ✅ Pre-populated useful views
- ✅ User-friendly modal for naming
- ✅ GDPR compliant (shop-scoped)

