import { useLoaderData, useNavigate, Form, useActionData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { useState, useEffect, useCallback } from "react";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  const contactEmail = process.env.SUPPORT_EMAIL || "help@storetrail.app";
  const contactUrl = process.env.CONTACT_URL || "https://storetrail.app/support";

  return {
    contactEmail,
    contactUrl,
    shop: session.shop,
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "support_request") {
    // Import server-side only - this prevents client-side bundling
    const { sendSupportRequestEmail } = await import("../helper/emailManager");
    
    const subject = formData.get("subject")?.trim();
    const issueType = formData.get("issueType")?.trim();
    const description = formData.get("description")?.trim();

    // Validate required fields
    if (!subject || !issueType || !description) {
      return { 
        success: false, 
        error: "Please fill in all required fields (Subject, Issue Type, and Description)" 
      };
    }

    try {
      // Send email via Email Manager
      await sendSupportRequestEmail({
        subject,
        issueType,
        description,
        shop: session.shop,
      });

      console.log('[Support Page] Support request email sent successfully for shop:', session.shop);
      return { success: true, message: "Support request submitted successfully!" };
    } catch (error) {
      console.error('[Support Page] Failed to send support request email:', error.message, 'Shop:', session.shop);
      return { success: false, error: "Failed to submit support request" };
    }
  }

  console.warn('[Support Page] Unknown action type:', action);
  return { success: false };
};

export default function SupportPage() {
  const { contactEmail, contactUrl, shop } = useLoaderData();
  const navigate = useNavigate();
  const actionData = useActionData();

  const [formData, setFormData] = useState({
    subject: "",
    issueType: "",
    description: "",
  });

  // Use the same pattern as add-store.jsx - curried handleChange function
  const handleChange = useCallback(
    (field) => (value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Handle form submission response
  useEffect(() => {
    if (!actionData) {
      return; // No action data yet
    }

    if (actionData?.success) {
      window.shopify.toast.show(actionData.message || "Support request submitted successfully! 🎉");
      // Clear form on successful submission
      setFormData({
        subject: "",
        issueType: "",
        description: "",
      });
    } else if (actionData?.error) {
      window.shopify.toast.show(actionData.error, { isError: true });
    }
  }, [actionData]);

  const handleDocumentationClick = (docType) => {
    // Just open the documentation - no tracking needed
  };

  const documentationLinks = [
    {
      label: "Installation Guide",
      href: "/docs/installation-guide",
      description: "Learn how to set up and install the store locator",
    },
    {
      label: "User Manual",
      href: "/docs/user-manual",
      description: "Complete guide to using all features",
    },
    {
      label: "Troubleshooting Guide",
      href: "/docs/troubleshooting-guide",
      description: "Common issues and solutions",
    },
    {
      label: "Frequently Asked Questions",
      href: "/docs/faq",
      description: "Answers to common questions",
    },
  ];

  const legalLinks = [
    {
      label: "Privacy & GDPR",
      href: "/app/gdpr",
      description: "Data privacy and GDPR compliance",
    },
    {
      label: "Privacy Policy",
      href: "/privacy-policy",
      description: "Our privacy policy",
      external: true,
    },
    {
      label: "Terms of Service",
      href: "/terms-of-service",
      description: "Terms and conditions",
      external: true,
    },
  ];

  return (
    <s-page heading="Support">
      <ui-title-bar title="Support" />
      
      <s-stack direction="block" gap="large-200" paddingBlockStart="large" paddingBlockEnd="large" paddingInlineStart="base" paddingInlineEnd="base">
        {/* Self-Help Resources Section */}
        <s-section heading="Self-Help Resources">
          <s-box padding="base" background="base" border="base" borderRadius="base">
            <s-grid gap="base">
              <s-paragraph color="subdued">
                Find answers to common questions and learn how to get the most out of your store locator.
              </s-paragraph>
              
              <s-grid gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap="base">
                {documentationLinks.map((link, index) => (
                  <s-box
                    key={index}
                    padding="base"
                    background="subdued"
                    borderRadius="base"
                    border="base"
                  >
                <s-stack direction="block" gap="small-200">
                  <s-heading>{link.label}</s-heading>
                  <s-paragraph color="subdued">
                    {link.description}
                  </s-paragraph>
                      <s-button
                        variant="tertiary"
                        onClick={() => {
                          handleDocumentationClick(link.label);
                          if (link.external) {
                            window.open(link.href, "_blank");
                          } else {
                            window.open(link.href, "_blank");
                          }
                        }}
                      >
                        View {link.label}
                      </s-button>
                    </s-stack>
                  </s-box>
                ))}
              </s-grid>
            </s-grid>
          </s-box>
        </s-section>

        {/* Support Request Form Section */}
        <s-section heading="Submit Support Request">
          <s-box padding="base" background="base" border="base" borderRadius="base">
            <s-stack direction="block" gap="base">
              <s-paragraph color="subdued">
                Can't find what you're looking for? Submit a support request and we'll help you out.
              </s-paragraph>

              <Form 
                method="post"
                onSubmit={(e) => {
                  // Validate before submitting
                  const subject = formData.subject?.trim();
                  const issueType = formData.issueType?.trim();
                  const description = formData.description?.trim();

                  if (!subject || !issueType || !description) {
                    e.preventDefault();
                    window.shopify.toast.show("Please fill in all required fields", { isError: true });
                    return false;
                  }
                }}
              >
                <input type="hidden" name="action" value="support_request" />
                <s-stack direction="block" gap="base">
                  <s-text-field
                    name="subject"
                    label="Subject"
                    placeholder="Brief description of your issue"
                    value={formData.subject}
                    onChange={(e) => handleChange("subject")(e.target.value)}
                    required
                  />

                  <s-select
                    name="issueType"
                    label="Issue Type"
                    value={formData.issueType}
                    onChange={(e) => handleChange("issueType")(e.target.value)}
                    placeholder="Select an issue type"
                    required
                  >
                    <s-option value="general">General Question</s-option>
                    <s-option value="technical">Technical Issue</s-option>
                    <s-option value="billing">Billing Question</s-option>
                    <s-option value="feature">Feature Request</s-option>
                    <s-option value="bug">Bug Report</s-option>
                  </s-select>

                  <s-text-area
                    name="description"
                    label="Description"
                    placeholder="Please provide detailed information about your issue..."
                    rows={5}
                    value={formData.description}
                    onChange={(e) => handleChange("description")(e.target.value)}
                    required
                  />

                  <s-stack direction="inline" justifyContent="end">
                    <s-button
                      type="submit"
                      variant="primary"
                    >
                      Submit Request
                    </s-button>
                  </s-stack>
                </s-stack>
              </Form>
            </s-stack>
          </s-box>
        </s-section>

        {/* Legal & Privacy Section */}
        <s-section heading="Legal & Privacy">
          <s-box padding="base" background="base" border="base" borderRadius="base">
            <s-grid gap="base">
              <s-paragraph color="subdued">
                Access legal documents and privacy information.
              </s-paragraph>
              
              <s-stack direction="block" gap="small-200">
                {legalLinks.map((link, index) => (
                  <s-box
                    key={index}
                    padding="small-300"
                    borderRadius="base"
                    background="subdued"
                  >
                    <s-grid gridTemplateColumns="1fr auto" gap="base" alignItems="center">
                  <s-stack direction="block" gap="small-100">
                    <s-text type="strong">{link.label}</s-text>
                    <s-text color="subdued">
                      {link.description}
                    </s-text>
                  </s-stack>
                      <s-button
                        variant="tertiary"
                        onClick={() => {
                          if (link.external) {
                            window.open(link.href, "_blank");
                          } else {
                            navigate(link.href);
                          }
                        }}
                      >
                        View
                      </s-button>
                    </s-grid>
                  </s-box>
                ))}
              </s-stack>
            </s-grid>
          </s-box>
        </s-section>

        {/* Footer Help */}
        <s-stack alignItems="center" paddingBlockStart="base">
          <s-text>
            Need more help? <s-link href={contactUrl} target="_blank">Contact us</s-link> or email us at <s-link href={`mailto:${contactEmail}`}>{contactEmail}</s-link>.
          </s-text>
        </s-stack>
      </s-stack>
    </s-page>
  );
}
