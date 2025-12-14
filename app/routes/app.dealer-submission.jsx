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
import { useFeatureGate } from "../helper/featureGating";
import { FeatureButton } from "../components/UpgradePrompt";

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

  // Feature gating for dealer submission form
  const dealerSubmissionGate = useFeatureGate(
    "dealer_submission_form",
    subscription,
  );

  // Show upgrade prompt if dealer submission feature is not enabled
  if (!dealerSubmissionGate.isEnabled) {
    return (
      <Page title="Dealer Submission Form">
        <TitleBar title="Dealer Submission Form" />
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="400">
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="h2">
                    Dealer Submission Form
                  </Text>
                  <FeatureButton
                    feature="dealer_submission_form"
                    subscription={subscription}
                    variant="primary"
                  >
                    Upgrade to Pro Plan
                  </FeatureButton>
                </InlineStack>
                <Box paddingBlockStart="400">
                  <Banner title="Public Submission Form" tone="info">
                    <p>
                      Upgrade to Pro Plan to unlock the public dealer submission
                      form:
                    </p>
                    <ul>
                      <li>
                        Public form for dealers to submit store information
                      </li>
                      <li>Automatic email notifications for new submissions</li>
                      <li>Admin approval workflow for submissions</li>
                      <li>Integration with Klaviyo for marketing automation</li>
                      <li>Custom form fields and validation</li>
                      <li>Submission management dashboard</li>
                    </ul>
                  </Banner>
                </Box>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // For Pro users, show the actual dealer submission form
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
