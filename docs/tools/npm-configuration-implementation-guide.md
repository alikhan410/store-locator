# NPM Configuration Updates

This document explains the npm configuration changes made to resolve deprecation warnings.

## Deprecated Configuration Options

The following npm configuration options were deprecated and have been updated:

### ❌ Deprecated Options (Removed)
- `auto-install-peers=true` - Deprecated in favor of `install-peer-deps=true`
- `shamefully-hoist=true` - Deprecated, replaced with `legacy-peer-deps=true`
- `enable-pre-post-scripts=true` - Deprecated, no longer needed in modern npm

### ✅ Modern Equivalents (Added)
- `legacy-peer-deps=true` - Uses legacy peer dependency resolution (similar to shamefully-hoist)

## Configuration Changes

### Before (`.npmrc`)
```ini
engine-strict=true
auto-install-peers=true
shamefully-hoist=true
enable-pre-post-scripts=true
```

### After (`.npmrc`)
```ini
engine-strict=true
legacy-peer-deps=true
```

## What Each Option Does

### `engine-strict=true`
- Enforces Node.js version requirements from package.json
- Ensures consistent Node.js versions across environments



### `legacy-peer-deps=true`
- Uses legacy peer dependency resolution algorithm
- Similar behavior to the deprecated `shamefully-hoist=true`
- Helps resolve dependency conflicts in complex dependency trees

## Benefits of These Changes

1. **Future-Proof**: Uses modern npm configuration options
2. **No Warnings**: Eliminates deprecation warnings
3. **Better Compatibility**: Improved peer dependency handling
4. **Consistent Behavior**: Maintains the same functionality with modern syntax

## Migration Notes

- **No Breaking Changes**: The functionality remains the same
- **Automatic**: npm will automatically use the new configuration
- **Backward Compatible**: Works with existing package-lock.json files

## Verification

After making these changes, run:

```bash
npm install
```

You should no longer see the deprecation warnings:
- ❌ `npm warn Unknown project config "auto-install-peers"`
- ❌ `npm warn Unknown project config "shamefully-hoist"`
- ❌ `npm warn Unknown project config "enable-pre-post-scripts"`
- ❌ `npm warn Unknown project config "install-peer-deps"`

## Related Documentation

- [NPM Configuration Documentation](https://docs.npmjs.com/cli/v9/using-npm/config)
- [Peer Dependencies Guide](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#peerdependencies)
- [Engine Strict Mode](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#engines)

---

*Last updated: December 2024* 