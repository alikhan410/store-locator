import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { accessibilityUtils } from "../helper/accessibility";
import { useEffect } from "react";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return { 
    apiKey: process.env.SHOPIFY_CLIENT_ID || "",
    contactUrl: process.env.CONTACT_URL || "https://storetrail.app/support"
  };
};

export default function App() {
  const { apiKey, contactUrl } = useLoaderData();

  useEffect(() => {
    // Add skip link for accessibility
    accessibilityUtils.addSkipLink('main-content', 'Skip to main content');
    
    // Announce page load
    accessibilityUtils.announcePageChange('Store Locator Dashboard');
  }, []);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home" aria-label="Store Locator Home">
          🏪 Store Locator
        </Link>
        <Link to="/app/add-store" aria-label="Add a new store location">
          Add a store
        </Link>
        <Link to="/app/view-stores" aria-label="View all store locations">
          View all stores
        </Link>
        <Link to="/app/map" aria-label="View stores on interactive map">
          🗺️ Map
        </Link>
        <Link to="/app/gdpr" aria-label="Data privacy and GDPR settings">
          🔒 Privacy & GDPR
        </Link>
        <Link to="/app/billing" aria-label="Billing and subscription settings">
          Billing
        </Link>
        <Link to="/privacy-policy" target="_blank" aria-label="Privacy Policy (opens in new window)">
          📄 Privacy Policy
        </Link>
        <Link to="/terms-of-service" target="_blank" aria-label="Terms of Service (opens in new window)">
          📋 Terms of Service
        </Link>
        <Link 
          to={contactUrl} 
          target="_blank" 
          aria-label="Contact Support (opens in new window)"
        >
          💬 Support
        </Link>
      </NavMenu>
      <main id="main-content" role="main" aria-label="Main content">
        <Outlet />
      </main>
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
