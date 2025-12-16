import { useState, useCallback, useEffect, useRef } from "react";
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
  const { googleMapsApiKey, subscription, limitCheck, currentStoreCount } =
    useLoaderData();
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
    <s-page heading="Add Store">

      {/* Plan Limit Warning */}
      {!limitCheck.canAdd && (
        <s-banner heading="Cannot Add Store" tone="critical">
          <s-paragraph>{limitCheck.error}</s-paragraph>
          <s-button
            slot="secondary-actions"
            variant="secondary"
            onClick={() => {
              window.open("https://admin.shopify.com/charges/storetrail/pricing_plans", "_blank");
            }}
          >
            Upgrade Plan
          </s-button>
        </s-banner>
      )}

      {/* Near Limit Warning */}
      {limitCheck.canAdd && limitCheck.remaining <= 3 && (
        <s-banner heading="Approaching Store Limit" tone="warning">
          <s-paragraph>
            You have {limitCheck.remaining} store slot
            {limitCheck.remaining === 1 ? "" : "s"} remaining. Consider
            upgrading your plan.
          </s-paragraph>
          <s-button
            slot="secondary-actions"
            variant="secondary"
            onClick={() => {
              window.open("https://admin.shopify.com/charges/storetrail/pricing_plans", "_blank");
            }}
          >
            Upgrade Plan
          </s-button>
        </s-banner>
      )}

      {/* Store Slots Remaining Indicator - only show when not approaching limit */}
      {limitCheck.canAdd && limitCheck.remaining > 3 && (
        <>
        <s-box>
          <s-banner heading="Store Slots Remaining" tone="success">
            <s-text type="strong">
              {`You have ${limitCheck.remaining} store slot${limitCheck.remaining === 1 ? "" : "s"} remaining out of ${limitCheck.limit}.`}
            </s-text>
            <s-text color="subdued" type="small">
              Manage your locations efficiently. Upgrade your plan if you need
              more slots.
            </s-text>
          </s-banner>
        </s-box>
        <div style={{ marginBottom: "10px" }}></div>
        </>
      )}

      <s-section heading="Store Information" sectioned>
            <Form method="post">
              <s-grid gap="base">
                {/* Store Name and Link */}
                <s-grid gridTemplateColumns="repeat(2, 1fr)" gap="base">
                  <s-text-field
                    name="name"
                    label="Store Name"
                    value={formData.name}
                    onChange={(e) => handleChange("name")(e.target.value)}
                    required
                    aria-describedby="name-error"
                  />
                  <s-text-field
                    name="link"
                    label="Store URL"
                    value={formData.link}
                    onChange={(e) => handleChange("link")(e.target.value)}
                  />
                </s-grid>

                <s-divider />

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
                        Address <span style={{ color: "rgb(142, 11, 33)" }}>*</span>
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
                      <s-text-field
                        name="address2"
                        label="Address Line 2"
                        value={formData.address2}
                        onChange={(e) => handleChange("address2")(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <s-query-container>
                  <s-grid
                    gridTemplateColumns="@container (inline-size > 768px) 'repeat(4, 1fr)', 1fr"
                    gap="base"
                  >
                    <s-select
                      required
                      name="state"
                      label="State"
                      value={formData.state}
                      onChange={(e) => handleChange("state")(e.target.value)}
                      aria-required="true"
                      aria-describedby="state-error"
                    >
                      {stateOptions.map((option) => (
                        <s-option
                          key={option.value}
                          value={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </s-option>
                      ))}
                    </s-select>
                    <s-text-field
                      name="city"
                      label="City"
                      value={formData.city}
                      onChange={(e) => handleChange("city")(e.target.value)}
                      required
                      aria-describedby="city-error"
                    />
                    <s-text-field
                      name="zip"
                      type="number"
                      label="ZIP Code"
                      value={formData.zip}
                      onChange={(e) => handleChange("zip")(e.target.value)}
                      required
                      aria-describedby="zip-error"
                    />
                    <s-text-field
                      name="phone"
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        const formatted = formatPhone(val.replace(/\D/g, "")); // Remove non-numeric
                        handleChange("phone")(formatted);
                      }}
                      type="tel"
                      aria-describedby="phone-help"
                    />
                  </s-grid>
                </s-query-container>

                <s-divider />

                <s-grid gridTemplateColumns="repeat(2, 1fr)" gap="base">
                  <s-text-field
                    name="lat"
                    label="Latitude (optional)"
                    value={formData.lat}
                    onChange={(e) => handleChange("lat")(e.target.value)}
                    type="number"
                  />
                  <s-text-field
                    name="lng"
                    label="Longitude (optional)"
                    value={formData.lng}
                    onChange={(e) => handleChange("lng")(e.target.value)}
                    type="number"
                  />
                </s-grid>
                <s-text-area
                  name="notes"
                  label="Notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleChange("notes")(e.target.value)}
                  placeholder="Add extra notes or reminders here"
                />

                <s-divider />

                {/* Map full width below address */}
                {isClientState && (
                  <s-box paddingBlockEnd="base">
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
                          <s-spinner accessibilityLabel="Loading map" size="base" />
                        </div>
                      )}
                    </div>
                  </s-box>
                )}

                <s-stack direction="inline" justifyContent="end" gap="base">
                  <s-button
                    type="submit"
                    variant="primary"
                    accessibilityLabel="Save store information and create new store location"
                  >
                    Save Store Info
                  </s-button>
                </s-stack>
              </s-grid>
            </Form>
          </s-section>
          <s-box paddingBlockEnd="large-200" />
    </s-page>
  );
}
