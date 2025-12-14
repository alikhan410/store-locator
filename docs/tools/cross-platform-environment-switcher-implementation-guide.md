# Cross-Platform Environment Switcher

This document describes the cross-platform environment switching solution for the Store Locator app, which works on Windows, macOS, and Linux.

## Overview

The environment switcher allows developers to easily switch between development and production environments for the Shopify app, updating all necessary configuration files and Shopify app configurations.

## Files

- `scripts/switch-env.js` - Main cross-platform Node.js script (works on all platforms)
- `scripts/switch-env.cmd` - Windows batch file launcher
- `scripts/switch-env` - Unix/macOS launcher script
- `scripts/switch-env.sh` - Original bash script (legacy, kept for reference)

## Usage

### Using npm scripts (Recommended)

```bash
# Switch to development environment
npm run env:dev

# Switch to production environment
npm run env:prod

# Show current status
npm run env:status

# Validate environment setup
npm run env:validate
```

### Using Node.js directly

```bash
# Switch to development environment
node scripts/switch-env.js development

# Switch to production environment
node scripts/switch-env.js production

# Show current status
node scripts/switch-env.js status

# Validate environment setup
node scripts/switch-env.js validate
```

### Windows-specific commands

```cmd
# Using the Windows batch file
scripts\switch-env.cmd development
scripts\switch-env.cmd production
scripts\switch-env.cmd status
scripts\switch-env.cmd validate

# Or using npm scripts with Windows paths
npm run env:win:dev
npm run env:win:prod
npm run env:win:status
npm run env:win:validate
```

### Unix/macOS commands

```bash
# Using the Unix launcher script
./scripts/switch-env development
./scripts/switch-env production
./scripts/switch-env status
./scripts/switch-env validate
```

## Features

### Cross-Platform Compatibility
- Works on Windows, macOS, and Linux
- Uses Node.js for consistent behavior across platforms
- Handles platform-specific command detection (`which` vs `where`)

### Environment Management
- Updates `ENVIRONMENT` variable in `env` file
- Switches Shopify app configurations
- Validates environment setup
- Shows detailed status information

### Error Handling
- Checks for required dependencies (Node.js, Shopify CLI)
- Provides clear error messages
- Graceful fallbacks for missing configurations

### User Experience
- Colored output for better readability
- Clear next steps after environment switching
- Helpful validation messages

## Requirements

- Node.js (version 18.20 or higher)
- Shopify CLI installed globally
- Valid `env` file with database URLs configured
- Valid `shopify.app.toml` configuration

## Migration from Bash Script

If you were previously using the bash script (`switch-env.sh`), the new Node.js version provides the same functionality with better cross-platform support:

1. **Same commands**: All existing commands work the same way
2. **Same output**: Colored output and status information
3. **Same functionality**: Environment switching, validation, and status checking
4. **Better compatibility**: Works on Windows without WSL or Git Bash

## Troubleshooting

### Node.js not found
```
[ERROR] Node.js is not installed or not in PATH
Please install Node.js from https://nodejs.org/
```

**Solution**: Install Node.js from the official website or use a package manager.

### Shopify CLI not found
```
[ERROR] Shopify CLI is not installed. Please install it first:
  npm install -g @shopify/cli @shopify/theme
```

**Solution**: Install the Shopify CLI globally using npm.

### Missing environment file
```
[ERROR] env file is missing
```

**Solution**: Ensure you have an `env` file in the project root with the required environment variables.

### Missing Shopify configuration
```
[WARNING] No Shopify development configuration found
```

**Solution**: Create the required Shopify app configuration:
```bash
shopify app config link --config=development
shopify app config link --config=production
```

## Development

The Node.js script is designed to be maintainable and extensible:

- **Modular functions**: Each operation is in its own function
- **Error handling**: Comprehensive error handling throughout
- **Platform detection**: Automatic detection of platform-specific commands
- **Clear output**: Consistent colored output formatting

To extend the script, add new functions and update the main switch statement in the `main()` function. 