import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit, useActionData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  InlineGrid,
  Button,
  Banner,
  List,
  Badge,
  Icon,
  TextField,
  Select,
  CalloutCard,
} from "@shopify/polaris";
import {
  EmailIcon,
  PhoneIcon,
  ChatIcon,
  ClockIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  InfoIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { useFeatureGate } from "../helper/featureGating";
import { FeatureButton } from "../components/UpgradePrompt";
import { useState, useEffect } from "react";

export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);

  // Get subscription information
  const { appSubscriptions } = await billing.check();
  const subscription = appSubscriptions?.[0];

  return {
    subscription,
    contactEmail: process.env.SUPPORT_EMAIL || "support@storetrail.app",
    contactUrl: process.env.CONTACT_URL || "https://storetrail.app/support",
    shop: session.shop,
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "support_request") {
    const subject = formData.get("subject");
    const issueType = formData.get("issueType");
    const description = formData.get("description");

    try {
      // Send Klaviyo event - your flow handles the email forwarding
      await sendKlaviyoSupportEvent({
        subject,
        issueType,
        description,
        shop: session.shop,
        subscription: session.subscription,
      });

      return { success: true, message: "Support request submitted successfully!" };
    } catch (error) {
      console.error("Failed to send Klaviyo support event:", error);
      return { success: false, error: "Failed to submit support request" };
    }
  }

  return { success: false };
};

async function sendKlaviyoSupportEvent(supportData) {
  const klaviyoApiKey = process.env.KLAVIYO_PRIVATE_API_KEY;

  if (!klaviyoApiKey) {
    console.log("Klaviyo credentials not configured");
    return;
  }

  const eventData = {
    data: {
      type: "event",
      attributes: {
        properties: {
          "Subject": supportData.subject,
          "Issue Type": supportData.issueType,
          "Description": supportData.description,
          "Shop": supportData.shop,
          "Support Level": supportData.subscription?.name || "Free",
          "Plan Status": supportData.subscription?.status || "No Subscription",
          "Plan Price": supportData.subscription?.lineItems?.[0]?.plan?.pricingDetails?.price?.amount || "0",
          "Plan Currency": supportData.subscription?.lineItems?.[0]?.plan?.pricingDetails?.price?.currencyCode || "USD",
          "Plan Billing Cycle": supportData.subscription?.lineItems?.[0]?.plan?.pricingDetails?.billingCycle || "N/A",
          "Subscription ID": supportData.subscription?.id || "N/A",
          "Event Type": "Support Request",
        },
        metric: {
          data: {
            type: "metric",
            attributes: {
              name: "Support Request Submitted",
              service: "store_locator",
            },
          },
        },
        profile: {
          data: {
            type: "profile",
            attributes: {
              email: `${supportData.shop}@storetrail.app`, // Use shop as identifier
              organization: supportData.shop,
              title: "Store Owner",
              location: {
                address1: supportData.shop,
                country: "United States",
              },
            },
          },
        },
        time: new Date().toISOString(),
        value: 1,
        value_currency: "USD",
        unique_id: `support_request_${supportData.shop}_${Date.now()}`,
      },
    },
  };

  const response = await fetch("https://a.klaviyo.com/api/events", {
    method: "POST",
    headers: {
      accept: "application/vnd.api+json",
      revision: "2025-07-15",
      "content-type": "application/vnd.api+json",
      Authorization: `Klaviyo-API-Key ${klaviyoApiKey}`,
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    throw new Error(`Klaviyo API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export default function SupportPage() {
  const { subscription, contactEmail, contactUrl, shop } = useLoaderData();
  const navigate = useNavigate();
  const submit = useSubmit();
  const actionData = useActionData();

  const [formData, setFormData] = useState({
    subject: "",
    issueType: "",
    description: "",
  });

  // Determine support level based on plan
  const getSupportLevel = () => {
    const defaultFreeSupport = {
      level: "free",
      name: "Email Support",
      description: "Standard email support with 24–48 hour response time",
      features: [
        "Email support only",
        "24–48 hour response time",
        "Basic troubleshooting",
        "Documentation access",
      ],
      icon: EmailIcon,
      color: "base",
    };

    if (!subscription || subscription.status !== "ACTIVE") {
      return defaultFreeSupport;
    }

    const planName = subscription.name?.toLowerCase();

    if (planName === "startup" || planName === "basic") {
      return {
        level: "basic",
        name: "Priority Email Support",
        description: "Enhanced email support with faster response times",
        features: [
          "Priority email support",
          "12–24 hour response time",
          "Advanced troubleshooting",
          "Setup assistance",
          "Documentation access",
        ],
        icon: EmailIcon,
        color: "success",
      };
    }

    if (planName === "pro") {
      return {
        level: "pro",
        name: "Premium Support",
        description: "Comprehensive support with multiple channels",
        features: [
          "Priority email support",
          "Live chat during business hours",
          "Phone support option",
          "4–8 hour response time",
          "Dedicated account assistance",
          "Setup and onboarding support",
        ],
        icon: ChatIcon,
        color: "success",
      };
    }

    return defaultFreeSupport;
  };

  const supportLevel = getSupportLevel();
  const isFreePlan = supportLevel.level === "free";

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSupportSubmit = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append("action", "support_request");
    formDataToSubmit.append("subject", formData.subject);
    formDataToSubmit.append("issueType", formData.issueType);
    formDataToSubmit.append("description", formData.description);

    submit(formDataToSubmit, { method: "post" });
  };

  // Handle form submission response
  useEffect(() => {
    if (actionData?.success) {
      // Clear form on successful submission
      setFormData({
        subject: "",
        issueType: "",
        description: "",
      });

      // Show success message (you could add a toast notification here)
      console.log("Support request submitted successfully!");
    } else if (actionData?.error) {
      // Show error message
      console.error("Support request failed:", actionData.error);
    }
  }, [actionData]);

  const handleDocumentationClick = (docType) => {
    // Send Klaviyo event for documentation clicks
    try {
      sendKlaviyoSupportEvent({
        subject: `Documentation Access: ${docType}`,
        issueType: "documentation",
        description: `User accessed ${docType} documentation`,
        shop,
        subscription,
      });
    } catch (error) {
      console.error("Failed to send Klaviyo documentation event:", error);
    }
  };

  return (
    <Page
      title="Support"
      backAction={{
        content: "Dashboard",
        onAction: () => navigate("/app"),
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {/* Left Column - Self-Help Resources */}
            <InlineGrid gap="400" columns={2}>
              {/* Support Level Card */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text variant="headingMd" as="h2">
                      Your Support Level
                    </Text>
                    <Button size="slim" disabled>
                      {supportLevel.name}
                    </Button>
                  </InlineStack>

                  <Text variant="bodyMd" color="subdued">
                    {supportLevel.description}
                  </Text>

                  <List gap="extraTight">
                    {supportLevel.features.map((feature, index) => (
                      <List.Item key={index}>
                        {feature}
                      </List.Item>
                    ))}
                  </List>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">
                    Self-Help Resources
                  </Text>

                  <BlockStack gap="500">
                    <Button
                      fullWidth
                      variant="tertiary"
                      onClick={() => {
                        handleDocumentationClick("Installation Guide");
                        window.open("/docs/installation-guide", "_blank");
                      }}
                    >
                      Installation Guide
                    </Button>

                    <Button
                      fullWidth
                      variant="tertiary"
                      onClick={() => {
                        handleDocumentationClick("User Manual");
                        window.open("/docs/user-manual", "_blank");
                      }}
                    >
                      User Manual
                    </Button>

                    <Button
                      fullWidth
                      variant="tertiary"
                      onClick={() => {
                        handleDocumentationClick("Troubleshooting Guide");
                        window.open("/docs/troubleshooting-guide", "_blank");
                      }}
                    >
                      Troubleshooting Guide
                    </Button>

                    <Button
                      fullWidth
                      variant="tertiary"
                      onClick={() => {
                        handleDocumentationClick("FAQ");
                        window.open("/docs/faq", "_blank");
                      }}
                    >
                      Frequently Asked Questions
                    </Button>
                  </BlockStack>
                </BlockStack>
              </Card>
            </InlineGrid>

            {/* Right Column - Support Level Card + Upgrade Banner */}
            <BlockStack gap="400">
              {/* Upgrade Banner (only if on free plan) */}
              {isFreePlan && (
                <Banner
                  title="Upgrade for Enhanced Support"
                  tone="info"
                  action={{
                    content: "View Plans",
                    onAction: () => navigate("/app/billing"),
                  }}
                >
                  <p>
                    Upgrade to Basic or Pro plan for faster response times, live chat support, and dedicated assistance.
                  </p>
                </Banner>
              )}
            </BlockStack>
          </BlockStack>
        </Layout.Section>

        {/* Support Request Form */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Submit Support Request
              </Text>

              <BlockStack gap="300">
                <TextField
                  label="Subject"
                  placeholder="Brief description of your issue"
                  autoComplete="off"
                  value={formData.subject}
                  onChange={(value) => handleFormChange("subject", value)}
                />

                <Select
                  label="Issue Type"
                  options={[
                    { label: "General Question", value: "general" },
                    { label: "Technical Issue", value: "technical" },
                    { label: "Billing Question", value: "billing" },
                    { label: "Feature Request", value: "feature" },
                    { label: "Bug Report", value: "bug" },
                  ]}
                  value={formData.issueType}
                  onChange={(value) => handleFormChange("issueType", value)}
                />

                <TextField
                  label="Description"
                  placeholder="Please provide detailed information about your issue..."
                  multiline={5}
                  value={formData.description}
                  onChange={(value) => handleFormChange("description", value)}
                />

                <InlineStack gap="200">
                  <Button
                    primary
                    onClick={handleSupportSubmit}
                    disabled={!formData.subject || !formData.issueType || !formData.description}
                  >
                    Submit Request
                  </Button>

                  {isFreePlan && (
                    <FeatureButton
                      feature="priority_support"
                      subscription={subscription}
                      variant="tertiary"
                      onClick={() => navigate("/app/billing")}
                    >
                      Upgrade for Priority Support
                    </FeatureButton>
                  )}
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 