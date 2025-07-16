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
} from "@shopify/polaris";

import { useState, useCallback, useEffect, useRef } from "react";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { stateOptions } from "../helper/options";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
} from "@remix-run/react";
import { cleanupGoogleMapsInstances } from "../helper/googleMapsLoader";
import { loadGoogleMaps } from "../helper/loadGoogleMaps";

// Add Google Maps script to head
export const links = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
  },
];

const formatPhone = (value) => {
  const phone = parsePhoneNumberFromString(value, "US");
  return phone ? phone.formatNational() : value;
};

export const loader = async ({ params }) => {
  const prisma = (await import("../db.server")).default;
  const { storeId } = params;

  const store = await prisma.store.findUnique({
    where: { id: storeId },
  });

  if (!store) {
    throw new Response("Store not found", { status: 404 });
  }

  return {
    store,
    googleMapsApiKey: process.env.GOOGLE_MAPS_PUBLIC_KEY, // Expose only the public key
  };
};

export const action = async ({ request, params }) => {
  const prisma = (await import("../db.server")).default;
  const { storeId } = params;
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  if (!data.name || !data.address) {
    return { success: false, error: "Missing required fields" };
  }

  let latitude = data.lat;
  let longitude = data.lng;

  // if (!latitude || !longitude) {
  //   const coords = await generateCoords(
  //     data.address,
  //     data.state,
  //     data.city,
  //     data.zip,
  //   );
  //   latitude = coords.latitude;
  //   longitude = coords.longitude;
  // }

  const updatedStore = await prisma.store.update({
    where: { id: storeId },
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
      notes: data.notes,
      phone: data.phone || null,
    },
  });

  return { success: true, store: updatedStore };
};

// export default function EditStore() {
//   const action = useActionData();
//   const { store, googleMapsApiKey } = useLoaderData();
//   const shopify = useAppBridge();
//   const navigate = useNavigate();

//   // Refs for DOM elements and Google Maps instances
//   const mapRef = useRef(null);
//   const autocompleteRef = useRef(null);
//   const mapInstanceRef = useRef(null);
//   const markerRef = useRef(null);
//   const autocompleteInstanceRef = useRef(null);

//   // State for client-side rendering and loading
//   const [isClientState, setIsClientState] = useState(false);
//   const [isMapLoaded, setIsMapLoaded] = useState(false);
//   const [isAutocompleteLoaded, setIsAutocompleteLoaded] = useState(false);

//   // Ensure we're on the client
//   useEffect(() => {
//     setIsClientState(true);
//   }, []);

//   useEffect(() => {
//     if (action?.success) {
//       shopify.toast.show("Store updated successfully! 🎉");
//       navigate("/app/view-stores");
//     } else if (action?.error) {
//       shopify.toast.show(action.error, { isError: true });
//     }
//   }, [action, shopify, navigate]);

//   const [formData, setFormData] = useState({
//     name: store.name || "",
//     link: store.link || "",
//     address: store.address || "",
//     address2: store.address2 || "",
//     city: store.city || "",
//     state: store.state || "",
//     zip: store.zip || "",
//     lat: store.lat ? store.lat.toString() : "",
//     lng: store.lng ? store.lng.toString() : "",
//     phone: store.phone || "",
//     hours: "",
//   });

//   const handleChange = useCallback(
//     (field) => (value) => {
//       setFormData((prev) => ({ ...prev, [field]: value }));
//     },
//     [],
//   );

//   // Initialize Google Maps - only on client and when mapRef is available
//   useEffect(() => {
//     if (!isClientState || !mapRef.current || !googleMapsApiKey) return;

//     let isMounted = true;
//     let map = null;
//     let marker = null;

//     const initializeMap = async () => {
//       try {
//         const google = await loadGoogleMapsScript(googleMapsApiKey);
//         // await loadGoogleMaps(googleMapsApiKey);

//         if (!isMounted || !mapRef.current) return;

//         // Initialize map
//         map = new google.maps.Map(mapRef.current, {
//           center: {
//             lat: parseFloat(formData.lat) || 39.8283,
//             lng: parseFloat(formData.lng) || -98.5795,
//           },
//           zoom: 15,
//           mapTypeControl: false,
//           streetViewControl: false,
//           fullscreenControl: false,
//         });

//         mapInstanceRef.current = map;

//         // Add marker if coordinates exist
//         if (formData.lat && formData.lng) {
//           marker = new google.maps.Marker({
//             position: {
//               lat: parseFloat(formData.lat),
//               lng: parseFloat(formData.lng),
//             },
//             map: map,
//             title: formData.name || "Store Location",
//           });
//           markerRef.current = marker;
//         }

//         setIsMapLoaded(true);
//       } catch (error) {
//         console.error("Failed to initialize Google Maps:", error);
//         if (isMounted) {
//           setIsMapLoaded(true); // Set to true to hide loading spinner
//         }
//       }
//     };

//     initializeMap();

//     // Cleanup function
//     return () => {
//       isMounted = false;
//       cleanupGoogleMapsInstances(
//         mapInstanceRef.current,
//         markerRef.current,
//         autocompleteInstanceRef.current,
//       );

//       // Clear refs
//       mapInstanceRef.current = null;
//       markerRef.current = null;
//       autocompleteInstanceRef.current = null;
//     };
//   }, [
//     isClientState,
//     googleMapsApiKey,
//     formData.lat,
//     formData.lng,
//     formData.name,
//   ]);

//   // Setup autocomplete - only on client and when autocompleteRef is available
//   useEffect(() => {
//     if (!isClientState || !autocompleteRef.current || !googleMapsApiKey) return;

//     let isMounted = true;
//     let autocomplete = null;

//     const setupAutocomplete = async () => {
//       try {
//         const google = await loadGoogleMapsScript(googleMapsApiKey);

//         if (!isMounted || !autocompleteRef.current) return;

//         autocomplete = new google.maps.places.Autocomplete(
//           autocompleteRef.current,
//           {
//             types: ["address"],
//             componentRestrictions: { country: "us" },
//           },
//         );

//         autocompleteInstanceRef.current = autocomplete;

//         autocomplete.addListener("place_changed", () => {
//           if (!isMounted) return;

//           const place = autocomplete.getPlace();
//           if (place.geometry) {
//             const lat = place.geometry.location.lat();
//             const lng = place.geometry.location.lng();

//             let streetNumber = "";
//             let route = "";
//             let address2 = "";
//             let city = "";
//             let state = "";
//             let zip = "";

//             place.address_components.forEach((component) => {
//               const types = component.types;
//               if (types.includes("street_number")) {
//                 streetNumber = component.long_name;
//               } else if (types.includes("route")) {
//                 route = component.long_name;
//               } else if (types.includes("subpremise")) {
//                 address2 = component.long_name;
//               } else if (types.includes("locality")) {
//                 city = component.long_name;
//               } else if (types.includes("administrative_area_level_1")) {
//                 state = component.short_name;
//               } else if (types.includes("postal_code")) {
//                 zip = component.long_name;
//               }
//             });

//             const address =
//               streetNumber && route
//                 ? `${streetNumber} ${route}`
//                 : place.formatted_address;

//             setFormData((prev) => ({
//               ...prev,
//               address: address,
//               address2: address2,
//               city: city,
//               state: state,
//               zip: zip,
//               lat: lat.toString(),
//               lng: lng.toString(),
//             }));

//             // Update map and marker
//             if (mapInstanceRef.current && window.google) {
//               const newPosition = { lat, lng };
//               mapInstanceRef.current.setCenter(newPosition);

//               if (markerRef.current) {
//                 markerRef.current.setPosition(newPosition);
//               } else {
//                 markerRef.current = new window.google.maps.Marker({
//                   position: newPosition,
//                   map: mapInstanceRef.current,
//                   title: formData.name || "Store Location",
//                 });
//               }
//             }
//           }
//         });

//         setIsAutocompleteLoaded(true);
//       } catch (error) {
//         console.error("Failed to setup autocomplete:", error);
//         if (isMounted) {
//           setIsAutocompleteLoaded(true);
//         }
//       }
//     };

//     setupAutocomplete();

//     // Cleanup function
//     return () => {
//       isMounted = false;

//       if (
//         autocompleteInstanceRef.current &&
//         window.google &&
//         window.google.maps
//       ) {
//         window.google.maps.event.clearInstanceListeners(
//           autocompleteInstanceRef.current,
//         );
//         autocompleteInstanceRef.current = null;
//       }
//     };
//   }, [isClientState, googleMapsApiKey, formData.name]);

//   // Debounced map update - only update when coordinates change
//   useEffect(() => {
//     if (
//       !isClientState ||
//       !mapInstanceRef.current ||
//       !formData.lat ||
//       !formData.lng
//     )
//       return;

//     const timeoutId = setTimeout(() => {
//       if (!mapInstanceRef.current || !window.google) return;

//       const newPosition = {
//         lat: parseFloat(formData.lat),
//         lng: parseFloat(formData.lng),
//       };

//       mapInstanceRef.current.setCenter(newPosition);

//       if (markerRef.current) {
//         markerRef.current.setPosition(newPosition);
//       } else {
//         markerRef.current = new window.google.maps.Marker({
//           position: newPosition,
//           map: mapInstanceRef.current,
//           title: formData.name || "Store Location",
//         });
//       }
//     }, 500); // 500ms debounce

//     return () => clearTimeout(timeoutId);
//   }, [isClientState, formData.lat, formData.lng, formData.name]);

//   const getFullAddress = () => {
//     const { name, address, address2, city, state, zip, phone } = formData;

//     const line0 = name ? `Store: ${name}` : "";
//     const line1 = address;
//     const line2 = address2;
//     const line3 = [city, state, zip].filter(Boolean).join(", ");
//     const line4 = "United States";
//     const line5 = phone ? `Phone: ${phone}` : "";

//     return [line0, line1, line2, line3, line4, line5]
//       .filter(Boolean)
//       .join("\n");
//   };

//   if (!store) {
//     return (
//       <div style={{ padding: "20px", textAlign: "center" }}>
//         <Spinner accessibilityLabel="Loading store..." size="large" />
//       </div>
//     );
//   }

//   return (
//     <Page>
//       <TitleBar title={`Edit Store: ${store.name}`} />
//       <Layout>
//         <Layout.Section>
//           <Card sectioned>
//             <Form method="post">
//               <Box style={{ marginBottom: 16 }}>
//                 <Text variant="headingMd" as="h2">
//                   Store Details
//                 </Text>
//               </Box>
//               <FormLayout>
//                 <FormLayout.Group>
//                   <TextField
//                     name="name"
//                     label="Store Name"
//                     value={formData.name}
//                     onChange={handleChange("name")}
//                   />
//                   <TextField
//                     name="link"
//                     label="Store URL"
//                     value={formData.link}
//                     onChange={handleChange("link")}
//                   />
//                 </FormLayout.Group>
//                 <TextField
//                   name="phone"
//                   label="Phone Number"
//                   value={formData.phone}
//                   onChange={(val) => {
//                     const formatted = formatPhone(val);
//                     handleChange("phone")(formatted);
//                   }}
//                   autoComplete="tel"
//                 />
//                 <Box style={{ marginBottom: 16 }}>
//                   <Text variant="headingMd" as="h2">
//                     Location
//                   </Text>
//                 </Box>
//                 {isClientState && (
//                   <>
//                     {/* Address field full width */}
//                     <Box width="100%" style={{ marginBottom: 16 }}>
//                       <label
//                         style={{
//                           display: "block",
//                           marginBottom: "4px",
//                           fontSize: "14px",
//                           fontWeight: "500",
//                           color: "#202223",
//                         }}
//                       >
//                         Address <span style={{ color: "#d82c0d" }}>*</span>
//                       </label>
//                       <input
//                         ref={autocompleteRef}
//                         type="text"
//                         name="address"
//                         value={formData.address}
//                         onChange={(e) =>
//                           handleChange("address")(e.target.value)
//                         }
//                         style={{
//                           width: "100%",
//                           padding: "8px 12px",
//                           border: "1px solid #c9cccf",
//                           borderRadius: "4px",
//                           fontSize: "14px",
//                           fontFamily: "inherit",
//                         }}
//                         placeholder="Start typing an address..."
//                         autoComplete="off"
//                       />
//                     </Box>
//                     {/* Map full width below address */}
//                     <Box width="100%" style={{ marginBottom: 16 }}>
//                       <div style={{ position: "relative" }}>
//                         {/* The container Google Maps will mutate */}
//                         <div
//                           ref={mapRef}
//                           style={{
//                             width: "100%",
//                             height: "300px",
//                             border: "1px solid #c9cccf",
//                             borderRadius: "4px",
//                             backgroundColor: "#f6f6f7",
//                           }}
//                         />

//                         {/* Spinner absolutely positioned on top */}
//                         {!isMapLoaded && (
//                           <div
//                             style={{
//                               position: "absolute",
//                               top: "50%",
//                               left: "50%",
//                               transform: "translate(-50%, -50%)",
//                               zIndex: 1,
//                             }}
//                           >
//                             <Spinner size="small" />
//                           </div>
//                         )}
//                       </div>
//                       {/* <div
//                         ref={mapRef}
//                         style={{
//                           width: "100%",
//                           height: "300px",
//                           border: "1px solid #c9cccf",
//                           borderRadius: "4px",
//                           backgroundColor: "#f6f6f7",
//                         }}
//                       >
//                         {!isMapLoaded && (
//                           <div
//                             style={{
//                               display: "flex",
//                               alignItems: "center",
//                               justifyContent: "center",
//                               height: "100%",
//                               color: "#6d7175",
//                             }}
//                           >
//                             <Spinner size="small" />
//                             <span style={{ marginLeft: "8px" }}>
//                               Loading map...
//                             </span>
//                           </div>
//                         )}
//                       </div> */}
//                     </Box>
//                   </>
//                 )}
//                 {/* Hidden fields for form submission */}
//                 <input
//                   type="hidden"
//                   name="address2"
//                   value={formData.address2}
//                 />
//                 <input type="hidden" name="city" value={formData.city} />
//                 <input type="hidden" name="state" value={formData.state} />
//                 <input type="hidden" name="zip" value={formData.zip} />
//                 <input type="hidden" name="lat" value={formData.lat} />
//                 <input type="hidden" name="lng" value={formData.lng} />
//                 <Box style={{ marginBottom: 16 }}>
//                   <InlineStack align="end">
//                     <ButtonGroup>
//                       <Button
//                         variant="secondary"
//                         onClick={() => navigate("/app/view-stores")}
//                       >
//                         Cancel
//                       </Button>
//                       <Button submit variant="primary">
//                         Update Store
//                       </Button>
//                     </ButtonGroup>
//                   </InlineStack>
//                 </Box>
//               </FormLayout>
//             </Form>
//           </Card>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }

export default function AddStore() {
  const action = useActionData();
  const navigate = useNavigate();
  const { store, googleMapsApiKey } = useLoaderData();
  const [isClientState, setIsClientState] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isAutocompleteLoaded, setIsAutocompleteLoaded] = useState(false);

  const [formData, setFormData] = useState({
    name: store.name || "",
    link: store.link || "",
    address: store.address || "",
    address2: store.address2 || "",
    city: store.city || "",
    state: store.state || "",
    zip: store.zip || "",
    lat: store.lat ? store.lat.toString() : "",
    lng: store.lng ? store.lng.toString() : "",
    notes: store.notes || "",
    phone: store.phone || "",
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

  //Feedback when data is saved
  useEffect(() => {
    if (action?.success) {
      shopify.toast.show("Store saved successfully! 🎉");
    } else if (action?.error) {
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
    <Page
      title="Edit Store"
      secondaryActions={[
        {
          content: "Go Back",
          accessibilityLabel: "Go back to view stores page",
          onAction: () => navigate("/app/view-stores"),
        },
      ]}
    >
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
                    label={
                      <>
                        Store Name <span style={{ color: "#d82c0d" }}>*</span>
                      </>
                    }
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
                    <Button submit variant="primary">
                      Update
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
