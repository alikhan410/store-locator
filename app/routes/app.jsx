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
    contactUrl: process.env.CONTACT_URL || "https://storetrail.app/support",
  };
};

export default function App() {
  const { apiKey, contactUrl } = useLoaderData();

  useEffect(() => {
    // Add skip link for accessibility
    accessibilityUtils.addSkipLink("main-content", "Skip to main content");

    // Announce page load
    accessibilityUtils.announcePageChange("Store Locator Dashboard");
  }, []);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Store Locator
        </Link>
        <Link to="/app/add-store">
          Add a store
        </Link>
        <Link to="/app/view-stores">
          View all stores
        </Link>
        <Link to="/app/submissions">
          Submissions
        </Link>
        <Link to="/app/choropleth">
          Distribution Map
        </Link>
        <Link to="/app/billing">
          Billing
        </Link>
        <Link to="/app/support">
          Support
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
