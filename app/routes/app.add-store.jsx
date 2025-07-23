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
  Spinner,
  Banner,
} from "@shopify/polaris";

import { useState, useCallback, useEffect, useRef } from "react";
import { TitleBar } from "@shopify/app-bridge-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { stateOptions } from "../helper/options";
import { loadGoogleMaps } from "../helper/loadGoogleMaps";
import { cleanupGoogleMapsInstances } from "../helper/googleMapsLoader";
import { authenticate } from "../shopify.server";
import { accessibilityUtils } from "../helper/accessibility";
// import { checkStoreLimit } from "../helper/planLimits";

const formatPhone = (value) => {
  const phone = parsePhoneNumberFromString(value, "US");
  return phone ? phone.formatNational() : value;
};

export const loader = async ({ request }) => {
  console.log("[LOADER] Entered app.add-store loader");
  const { session, billing } = await authenticate.admin(request);
  console.log("[LOADER] Session shop:", session.shop);
  const prisma = (await import("../db.server")).default;
  const { checkStoreLimit } = await import("../helper/planLimits");

  // Check plan limits
  const { appSubscriptions } = await billing.check();
  const subscription = appSubscriptions?.[0];
  console.log("[LOADER] Subscription:", subscription);

  const currentStoreCount = await prisma.store.count({
    where: { shop: session.shop },
  });
  console.log("[LOADER] Current store count:", currentStoreCount);

  const limitCheck = checkStoreLimit(subscription, currentStoreCount);
  console.log("[LOADER] Limit check:", limitCheck);

  return {
    googleMapsApiKey: process.env.GOOGLE_MAPS_PUBLIC_KEY,
    subscription,
    limitCheck,
    currentStoreCount,
  };
};

export const action = async ({ request }) => {
  console.log("[ACTION] Entered app.add-store action");
  const { session, billing } = await authenticate.admin(request);
  console.log("[ACTION] Session shop:", session.shop);
  const { checkStoreLimit } = await import("../helper/planLimits");
  const prisma = (await import("../db.server")).default;

  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  console.log("[ACTION] Form data:", data);

  if (!data.name || !data.address || !data.state || !data.city || !data.zip) {
    console.log("[ACTION] Missing required fields");
    return { success: false, error: "Missing required fields" };
  }

  // Check plan limits
  const { appSubscriptions } = await billing.check();
  const subscription = appSubscriptions?.[0];
  console.log("[ACTION] Subscription:", subscription);

  const currentStoreCount = await prisma.store.count({
    where: { shop: session.shop },
  });
  console.log("[ACTION] Current store count:", currentStoreCount);

  const limitCheck = checkStoreLimit(subscription, currentStoreCount);
  console.log("[ACTION] Limit check:", limitCheck);

  if (!limitCheck.canAdd) {
    console.log("[ACTION] Cannot add store:", limitCheck.error);
    return {
      success: false,
      error: limitCheck.error,
    };
  }

  const newStore = await prisma.store.create({
    data: {
      shop: session.shop, // GDPR compliance: associate with current shop
      name: data.name,
      link: data.link || null,
      address: data.address,
      address2: data.address2,
      city: data.city,
      state: data.state,
      zip: data.zip,
      lat: data.lat ? parseFloat(data.lat) : null,
      lng: data.lng ? parseFloat(data.lng) : null,
      notes: data.notes || null,
      phone: data.phone || null,
    },
  });
  console.log("[ACTION] Store created:", newStore);
  return { success: true };
};

export default function AddStore() {
  const action = useActionData();
  const { googleMapsApiKey, subscription, limitCheck, currentStoreCount } = useLoaderData();
  const [isClientState, setIsClientState] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isAutocompleteLoaded, setIsAutocompleteLoaded] = useState(false);

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
    notes: "",
    phone: "",
    hours: "",
  });

  const handleChange = useCallback(
    (field) => (value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Refs for DOM elements and Google Maps instances
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteInstanceRef = useRef(null);

  // Ensure we're on the client
  useEffect(() => {
    setIsClientState(true);
  }, []);

  // Accessibility setup
  useEffect(() => {
    accessibilityUtils.announcePageChange("Add New Store Location");
  }, []);

  //Feedback when data is saved
  useEffect(() => {
    if (action?.success == true) {
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
        notes: "",
        phone: "",
        hours: "",
      });
    } else if (action?.success == false) {
      shopify.toast.show(action.error, { isError: true });
    }
  }, [action]);

  // Initializing Map Only Onceeeeeee
  useEffect(() => {
    if (!isClientState || !mapRef.current || !googleMapsApiKey) return;

    let isMounted = true;

    const initializeMap = async () => {
      await loadGoogleMaps(googleMapsApiKey);

      if (!isMounted || !mapRef.current) return;

      const center = {
        lat: parseFloat(formData.lat) || 39.8283,
        lng: parseFloat(formData.lng) || -98.5795,
      };

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      const marker = new window.google.maps.Marker({
        position: center,
        map,
        title: formData.name || "Store Location",
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      setIsMapLoaded(true);
    };

    initializeMap();

    return () => {
      isMounted = false;
      cleanupGoogleMapsInstances(
        mapInstanceRef.current,
        markerRef.current,
        autocompleteInstanceRef.current,
      );
      mapInstanceRef.current = null;
      markerRef.current = null;
      autocompleteInstanceRef.current = null;
    };
  }, [isClientState, googleMapsApiKey]);

  // Debounced map update - only update when coordinates change
  // wait half a second before updating the map
  useEffect(() => {
    if (
      !isClientState ||
      !mapInstanceRef.current ||
      !formData.lat ||
      !formData.lng
    )
      return;

    const timeoutId = setTimeout(() => {
      if (!mapInstanceRef.current || !window.google) return;

      const newPosition = {
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
      };

      mapInstanceRef.current.setCenter(newPosition);

      if (markerRef.current) {
        markerRef.current.setPosition(newPosition);
      } else {
        markerRef.current = new window.google.maps.Marker({
          position: newPosition,
          map: mapInstanceRef.current,
          title: formData.name || "Store Location",
        });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [isClientState, formData.lat, formData.lng, formData.name]);

  // Setup autocomplete - only on client and when autocompleteRef is available
  useEffect(() => {
    if (!isClientState || !autocompleteRef.current || !googleMapsApiKey) return;

    let isMounted = true;
    let autocomplete = null;

    const setupAutocomplete = async () => {
      try {
        await loadGoogleMaps(googleMapsApiKey);

        if (!isMounted || !autocompleteRef.current) return;

        autocomplete = new window.google.maps.places.Autocomplete(
          autocompleteRef.current,
          {
            types: ["address"],
            componentRestrictions: { country: "us" },
          },
        );

        autocompleteInstanceRef.current = autocomplete;

        autocomplete.addListener("place_changed", () => {
          if (!isMounted) return;

          const place = autocomplete.getPlace();
          if (place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            let streetNumber = "";
            let route = "";
            let address2 = "";
            let city = "";
            let state = "";
            let zip = "";

            place.address_components.forEach((component) => {
              const types = component.types;
              if (types.includes("street_number")) {
                streetNumber = component.long_name;
              } else if (types.includes("route")) {
                route = component.long_name;
              } else if (types.includes("subpremise")) {
                address2 = component.long_name;
              } else if (types.includes("locality")) {
                city = component.long_name;
              } else if (types.includes("administrative_area_level_1")) {
                state = component.short_name;
              } else if (types.includes("postal_code")) {
                zip = component.long_name;
              }
            });

            const address =
              streetNumber && route
                ? `${streetNumber} ${route}`
                : place.formatted_address;

            setFormData((prev) => ({
              ...prev,
              address: address,
              address2: address2,
              city: city,
              state: state,
              zip: zip,
              lat: lat.toString(),
              lng: lng.toString(),
            }));

            // Update map and marker
            if (mapInstanceRef.current && window.google) {
              const newPosition = { lat, lng };
              mapInstanceRef.current.setCenter(newPosition);

              if (markerRef.current) {
                markerRef.current.setPosition(newPosition);
              } else {
                markerRef.current = new window.google.maps.Marker({
                  position: newPosition,
                  map: mapInstanceRef.current,
                  title: formData.name || "Store Location",
                });
              }
            }
          }
        });

        setIsAutocompleteLoaded(true);
      } catch (error) {
        console.error("Failed to setup autocomplete:", error);
        if (isMounted) {
          setIsAutocompleteLoaded(true);
        }
      }
    };

    setupAutocomplete();

    // Cleanup function
    return () => {
      isMounted = false;

      if (
        autocompleteInstanceRef.current &&
        window.google &&
        window.google.maps
      ) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteInstanceRef.current,
        );
        autocompleteInstanceRef.current = null;
      }
    };
  }, [isClientState, googleMapsApiKey, formData.name]);

  return (
    <Page title="Add Store">
      <TitleBar title="Store Location Form" />
      
      {/* Plan Limit Warning */}
      {!limitCheck.canAdd && (
        <Banner
          title="Cannot Add Store"
          tone="critical"
          // action={
          // { content: "Upgrade Plan", 
          //     url: "https://admin.shopify.com/charges/store-locator-176/pricing_plans", 
          //     external:true }  
          //   }
        >
          <p>{limitCheck.error}</p>
          <p>
            <a
              href="https://admin.shopify.com/charges/store-locator-176/pricing_plans"
              target="_blank"
              rel="noopener noreferrer"
            >
              Upgrade Plan
            </a>
          </p>
        </Banner>
      )}

      {/* Near Limit Warning */}
      {limitCheck.canAdd && limitCheck.remaining <= 3 && (
        <Banner
          title="Approaching Store Limit"
          tone="warning"
        >
          <p>
            You have {limitCheck.remaining} store slot{limitCheck.remaining === 1 ? "" : "s"} remaining. Consider upgrading your plan.
          </p>
          <p>
            <a
              href="https://admin.shopify.com/charges/store-locator-176/pricing_plans"
              target="_blank"
              rel="noopener noreferrer"
            >
              Upgrade Plan
            </a>
          </p>
        </Banner>
      )}

      {/* Store Slots Remaining Indicator */}
      {limitCheck.canAdd && (
        <Box marginBlockEnd="4">
          <Banner tone="success">
            <Text as="span" fontWeight="semibold">
              {`You have ${limitCheck.remaining} store slot${limitCheck.remaining === 1 ? '' : 's'} remaining out of ${limitCheck.limit}.`}
            </Text>
            <div>
              <Text as="span" tone="subdued" variant="bodySm">
                Manage your locations efficiently. Upgrade your plan if you need more slots.
              </Text>
            </div>
          </Banner>
        </Box>
      )}

      <Layout>
        <Layout.Section>
          <Card title="Store Information" sectioned>
            <Form method="post">
              <FormLayout>
                {/* Store Name and Link */}
                <FormLayout.Group>
                  <TextField
                    name="name"
                    label={
                      <>
                        Store Name <span style={{ color: "#d82c0d" }}>*</span>
                      </>
                    }
                    value={formData.name}
                    onChange={handleChange("name")}
                    aria-required="true"
                    aria-describedby="name-error"
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
                {isClientState && (
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "4px",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#202223",
                        }}
                      >
                        Address <span style={{ color: "#d82c0d" }}>*</span>
                      </label>
                      <input
                        ref={autocompleteRef}
                        type="text"
                        name="address"
                        id="address-input"
                        value={formData.address}
                        onChange={(e) =>
                          handleChange("address")(e.target.value)
                        }
                        style={{
                          width: "100%",
                          border: "1px solid #929292ff",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontFamily: "inherit",
                          padding: "6px 12px",
                        }}
                        placeholder="Start typing an address..."
                        autoComplete="off"
                        aria-required="true"
                        aria-describedby="address-error"
                        aria-label="Store address - required field"
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <TextField
                        name="address2"
                        autoSize
                        label="Address Line 2"
                        value={formData.address2}
                        onChange={handleChange("address2")}
                      />
                    </div>
                  </div>
                )}

                <FormLayout.Group condensed>
                  <Select
                    requiredFields
                    name="state"
                    label={
                      <>
                        State <span style={{ color: "#d82c0d" }}>*</span>
                      </>
                    }
                    options={stateOptions}
                    onChange={handleChange("state")}
                    value={formData.state}
                    aria-required="true"
                    aria-describedby="state-error"
                  />
                  <TextField
                    name="city"
                    label={
                      <>
                        City <span style={{ color: "#d82c0d" }}>*</span>
                      </>
                    }
                    onChange={handleChange("city")}
                    value={formData.city}
                    aria-required="true"
                    aria-describedby="city-error"
                  />
                  <TextField
                    name="zip"
                    type="integer"
                    label={
                      <>
                        ZIP Code <span style={{ color: "#d82c0d" }}>*</span>
                      </>
                    }
                    value={formData.zip}
                    onChange={handleChange("zip")}
                    aria-required="true"
                    aria-describedby="zip-error"
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
                    aria-describedby="phone-help"
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
                <TextField
                  name="notes"
                  label="Notes"
                  multiline={3}
                  value={formData.notes}
                  onChange={handleChange("notes")}
                  autoComplete="off"
                  placeholder="Add extra notes or reminders here"
                />

                <Divider />

                {/* Map full width below address */}
                {isClientState && (
                  <Box width="100%" style={{ marginBottom: 16 }}>
                    <div style={{ position: "relative" }}>
                      {/* The container Google Maps will mutate */}
                      <div
                        ref={mapRef}
                        style={{
                          width: "100%",
                          height: "300px",
                          border: "1px solid #c9cccf",
                          borderRadius: "4px",
                          backgroundColor: "#f6f6f7",
                        }}
                      />

                      {/* Spinner absolutely positioned on top */}
                      {!isMapLoaded && (
                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            zIndex: 1,
                          }}
                        >
                          <Spinner size="small" />
                        </div>
                      )}
                    </div>
                  </Box>
                )}

                <InlineStack align="end">
                  <ButtonGroup>
                    <Button
                      submit
                      variant="primary"
                      aria-label="Save store information and create new store location"
                    >
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
