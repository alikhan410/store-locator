import {
  Page,
  Layout,
  Card,
  Text,
  Box,
  InlineStack,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);

  // Get subscription information
  const { appSubscriptions } = await billing.check();
  const subscription = appSubscriptions?.[0];

  return {
    subscription,
  };
};

export default function DealerSubmissionPage() {
  const { subscription } = useLoaderData();

  return (
    <Page title="Dealer Submission Form">
      <TitleBar title="Dealer Submission Form" />
      <Layout>
        <Layout.Section>
          <Card>
            <Box padding="400">
              <Text variant="headingMd" as="h2">
                Dealer Submission Form Configuration
              </Text>
              <Box paddingBlockStart="400">
                <Banner title="Form Available" tone="success">
                  <p>
                    Your public dealer submission form is active and available
                    to dealers. You can manage submissions in the Submissions
                    page.
                  </p>
                </Banner>
              </Box>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
