#!/usr/bin/env node

/**
 * Store Locator Environment Switcher
 * Cross-platform Node.js version that works on Windows, macOS, and Linux
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const envPath = join(projectRoot, '.env');
// Colors for output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

// Utility functions
const print = (color, prefix, message) => {
    console.log(`${colors[color]}[${prefix}]${colors.reset} ${message}`);
};

const printStatus = (message) => print('blue', 'INFO', message);
const printSuccess = (message) => print('green', 'SUCCESS', message);
const printWarning = (message) => print('yellow', 'WARNING', message);
const printError = (message) => print('red', 'ERROR', message);

// Check if command exists
const commandExists = (command) => {
    try {
        execSync(`which ${command}`, { stdio: 'ignore' });
        return true;
    } catch {
        try {
            execSync(`where ${command}`, { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }
};

// Execute command with proper error handling
const execCommand = (command, options = {}) => {
    try {
        return execSync(command, { 
            stdio: 'pipe', 
            encoding: 'utf8',
            cwd: projectRoot,
            ...options 
        });
    } catch (error) {
        throw new Error(`Command failed: ${command}\n${error.message}`);
    }
};

// Read env file
const readEnvFile = () => {
    if (!existsSync(envPath)) {
        throw new Error('env file not found');
    }
    return readFileSync(envPath, 'utf8');
};

// Write env file
const writeEnvFile = (content) => {
    // const envPath = join(projectRoot, '.env');
    writeFileSync(envPath, content, 'utf8');
};

// Update environment variable in env file
// const updateEnvironment = (newEnv) => {
//     const envContent = readEnvFile();
//     const updatedContent = envContent.replace(
//         /^ENVIRONMENT=.*$/m,
//         `ENVIRONMENT=${newEnv}`
//     );
//     writeEnvFile(updatedContent);
//     printSuccess(`Updated ENVIRONMENT=${newEnv} in env file`);
// };

const updateEnvironment = (newEnv) => {
    let envContent = readEnvFile();

    // Update ENVIRONMENT
    envContent = envContent.replace(
        /^ENVIRONMENT=.*$/m,
        `ENVIRONMENT=${newEnv}`
    );

    // Find existing dev/prod database URLs
    const devDbMatch = envContent.match(/PRISMA_POSTGRES_DATABASE_URL_DEV\s*=\s*"?([^"\n]+)"?/);
    const prodDbMatch = envContent.match(/PRISMA_POSTGRES_DATABASE_URL_PROD\s*=\s*"?([^"\n]+)"?/);

    // Decide which URL to set as DATABASE_URL
    const dbUrl = newEnv === 'production' ? (prodDbMatch?.[1] || '') : (devDbMatch?.[1] || '');

    if (!dbUrl) {
        printWarning(`Could not find database URL for ${newEnv} in .env`);
    }

    // Update or add DATABASE_URL
    if (envContent.match(/^DATABASE_URL=.*$/m)) {
        envContent = envContent.replace(
            /^DATABASE_URL=.*$/m,
            `DATABASE_URL=${dbUrl}`
        );
    } else {
        envContent += `\nDATABASE_URL=${dbUrl}`;
    }

    // Write back to .env file
    writeEnvFile(envContent);

    printSuccess(`Updated ENVIRONMENT=${newEnv} and DATABASE_URL in .env file`);
};

// Get current environment
const getCurrentEnvironment = () => {
    try {
        const envContent = readEnvFile();
        const match = envContent.match(/^ENVIRONMENT=(.+)$/m);
        return match ? match[1].trim() : 'unknown';
    } catch {
        return 'unknown';
    }
};

// Check Shopify CLI
const checkShopifyCLI = () => {
    if (!commandExists('shopify')) {
        printError('Shopify CLI is not installed. Please install it first:');
        console.log('  npm install -g @shopify/cli @shopify/theme');
        process.exit(1);
    }
};

// Switch Shopify app config
const switchShopifyConfig = (environment) => {
    try {
        // List available configs
        const configList = execCommand('shopify app config list');
        
        if (configList.includes(environment)) {
            execCommand(`shopify app config use ${environment}`);
            printSuccess(`Switched to Shopify ${environment} configuration`);
        } else {
            printWarning(`No Shopify ${environment} configuration found. You may need to create one:`);
            console.log(`  shopify app config link --config=${environment}`);
        }
    } catch (error) {
        printWarning(`Could not switch Shopify config: ${error.message}`);
    }
};

// Show current status
const showStatus = () => {
    printStatus('Current Environment Status:');
    console.log('');
    
    // Check env file
    const envPath = join(projectRoot, '.env');
    if (existsSync(envPath)) {
        const currentEnv = getCurrentEnvironment();
        console.log(`  Environment File: ${colors.green}env${colors.reset}`);
        console.log(`  Current Environment: ${colors.yellow}${currentEnv}${colors.reset}`);
    } else {
        console.log(`  Environment File: ${colors.red}Missing${colors.reset}`);
    }
    
    // Check Shopify app config
    const shopifyConfigPath = join(projectRoot, 'shopify.app.toml');
    if (existsSync(shopifyConfigPath)) {
        console.log(`  Shopify Config: ${colors.green}shopify.app.toml${colors.reset}`);
        try {
            const configContent = readFileSync(shopifyConfigPath, 'utf8');
            const appUrlMatch = configContent.match(/application_url\s*=\s*"([^"]+)"/);
            if (appUrlMatch) {
                console.log(`  App URL: ${colors.yellow}${appUrlMatch[1]}${colors.reset}`);
            }
        } catch (error) {
            console.log(`  App URL: ${colors.red}Error reading config${colors.reset}`);
        }
    } else {
        console.log(`  Shopify Config: ${colors.red}Missing${colors.reset}`);
    }
    
    // Check database URLs
    try {
        const envContent = readEnvFile();
        const devDbMatch = envContent.match(/PRISMA_POSTGRES_DATABASE_URL_DEV\s*=\s*"([^"]+)"/);
        const prodDbMatch = envContent.match(/PRISMA_POSTGRES_DATABASE_URL_PROD\s*=\s*"([^"]+)"/);
        
        if (devDbMatch && devDbMatch[1]) {
            console.log(`  Dev Database: ${colors.green}Configured${colors.reset}`);
        } else {
            console.log(`  Dev Database: ${colors.red}Missing${colors.reset}`);
        }
        
        if (prodDbMatch && prodDbMatch[1]) {
            console.log(`  Prod Database: ${colors.green}Configured${colors.reset}`);
        } else {
            console.log(`  Prod Database: ${colors.red}Missing${colors.reset}`);
        }
    } catch (error) {
        console.log(`  Database URLs: ${colors.red}Error reading env file${colors.reset}`);
    }
    
    console.log('');
};

// Switch to development environment
const switchToDevelopment = () => {
    printStatus('Switching to development environment...');
    
    updateEnvironment('development');
    switchShopifyConfig('development');
    
    printSuccess('Successfully switched to development environment!');
    console.log('');
    printStatus('Next steps:');
    console.log('  1. Run \'npm run dev\' to start development server');
    console.log('  2. Your app will use the development database');
    console.log('  3. Use \'shopify app dev\' for local development');
};

// Switch to production environment
const switchToProduction = () => {
    printStatus('Switching to production environment...');
    
    updateEnvironment('production');
    switchShopifyConfig('production');
    
    printSuccess('Successfully switched to production environment!');
    console.log('');
    printStatus('Next steps:');
    console.log('  1. Run \'npm run build\' to build for production');
    console.log('  2. Run \'npm run deploy\' to deploy to production');
    console.log('  3. Your app will use the production database');
};

// Validate environment setup
const validateEnvironment = () => {
    printStatus('Validating environment setup...');
    
    // Check required files
    const envPath = join(projectRoot, '.env');
    const shopifyConfigPath = join(projectRoot, 'shopify.app.toml');
    
    if (!existsSync(envPath)) {
        printError('env file is missing');
        return false;
    }
    
    if (!existsSync(shopifyConfigPath)) {
        printError('shopify.app.toml is missing');
        return false;
    }
    
    // Check database URLs
    try {
        const envContent = readEnvFile();
        const devDbMatch = envContent.match(/PRISMA_POSTGRES_DATABASE_URL_DEV\s*=\s*"([^"]+)"/);
        const prodDbMatch = envContent.match(/PRISMA_POSTGRES_DATABASE_URL_PROD\s*=\s*"([^"]+)"/);
        
        if (!devDbMatch || !devDbMatch[1]) {
            printWarning('Development database URL not configured');
        }
        
        if (!prodDbMatch || !prodDbMatch[1]) {
            printWarning('Production database URL not configured');
        }
    } catch (error) {
        printWarning('Could not validate database URLs');
    }
    
    printSuccess('Environment validation complete');
    return true;
};

// Show usage
const showUsage = () => {
    console.log('Usage: node switch-env.js [development|production|status]');
    console.log('');
    console.log('Commands:');
    console.log('  development  - Switch to development environment');
    console.log('  production   - Switch to production environment');
    console.log('  status       - Show current environment status');
    console.log('  validate     - Validate environment setup');
    console.log('');
    console.log('Examples:');
    console.log('  node switch-env.js development');
    console.log('  node switch-env.js production');
    console.log('  node switch-env.js status');
};

// Main function
const main = () => {
    const command = process.argv[2];
    
    // Check if Shopify CLI is available
    checkShopifyCLI();
    
    switch (command) {
        case 'development':
        case 'dev':
            switchToDevelopment();
            validateEnvironment();
            break;
        case 'production':
        case 'prod':
            switchToProduction();
            validateEnvironment();
            break;
        case 'status':
            showStatus();
            break;
        case 'validate':
            validateEnvironment();
            break;
        case undefined:
        case '--help':
        case '-h':
            showUsage();
            process.exit(1);
        default:
            printError(`Unknown command: ${command}`);
            showUsage();
            process.exit(1);
    }
};

// Run main function
main(); 