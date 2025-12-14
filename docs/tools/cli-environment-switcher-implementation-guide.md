# Enhanced CLI Environment Switcher

This document describes the enhanced environment switcher CLI built with Commander.js, providing a more professional and feature-rich command-line interface.

## Overview

The enhanced CLI (`scripts/switch-env-enhanced.js`) provides the same functionality as the basic version but with additional features:

- **Professional CLI structure** with subcommands
- **Auto-generated help** and usage information
- **Additional commands** for setup and system information
- **Better error handling** and user feedback
- **Version management** and debugging options

## Installation

The enhanced CLI requires the `commander` package:

```bash
npm install commander
```

## Usage

### Basic Commands

```bash
# Switch to development environment
npm run env:enhanced dev
# or
node scripts/switch-env-enhanced.js dev

# Switch to production environment
npm run env:enhanced prod
# or
node scripts/switch-env-enhanced.js prod

# Show current status
npm run env:enhanced status
# or
node scripts/switch-env-enhanced.js status

# Validate environment setup
npm run env:enhanced validate
# or
node scripts/switch-env-enhanced.js validate
```

### Advanced Commands

```bash
# Set up Shopify configurations
npm run env:enhanced setup
# or
node scripts/switch-env-enhanced.js setup

# Set up specific environment
npm run env:enhanced setup dev
npm run env:enhanced setup prod
npm run env:enhanced setup both

# Show system information
npm run env:enhanced info
# or
node scripts/switch-env-enhanced.js info
```

### Help and Options

```bash
# Show main help
node scripts/switch-env-enhanced.js --help

# Show command-specific help
node scripts/switch-env-enhanced.js dev --help
node scripts/switch-env-enhanced.js setup --help

# Enable debug output
node scripts/switch-env-enhanced.js --debug dev

# Show version
node scripts/switch-env-enhanced.js --version
```

## Command Reference

### `dev` / `development`
Switches to development environment.

**Aliases**: `dev`, `development`

**What it does**:
- Updates `ENVIRONMENT=development` in `env` file
- Switches to Shopify development configuration
- Validates environment setup
- Shows next steps

**Example**:
```bash
node scripts/switch-env-enhanced.js dev
```

### `prod` / `production`
Switches to production environment.

**Aliases**: `prod`, `production`

**What it does**:
- Updates `ENVIRONMENT=production` in `env` file
- Switches to Shopify production configuration
- Validates environment setup
- Shows next steps

**Example**:
```bash
node scripts/switch-env-enhanced.js prod
```

### `status`
Shows current environment status.

**What it shows**:
- Current environment setting
- Shopify app configuration status
- Database URL configuration status
- File existence checks

**Example**:
```bash
node scripts/switch-env-enhanced.js status
```

### `validate`
Validates environment setup.

**What it checks**:
- Required files exist (`env`, `shopify.app.toml`)
- Database URLs are configured
- Environment variables are properly set

**Example**:
```bash
node scripts/switch-env-enhanced.js validate
```

### `setup [environment]`
Sets up Shopify configurations.

**Arguments**:
- `environment` (optional): `dev`, `prod`, or `both` (default: `both`)

**What it does**:
- Creates Shopify app configurations for specified environments
- Checks if configurations already exist
- Provides feedback on setup progress

**Examples**:
```bash
# Set up both environments
node scripts/switch-env-enhanced.js setup

# Set up development only
node scripts/switch-env-enhanced.js setup dev

# Set up production only
node scripts/switch-env-enhanced.js setup prod
```

### `info`
Shows system information and requirements.

**What it shows**:
- Node.js version
- Platform information
- Shopify CLI version
- Required file status

**Example**:
```bash
node scripts/switch-env-enhanced.js info
```

## Global Options

### `--version`, `-V`
Output the version number.

### `--debug`, `-d`
Enable debug output for troubleshooting.

### `--help`, `-h`
Display help information.

## NPM Scripts

The enhanced CLI is integrated into the npm scripts:

```json
{
  "env:enhanced": "node scripts/switch-env-enhanced.js",
  "env:setup": "node scripts/switch-env-enhanced.js setup",
  "env:info": "node scripts/switch-env-enhanced.js info"
}
```

## Features

### Professional CLI Structure
- **Subcommands**: Organized command structure
- **Aliases**: Multiple ways to call the same command
- **Help system**: Auto-generated help for all commands
- **Version management**: Built-in version tracking

### Enhanced Error Handling
- **Graceful failures**: Better error messages and recovery
- **Validation**: Comprehensive input validation
- **Debug mode**: Detailed output for troubleshooting

### Additional Functionality
- **Setup automation**: Easy Shopify configuration setup
- **System information**: Quick system status check
- **Cross-platform**: Works on Windows, macOS, and Linux

### User Experience
- **Colored output**: Better visual feedback
- **Progress indicators**: Clear status updates
- **Next steps**: Helpful guidance after commands

## Comparison with Basic Version

| Feature | Basic Version | Enhanced Version |
|---------|---------------|------------------|
| Command structure | Positional arguments | Subcommands |
| Help system | Manual | Auto-generated |
| Error handling | Basic | Comprehensive |
| Additional commands | No | Yes (setup, info) |
| Debug mode | No | Yes |
| Version management | No | Yes |
| Aliases | No | Yes |

## Migration from Basic Version

The enhanced version is **backward compatible** with the basic version:

```bash
# Old way (still works)
node scripts/switch-env.js development

# New way (recommended)
node scripts/switch-env-enhanced.js dev
```

## Troubleshooting

### Debug Mode
Enable debug output to see detailed information:

```bash
node scripts/switch-env-enhanced.js --debug dev
```

### Command Not Found
If you get "command not found" errors:

1. Make sure the script is executable:
   ```bash
   chmod +x scripts/switch-env-enhanced.js
   ```

2. Check Node.js installation:
   ```bash
   node --version
   ```

3. Verify commander package is installed:
   ```bash
   npm list commander
   ```

### Permission Errors
If you get permission errors on Windows:

1. Use npm scripts instead:
   ```bash
   npm run env:enhanced dev
   ```

2. Or run with Node.js directly:
   ```bash
   node scripts/switch-env-enhanced.js dev
   ```

## Future Enhancements

### Planned Features
- [ ] Interactive mode for guided setup
- [ ] Configuration file support
- [ ] Backup/restore functionality
- [ ] Integration with CI/CD pipelines
- [ ] Plugin system for custom commands

### Contributing
The enhanced CLI is designed to be extensible. To add new commands:

1. Add the command definition in the main CLI setup
2. Implement the command function
3. Add appropriate help text
4. Test on all platforms

## Conclusion

The enhanced CLI provides a more professional and feature-rich experience while maintaining compatibility with the basic version. It's recommended for teams that want better user experience and additional functionality. 