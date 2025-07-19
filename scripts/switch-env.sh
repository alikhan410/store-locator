#!/bin/bash

# Store Locator Environment Switcher
# This script helps switch between development and production environments
# for the Shopify app, updating all necessary configuration files.

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
    echo "Usage: $0 [development|production|status]"
    echo ""
    echo "Commands:"
    echo "  development  - Switch to development environment"
    echo "  production   - Switch to production environment"
    echo "  status       - Show current environment status"
    echo ""
    echo "Examples:"
    echo "  $0 development"
    echo "  $0 production"
    echo "  $0 status"
}

# Function to check if Shopify CLI is installed
check_shopify_cli() {
    if ! command -v shopify &> /dev/null; then
        print_error "Shopify CLI is not installed. Please install it first:"
        echo "  npm install -g @shopify/cli @shopify/theme"
        exit 1
    fi
}

# Function to get current environment from env file
get_current_environment() {
    if [ -f "env" ]; then
        grep "^ENVIRONMENT=" env | cut -d'=' -f2 | tr -d '\r'
    else
        echo "unknown"
    fi
}

# Function to show current status
show_status() {
    print_status "Current Environment Status:"
    echo ""
    
    # Check env file
    if [ -f "env" ]; then
        CURRENT_ENV=$(get_current_environment)
        echo "  Environment File: ${GREEN}env${NC}"
        echo "  Current Environment: ${YELLOW}$CURRENT_ENV${NC}"
    else
        echo "  Environment File: ${RED}Missing${NC}"
    fi
    
    # Check Shopify app config
    if [ -f "shopify.app.toml" ]; then
        echo "  Shopify Config: ${GREEN}shopify.app.toml${NC}"
        APP_URL=$(grep "application_url" shopify.app.toml | cut -d'=' -f2 | tr -d ' "')
        echo "  App URL: ${YELLOW}$APP_URL${NC}"
    else
        echo "  Shopify Config: ${RED}Missing${NC}"
    fi
    
    # Check database URLs
    if [ -f "env" ]; then
        DEV_DB=$(grep "PRISMA_POSTGRES_DATABASE_URL_DEV" env | cut -d'=' -f2 | tr -d '"')
        PROD_DB=$(grep "PRISMA_POSTGRES_DATABASE_URL_PROD" env | cut -d'=' -f2 | tr -d '"')
        
        if [ -n "$DEV_DB" ]; then
            echo "  Dev Database: ${GREEN}Configured${NC}"
        else
            echo "  Dev Database: ${RED}Missing${NC}"
        fi
        
        if [ -n "$PROD_DB" ]; then
            echo "  Prod Database: ${GREEN}Configured${NC}"
        else
            echo "  Prod Database: ${RED}Missing${NC}"
        fi
    fi
    
    echo ""
}

# Function to switch to development environment
switch_to_development() {
    print_status "Switching to development environment..."
    
    # Update ENVIRONMENT variable in env file
    if [ -f "env" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' 's/^ENVIRONMENT=.*/ENVIRONMENT=development/' env
        else
            # Linux
            sed -i 's/^ENVIRONMENT=.*/ENVIRONMENT=development/' env
        fi
        print_success "Updated ENVIRONMENT=development in env file"
    else
        print_error "env file not found"
        exit 1
    fi
    
    # Switch Shopify app config to development
    print_status "Switching Shopify app to development configuration..."
    
    # Check if we have a development config
    if shopify app config list | grep -q "development"; then
        shopify app config use development
        print_success "Switched to Shopify development configuration"
    else
        print_warning "No Shopify development configuration found. You may need to create one:"
        echo "  shopify app config link --config=development"
    fi
    
    print_success "Successfully switched to development environment!"
    echo ""
    print_status "Next steps:"
    echo "  1. Run 'npm run dev' to start development server"
    echo "  2. Your app will use the development database"
    echo "  3. Use 'shopify app dev' for local development"
}

# Function to switch to production environment
switch_to_production() {
    print_status "Switching to production environment..."
    
    # Update ENVIRONMENT variable in env file
    if [ -f "env" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' 's/^ENVIRONMENT=.*/ENVIRONMENT=production/' env
        else
            # Linux
            sed -i 's/^ENVIRONMENT=.*/ENVIRONMENT=production/' env
        fi
        print_success "Updated ENVIRONMENT=production in env file"
    else
        print_error "env file not found"
        exit 1
    fi
    
    # Switch Shopify app config to production
    print_status "Switching Shopify app to production configuration..."
    
    # Check if we have a production config
    if shopify app config list | grep -q "production"; then
        shopify app config use production
        print_success "Switched to Shopify production configuration"
    else
        print_warning "No Shopify production configuration found. You may need to create one:"
        echo "  shopify app config link --config=production"
    fi
    
    print_success "Successfully switched to production environment!"
    echo ""
    print_status "Next steps:"
    echo "  1. Run 'npm run build' to build for production"
    echo "  2. Run 'npm run deploy' to deploy to production"
    echo "  3. Your app will use the production database"
}

# Function to validate environment setup
validate_environment() {
    print_status "Validating environment setup..."
    
    # Check required files
    if [ ! -f "env" ]; then
        print_error "env file is missing"
        return 1
    fi
    
    if [ ! -f "shopify.app.toml" ]; then
        print_error "shopify.app.toml is missing"
        return 1
    fi
    
    # Check database URLs
    DEV_DB=$(grep "PRISMA_POSTGRES_DATABASE_URL_DEV" env | cut -d'=' -f2 | tr -d '"')
    PROD_DB=$(grep "PRISMA_POSTGRES_DATABASE_URL_PROD" env | cut -d'=' -f2 | tr -d '"')
    
    if [ -z "$DEV_DB" ]; then
        print_warning "Development database URL not configured"
    fi
    
    if [ -z "$PROD_DB" ]; then
        print_warning "Production database URL not configured"
    fi
    
    print_success "Environment validation complete"
}

# Main script logic
main() {
    # Check if Shopify CLI is available
    check_shopify_cli
    
    # Parse command line arguments
    case "${1:-}" in
        "development"|"dev")
            switch_to_development
            validate_environment
            ;;
        "production"|"prod")
            switch_to_production
            validate_environment
            ;;
        "status")
            show_status
            ;;
        "validate")
            validate_environment
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
}

# Run main function with all arguments
main "$@" 