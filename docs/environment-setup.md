# Environment-Specific Database Configuration

This document explains how to set up environment-specific database URLs for the Store Locator app.

## Overview

The app now supports different database connections for different environments (development, production, test) based on the `ENVIRONMENT` environment variable.

## Environment Variables Setup

### Required Environment Variables

```bash
# Set the current environment
ENVIRONMENT=development  # or "production" or "test"

# Development database
PRISMA_POSTGRES_DATABASE_URL_DEV=postgresql://username:password@localhost:5432/store_locator_dev

# Production database
PRISMA_POSTGRES_DATABASE_URL_PROD=postgresql://username:password@production-host:5432/store_locator_prod

# Test database (optional - falls back to dev if not set)
PRISMA_POSTGRES_DATABASE_URL_TEST=postgresql://username:password@localhost:5432/store_locator_test
```

### How It Works

1. **Environment Detection**: The app reads the `ENVIRONMENT` variable
2. **Database Selection**: Based on the environment, it selects the appropriate database URL:
   - `ENVIRONMENT=development` → Uses `PRISMA_POSTGRES_DATABASE_URL_DEV`
   - `ENVIRONMENT=production` → Uses `PRISMA_POSTGRES_DATABASE_URL_PROD`
   - `ENVIRONMENT=test` → Uses `PRISMA_POSTGRES_DATABASE_URL_TEST` (or dev if not set)
3. **Prisma Configuration**: The selected URL is set as `DATABASE_URL` for Prisma

## Configuration Files

### `app/config/database.js`
This file handles the environment-specific database URL logic:

```javascript
const environment = process.env.ENVIRONMENT || 'development';

const databaseUrls = {
  development: process.env.PRISMA_POSTGRES_DATABASE_URL_DEV,
  production: process.env.PRISMA_POSTGRES_DATABASE_URL_PROD,
  test: process.env.PRISMA_POSTGRES_DATABASE_URL_TEST || process.env.PRISMA_POSTGRES_DATABASE_URL_DEV,
};

// Sets process.env.DATABASE_URL for Prisma
process.env.DATABASE_URL = getDatabaseUrl();
```

### `prisma/schema.prisma`
The schema now uses a single `DATABASE_URL` environment variable:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Environment Setup Examples

### Development Environment
```bash
export ENVIRONMENT=development
export PRISMA_POSTGRES_DATABASE_URL_DEV=postgresql://dev_user:dev_pass@localhost:5432/store_locator_dev
```

### Production Environment
```bash
export ENVIRONMENT=production
export PRISMA_POSTGRES_DATABASE_URL_PROD=postgresql://prod_user:prod_pass@prod-db.example.com:5432/store_locator_prod
```

### Test Environment
```bash
export ENVIRONMENT=test
export PRISMA_POSTGRES_DATABASE_URL_TEST=postgresql://test_user:test_pass@localhost:5432/store_locator_test
```

## Deployment Considerations

### Vercel Deployment
For Vercel, set these environment variables in your project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:
   - `ENVIRONMENT` = `production`
   - `PRISMA_POSTGRES_DATABASE_URL_PROD` = your production database URL
   - `PRISMA_POSTGRES_DATABASE_URL_DEV` = your development database URL (for local development)

### Docker Deployment
For Docker, include these in your `docker-compose.yml`:

```yaml
environment:
  - ENVIRONMENT=production
  - PRISMA_POSTGRES_DATABASE_URL_PROD=postgresql://user:pass@db:5432/store_locator_prod
```

## Error Handling

If the database URL for the specified environment is not found, the app will throw a clear error message:

```
Database URL not found for environment: production. 
Please set PRISMA_POSTGRES_DATABASE_URL_PRODUCTION in your environment variables.
```

## Benefits

1. **Environment Isolation**: Development and production data are completely separate
2. **Easy Switching**: Change environments by updating a single variable
3. **Security**: Production credentials are isolated from development
4. **Testing**: Dedicated test database for automated testing
5. **Flexibility**: Easy to add more environments (staging, etc.)

## Migration Commands

When running Prisma migrations, the app will automatically use the correct database for the current environment:

```bash
# Development
ENVIRONMENT=development npx prisma migrate dev

# Production
ENVIRONMENT=production npx prisma migrate deploy

# Test
ENVIRONMENT=test npx prisma migrate dev
```

---

*Last updated: December 2024* 