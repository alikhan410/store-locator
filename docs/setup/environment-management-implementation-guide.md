# Environment Management System

This document explains how to use the environment management system for the Store Locator Shopify app, which allows you to easily switch between development and production environments.

## Overview

The environment management system consists of:

1. **Cross-Platform Environment Switching Script** (`scripts/switch-env.js`) - Switches between dev/prod environments (works on Windows, macOS, Linux)
2. **Platform-Specific Launchers** - `scripts/switch-env.cmd` (Windows) and `scripts/switch-env` (Unix/macOS)
3. **Shopify Configuration Setup** (`scripts/setup-shopify-configs.sh`) - Sets up Shopify app configurations
4. **Database Configuration** (`app/config/database.js`) - Handles environment-specific database URLs
5. **NPM Scripts** - Convenient commands for environment management

> **Note**: The original `scripts/switch-env.sh` script is kept for reference but the new cross-platform Node.js version is recommended for all platforms.

## Quick Start

### 1. Check Current Environment Status
```bash
npm run env:status
```

### 2. Switch to Development Environment
```bash
npm run env:dev
```

### 3. Switch to Production Environment
```bash
npm run env:prod
```

### 4. Validate Environment Setup
```bash
npm run env:validate
```

## Detailed Usage

### Environment Switching Script

The main cross-platform script (`scripts/switch-env.js`) provides the following commands:

#### Switch to Development
```bash
# Using npm scripts (recommended)
npm run env:dev

# Using Node.js directly
node scripts/switch-env.js development
# or
node scripts/switch-env.js dev

# Using platform-specific launchers
./scripts/switch-env development  # Unix/macOS
scripts\switch-env.cmd development  # Windows
```

**What it does:**
- Updates `ENVIRONMENT=development` in your `env` file
- Switches to Shopify development configuration (if available)
- Validates the environment setup

#### Switch to Production
```bash
# Using npm scripts (recommended)
npm run env:prod

# Using Node.js directly
node scripts/switch-env.js production
# or
node scripts/switch-env.js prod

# Using platform-specific launchers
./scripts/switch-env production  # Unix/macOS
scripts\switch-env.cmd production  # Windows
```

**What it does:**
- Updates `ENVIRONMENT=production` in your `env` file
- Switches to Shopify production configuration (if available)
- Validates the environment setup

#### Check Status
```bash
# Using npm scripts (recommended)
npm run env:status

# Using Node.js directly
node scripts/switch-env.js status

# Using platform-specific launchers
./scripts/switch-env status  # Unix/macOS
scripts\switch-env.cmd status  # Windows
```

**What it shows:**
- Current environment setting
- Shopify app configuration status
- Database URL configuration status

#### Validate Setup
```bash
# Using npm scripts (recommended)
npm run env:validate

# Using Node.js directly
node scripts/switch-env.js validate

# Using platform-specific launchers
./scripts/switch-env validate  # Unix/macOS
scripts\switch-env.cmd validate  # Windows
```

**What it checks:**
- Required files exist (`env`, `shopify.app.toml`)
- Database URLs are configured
- Environment variables are properly set

### Shopify Configuration Setup

The setup script (`scripts/setup-shopify-configs.sh`) helps you create Shopify app configurations for different environments:

#### Set up Development Configuration
```bash
./scripts/setup-shopify-configs.sh development
```

#### Set up Production Configuration
```bash
./scripts/setup-shopify-configs.sh production
```

#### Set up Both Configurations
```bash
./scripts/setup-shopify-configs.sh both
```

**What it does:**
- Creates Shopify app configurations for development and/or production
- Links to appropriate stores
- Creates backup of `shopify.app.toml`
- Provides guidance for manual configuration updates

## Environment Variables

### Required Environment Variables

Your `env` file should contain these variables:

```bash
# Environment setting (controlled by the script)
ENVIRONMENT=development  # or "production"

# Development database
PRISMA_POSTGRES_DATABASE_URL_DEV="your-dev-database-url"

# Production database
PRISMA_POSTGRES_DATABASE_URL_PROD="your-prod-database-url"

# Shopify configuration
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret
SHOPIFY_APP_URL=your-app-url

# Google Maps (if using)
GOOGLE_MAPS_PUBLIC_KEY=your-google-maps-key
GEOCODING_API_KEY=your-geocoding-key
```

### Database URL Selection

The database configuration (`app/config/database.js`) automatically selects the correct database URL based on the `ENVIRONMENT` variable:

- `ENVIRONMENT=development` → Uses `PRISMA_POSTGRES_DATABASE_URL_DEV`
- `ENVIRONMENT=production` → Uses `PRISMA_POSTGRES_DATABASE_URL_PROD`
- `ENVIRONMENT=test` → Uses `PRISMA_POSTGRES_DATABASE_URL_TEST` (or dev as fallback)

## Workflow Examples

### Development Workflow

1. **Switch to development environment:**
   ```bash
   npm run env:dev
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Your app will now use:**
   - Development database
   - Development Shopify configuration
   - Development environment variables

### Production Deployment Workflow

1. **Switch to production environment:**
   ```bash
   npm run env:prod
   ```

2. **Build for production:**
   ```bash
   npm run build
   ```

3. **Deploy to production:**
   ```bash
   npm run deploy
   ```

4. **Your app will now use:**
   - Production database
   - Production Shopify configuration
   - Production environment variables

### Initial Setup Workflow

1. **Set up Shopify configurations:**
   ```bash
   npm run shopify:setup
   ```

2. **Configure your `env` file with database URLs**

3. **Switch to development:**
   ```bash
   npm run env:dev
   ```

4. **Validate setup:**
   ```bash
   npm run env:validate
   ```

## Troubleshooting

### Common Issues

#### "Shopify CLI is not installed"
```bash
npm install -g @shopify/cli @shopify/theme
```

#### "No Shopify configuration found"
Run the setup script to create configurations:
```bash
npm run shopify:setup
```

#### "Database URL not configured"
Make sure your `env` file contains the required database URLs:
- `PRISMA_POSTGRES_DATABASE_URL_DEV`
- `PRISMA_POSTGRES_DATABASE_URL_PROD`

#### "Environment file missing"
The script expects an `env` file in the project root. Create one if it doesn't exist.

### Validation Commands

Use these commands to diagnose issues:

```bash
# Check current environment status
npm run env:status

# Validate environment setup
npm run env:validate

# Check Shopify configurations
shopify app config list

# Check environment variables
cat env | grep ENVIRONMENT
```

## Cross-Platform Compatibility

The environment switching script now works on all major platforms:

### Windows
- Use `npm run env:dev` (recommended)
- Use `node scripts/switch-env.js development`
- Use `scripts\switch-env.cmd development` (Windows batch file)

### macOS/Linux
- Use `npm run env:dev` (recommended)
- Use `node scripts/switch-env.js development`
- Use `./scripts/switch-env development` (Unix launcher)

### Requirements
- Node.js (version 18.20 or higher)
- Shopify CLI installed globally
- Valid `env` file with database URLs

For detailed information about the cross-platform implementation, see [Cross-Platform Environment Switcher](./cross-platform-environment-switcher.md).

## Best Practices

### 1. Always Check Status Before Switching
```bash
npm run env:status
```

### 2. Validate After Switching
```bash
npm run env:validate
```

### 3. Use NPM Scripts Instead of Direct Script Calls
```bash
# Good
npm run env:dev

# Avoid
./scripts/switch-env.sh development
```

### 4. Keep Environment Files in Sync
- Update both development and production database URLs
- Keep Shopify configurations up to date
- Regularly validate your setup

### 5. Use Git Branches for Different Environments
Consider using different Git branches for development and production:
- `main` or `production` branch for production code
- `develop` or `development` branch for development code

## Integration with CI/CD

For automated deployments, you can use the scripts in your CI/CD pipeline:

```bash
# Example CI/CD script
npm run env:prod
npm run build
npm run deploy
```

## Security Considerations

- Never commit sensitive environment variables to Git
- Use `.env` files for local development (add to `.gitignore`)
- Use secure environment variable management in production
- Regularly rotate API keys and secrets

## Related Documentation

- [Environment Setup](./environment-setup.md) - Database configuration details
- [NPM Configuration](./npm-configuration.md) - Package management setup
- [Features Overview](./features-overview.md) - App functionality overview 