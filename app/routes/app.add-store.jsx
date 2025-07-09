import {
  Card,
  Layout,
  Page,
  FormLayout,
  TextField,
  Button,
  Divider,
  Select,
  Text,
  InlineStack,
  ButtonGroup,
  Box,
} from "@shopify/polaris";

import { useState, useCallback, useEffect } from "react";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Form, useActionData } from "@remix-run/react";
import { stateOptions } from "../helper/options";
import { generateCoords } from "../helper/fetchCoords";

const formatPhone = (value) => {
  const phone = parsePhoneNumberFromString(value, "US");
  return phone ? phone.formatNational() : value;
};

export const action = async ({ request }) => {
  const prisma = (await import("../db.server")).default;
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  if (!data.name || !data.address || !data.state || !data.city || !data.zip) {
    return { success: false, error: "Missing required fields" };
  }

  let latitude = data.lat;
  let longitude = data.lng;

  if (!latitude || !longitude) {
    const coords = await generateCoords(
      data.address,
      data.state,
      data.city,
      data.zip,
    );
    latitude = coords.latitude;
    longitude = coords.longitude;
  }

  const newStore = await prisma.store.create({
    data: {
      name: data.name,
      link: data.link || null,
      address: data.address,
      address2: data.address2,
      city: data.city,
      state: data.state,
      zip: data.zip,
      lat: latitude ? parseFloat(latitude) : null,
      lng: longitude ? parseFloat(longitude) : null,
      phone: data.phone || null,
    },
  });
  console.log("data is: ", newStore);
  return { success: true };
};

export default function AddStore() {
  const action = useActionData();
  const shopify = useAppBridge();

  useEffect(() => {
    if (action?.success) {
      shopify.toast.show("Store saved successfully! 🎉");
      setFormData({
        name: "",
        link: "",
        address: "",
        address2: "",
        city: "",
        state: "",
        zip: "",
        lat: "",
        lng: "",
        phone: "",
        hours: "",
      });
    } else if (action?.error) {
      shopify.toast.show(action.error, { isError: true });
    }
  }, [action, shopify]);

  const [formData, setFormData] = useState({
    name: "",
    link: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    lat: "",
    lng: "",
    phone: "",
    hours: "",
  });
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = useCallback(
    (field) => (value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const getFullAddress = () => {
    const { name, address, address2, city, state, zip, phone } = formData;

    const line0 = name ? `Store: ${name}` : "";
    const line1 = address;
    const line2 = address2;
    const line3 = [city, state, zip].filter(Boolean).join(", ");
    const line4 = "United States";
    const line5 = phone ? `Phone: ${phone}` : "";

    return [line0, line1, line2, line3, line4, line5]
      .filter(Boolean)
      .join("\n");
  };

  return (
    <Page>
      <TitleBar title="Store Location Form" />
      <Layout>
        <Layout.Section>
          <Card title="Store Information" sectioned>
            <Form method="post">
              <FormLayout>
                {/* Store Name and Link */}
                <FormLayout.Group>
                  <TextField
                    name="name"
                    label="Store Name"
                    value={formData.name}
                    onChange={handleChange("name")}
                  />
                  <TextField
                    name="link"
                    label="Store URL"
                    value={formData.link}
                    onChange={handleChange("link")}
                  />
                </FormLayout.Group>

                <Divider />

                {/* Address Group */}
                <FormLayout.Group>
                  <TextField
                    requiredFields
                    name="address"
                    label="Address Line 1"
                    value={formData.address}
                    onChange={handleChange("address")}
                  />
                  <TextField
                    name="address2"
                    label="Address Line 2"
                    value={formData.address2}
                    onChange={handleChange("address2")}
                  />
                </FormLayout.Group>

                <FormLayout.Group condensed>
                  <Select
                    requiredFields
                    name="state"
                    label="State"
                    options={stateOptions}
                    onChange={handleChange("state")}
                    value={formData.state}
                  />
                  <TextField
                    name="city"
                    label="City"
                    onChange={handleChange("city")}
                    value={formData.city}
                  />
                  <TextField
                    name="zip"
                    type="integer"
                    label="ZIP Code"
                    value={formData.zip}
                    onChange={handleChange("zip")}
                  />
                  <TextField
                    name="phone"
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(val) => {
                      const formatted = formatPhone(val.replace(/\D/g, "")); // Remove non-numeric
                      handleChange("phone")(formatted);
                    }}
                    type="tel"
                  />
                </FormLayout.Group>

                <Divider />

                <FormLayout.Group>
                  <TextField
                    name="lat"
                    label={
                      <>
                        Latitude{" "}
                        <Text as="span" color="subdued" variant="bodySm">
                          (optional)
                        </Text>
                      </>
                    }
                    value={formData.lat}
                    onChange={handleChange("lat")}
                    type="number"
                  />
                  <TextField
                    name="lng"
                    label={
                      <>
                        Longitude{" "}
                        <Text as="span" color="subdued" variant="bodySm">
                          (optional)
                        </Text>
                      </>
                    }
                    value={formData.lng}
                    onChange={handleChange("lng")}
                    type="number"
                  />
                </FormLayout.Group>

                <Divider />

                {showPreview && (
                  <Box background="bg-subdued" padding="3" borderRadius="2">
                    <Text as="pre" variant="bodyMd">
                      {getFullAddress()}
                    </Text>
                  </Box>
                )}

                <InlineStack align="end">
                  <ButtonGroup>
                    <Button
                      onClick={() => setShowPreview((prev) => !prev)}
                      plain
                    >
                      {showPreview ? "Hide Preview" : "Show Preview"}
                    </Button>
                    <Button submit variant="primary">
                      Save Store Info
                    </Button>
                  </ButtonGroup>
                </InlineStack>
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
