import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          🏪 Store Locator
        </Link>
        <Link to="/app/add-store">Add a store</Link>
        <Link to="/app/view-stores">View all stores</Link>
        <Link to="/app/map">🗺️ Map</Link>
        <Link to="/app/gdpr">🔒 Privacy & GDPR</Link>
        <Link to="/app/billing">Billing</Link>
        <Link to="/privacy-policy" target="_blank">📄 Privacy Policy</Link>
        <Link to="/terms-of-service" target="_blank">📋 Terms of Service</Link>
      </NavMenu>
      <Outlet />
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
