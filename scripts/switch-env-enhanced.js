#!/usr/bin/env node

/**
 * Store Locator Environment Switcher - Enhanced Version
 * Cross-platform Node.js CLI using Commander.js
 */

import { Command } from 'commander';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Colors for output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
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
const printDebug = (message) => print('cyan', 'DEBUG', message);

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
    const envPath = join(projectRoot, 'env');
    if (!existsSync(envPath)) {
        throw new Error('env file not found');
    }
    return readFileSync(envPath, 'utf8');
};

// Write env file
const writeEnvFile = (content) => {
    const envPath = join(projectRoot, 'env');
    writeFileSync(envPath, content, 'utf8');
};

// Update environment variable in env file
const updateEnvironment = (newEnv) => {
    const envContent = readEnvFile();
    const updatedContent = envContent.replace(
        /^ENVIRONMENT=.*$/m,
        `ENVIRONMENT=${newEnv}`
    );
    writeEnvFile(updatedContent);
    printSuccess(`Updated ENVIRONMENT=${newEnv} in env file`);
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
    const envPath = join(projectRoot, 'env');
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
    const envPath = join(projectRoot, 'env');
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

// Setup Shopify configurations
const setupShopifyConfigs = (environment) => {
    printStatus(`Setting up Shopify ${environment} configuration...`);
    
    try {
        // Check if config already exists
        const configList = execCommand('shopify app config list');
        
        if (configList.includes(environment)) {
            printWarning(`Shopify ${environment} configuration already exists`);
            return;
        }
        
        // Create new configuration
        execCommand(`shopify app config link --config=${environment}`);
        printSuccess(`Created Shopify ${environment} configuration`);
        
    } catch (error) {
        printError(`Failed to create Shopify ${environment} configuration: ${error.message}`);
    }
};

// Main CLI setup
const program = new Command();

program
    .name('env-switcher')
    .description('Store Locator Environment Switcher - Cross-platform CLI tool')
    .version('2.0.0')
    .option('-d, --debug', 'Enable debug output');

// Development command
program
    .command('dev')
    .alias('development')
    .description('Switch to development environment')
    .action(() => {
        checkShopifyCLI();
        switchToDevelopment();
        validateEnvironment();
    });

// Production command
program
    .command('prod')
    .alias('production')
    .description('Switch to production environment')
    .action(() => {
        checkShopifyCLI();
        switchToProduction();
        validateEnvironment();
    });

// Status command
program
    .command('status')
    .description('Show current environment status')
    .action(() => {
        showStatus();
    });

// Validate command
program
    .command('validate')
    .description('Validate environment setup')
    .action(() => {
        validateEnvironment();
    });

// Setup command
program
    .command('setup')
    .description('Set up Shopify configurations')
    .argument('[environment]', 'Environment to set up (dev, prod, or both)', 'both')
    .action((environment) => {
        checkShopifyCLI();
        
        switch (environment) {
            case 'dev':
            case 'development':
                setupShopifyConfigs('development');
                break;
            case 'prod':
            case 'production':
                setupShopifyConfigs('production');
                break;
            case 'both':
                setupShopifyConfigs('development');
                setupShopifyConfigs('production');
                break;
            default:
                printError(`Unknown environment: ${environment}`);
                process.exit(1);
        }
    });

// Info command
program
    .command('info')
    .description('Show system information and requirements')
    .action(() => {
        printStatus('System Information:');
        console.log('');
        
        // Node.js version
        const nodeVersion = process.version;
        console.log(`  Node.js: ${colors.green}${nodeVersion}${colors.reset}`);
        
        // Platform
        const platform = process.platform;
        console.log(`  Platform: ${colors.yellow}${platform}${colors.reset}`);
        
        // Shopify CLI
        if (commandExists('shopify')) {
            try {
                const shopifyVersion = execCommand('shopify version', { stdio: 'pipe' });
                console.log(`  Shopify CLI: ${colors.green}${shopifyVersion.trim()}${colors.reset}`);
            } catch {
                console.log(`  Shopify CLI: ${colors.green}Installed${colors.reset}`);
            }
        } else {
            console.log(`  Shopify CLI: ${colors.red}Not installed${colors.reset}`);
        }
        
        // Required files
        const envPath = join(projectRoot, 'env');
        const shopifyConfigPath = join(projectRoot, 'shopify.app.toml');
        
        console.log(`  env file: ${existsSync(envPath) ? colors.green + 'Found' + colors.reset : colors.red + 'Missing' + colors.reset}`);
        console.log(`  shopify.app.toml: ${existsSync(shopifyConfigPath) ? colors.green + 'Found' + colors.reset : colors.red + 'Missing' + colors.reset}`);
        
        console.log('');
    });

// Parse command line arguments
program.parse(); 