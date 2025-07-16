import { Card, Page, Text, InlineStack } from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing } = await authenticate.admin(request);

  return { billing };
};

export default function Settings() {
  const { billing } = useLoaderData();

  return (
    <Page title="Settings">
      <Card>
        <InlineStack align="space-between">
          <Text>Billing goes here</Text>
        </InlineStack>
      </Card>
    </Page>
  );
}
