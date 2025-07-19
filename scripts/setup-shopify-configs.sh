#!/bin/bash

# Shopify App Configuration Setup
# This script helps set up development and production configurations for the Shopify app

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [development|production|both]"
    echo ""
    echo "Commands:"
    echo "  development  - Set up development configuration only"
    echo "  production   - Set up production configuration only"
    echo "  both         - Set up both development and production configurations"
    echo ""
    echo "This script will help you create Shopify app configurations for different environments."
    echo "You'll need to provide the app URLs and other details during setup."
}

# Function to check if Shopify CLI is installed
check_shopify_cli() {
    if ! command -v shopify &> /dev/null; then
        print_error "Shopify CLI is not installed. Please install it first:"
        echo "  npm install -g @shopify/cli @shopify/theme"
        exit 1
    fi
}

# Function to get current configurations
show_current_configs() {
    print_status "Current Shopify app configurations:"
    echo ""
    
    if shopify app config list 2>/dev/null; then
        echo ""
    else
        print_warning "No configurations found or error listing configurations"
    fi
}

# Function to setup development configuration
setup_development_config() {
    print_status "Setting up development configuration..."
    echo ""
    
    # Check if development config already exists
    if shopify app config list 2>/dev/null | grep -q "development"; then
        print_warning "Development configuration already exists"
        read -p "Do you want to recreate it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Skipping development configuration setup"
            return
        fi
    fi
    
    print_status "You'll need to provide the following information for development:"
    echo "  - Development app URL (e.g., https://your-dev-app.vercel.app)"
    echo "  - Development store URL (e.g., your-dev-store.myshopify.com)"
    echo ""
    
    read -p "Enter development app URL: " DEV_APP_URL
    read -p "Enter development store URL: " DEV_STORE_URL
    
    if [ -z "$DEV_APP_URL" ] || [ -z "$DEV_STORE_URL" ]; then
        print_error "Both app URL and store URL are required"
        exit 1
    fi
    
    print_status "Creating development configuration..."
    
    # Create development config
    shopify app config link --config=development --store="$DEV_STORE_URL"
    
    print_success "Development configuration created successfully!"
    echo "  App URL: $DEV_APP_URL"
    echo "  Store: $DEV_STORE_URL"
}

# Function to setup production configuration
setup_production_config() {
    print_status "Setting up production configuration..."
    echo ""
    
    # Check if production config already exists
    if shopify app config list 2>/dev/null | grep -q "production"; then
        print_warning "Production configuration already exists"
        read -p "Do you want to recreate it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Skipping production configuration setup"
            return
        fi
    fi
    
    print_status "You'll need to provide the following information for production:"
    echo "  - Production app URL (e.g., https://your-prod-app.vercel.app)"
    echo "  - Production store URL (e.g., your-prod-store.myshopify.com)"
    echo ""
    
    read -p "Enter production app URL: " PROD_APP_URL
    read -p "Enter production store URL: " PROD_STORE_URL
    
    if [ -z "$PROD_APP_URL" ] || [ -z "$PROD_STORE_URL" ]; then
        print_error "Both app URL and store URL are required"
        exit 1
    fi
    
    print_status "Creating production configuration..."
    
    # Create production config
    shopify app config link --config=production --store="$PROD_STORE_URL"
    
    print_success "Production configuration created successfully!"
    echo "  App URL: $PROD_APP_URL"
    echo "  Store: $PROD_STORE_URL"
}

# Function to update shopify.app.toml with environment-specific URLs
update_app_toml() {
    print_status "Updating shopify.app.toml with environment-specific URLs..."
    
    if [ ! -f "shopify.app.toml" ]; then
        print_error "shopify.app.toml not found"
        return 1
    fi
    
    # Create backup
    cp shopify.app.toml shopify.app.toml.backup
    
    print_success "Backup created: shopify.app.toml.backup"
    print_warning "You may need to manually update shopify.app.toml with environment-specific URLs"
    echo ""
    print_status "Consider updating these fields in shopify.app.toml:"
    echo "  - application_url (should match your environment)"
    echo "  - redirect_urls (should include your environment URLs)"
}

# Main script logic
main() {
    # Check if Shopify CLI is available
    check_shopify_cli
    
    # Show current configurations
    show_current_configs
    
    # Parse command line arguments
    case "${1:-}" in
        "development"|"dev")
            setup_development_config
            update_app_toml
            ;;
        "production"|"prod")
            setup_production_config
            update_app_toml
            ;;
        "both")
            setup_development_config
            echo ""
            setup_production_config
            update_app_toml
            ;;
        "")
            show_usage
            exit 1
            ;;
        *)
            print_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
    
    echo ""
    print_success "Configuration setup complete!"
    echo ""
    print_status "Next steps:"
    echo "  1. Update your env file with environment-specific database URLs"
    echo "  2. Use 'npm run env:dev' to switch to development"
    echo "  3. Use 'npm run env:prod' to switch to production"
    echo "  4. Use 'npm run env:status' to check current environment"
}

# Run main function with all arguments
main "$@" 