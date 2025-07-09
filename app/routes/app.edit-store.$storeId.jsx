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
import { Form, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { stateOptions } from "../helper/options";
import { generateCoords } from "../helper/fetchCoords";

// Add Google Maps script to head
export const links = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
  },
];

// Load Google Maps script
const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_GEOCODING_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

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

  return { store };
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
      phone: data.phone || null,
    },
  });

  return { success: true, store: updatedStore };
};

export default function EditStore() {
  const action = useActionData();
  const { store } = useLoaderData();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (action?.success) {
      shopify.toast.show("Store updated successfully! 🎉");
      navigate("/app/view-stores");
    } else if (action?.error) {
      shopify.toast.show(action.error, { isError: true });
    }
  }, [action, shopify, navigate]);

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
    phone: store.phone || "",
    hours: "",
  });
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isAutocompleteLoaded, setIsAutocompleteLoaded] = useState(false);

  const handleChange = useCallback(
    (field) => (value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        const google = await loadGoogleMapsScript();
        
        // Initialize map
        const map = new google.maps.Map(mapRef.current, {
          center: { 
            lat: parseFloat(formData.lat) || 39.8283, 
            lng: parseFloat(formData.lng) || -98.5795 
          },
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        
        mapInstanceRef.current = map;
        
        // Add marker if coordinates exist
        if (formData.lat && formData.lng) {
          const marker = new google.maps.Marker({
            position: { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) },
            map: map,
            title: formData.name || "Store Location",
          });
          markerRef.current = marker;
        }
        
        setIsMapLoaded(true);
      } catch (error) {
        console.error("Failed to load Google Maps:", error);
      }
    };

    initMap();
  }, []);

  // Setup autocomplete
  useEffect(() => {
    const setupAutocomplete = async () => {
      if (!autocompleteRef.current || !window.google) return;
      
      try {
        const google = await loadGoogleMapsScript();
        
        const autocomplete = new google.maps.places.Autocomplete(autocompleteRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'us' },
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          if (place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            // Parse address components
            let streetNumber = '';
            let route = '';
            let city = '';
            let state = '';
            let zip = '';
            let address2 = '';
            
            place.address_components.forEach(component => {
              const types = component.types;
              
              if (types.includes('street_number')) {
                streetNumber = component.long_name;
              } else if (types.includes('route')) {
                route = component.long_name;
              } else if (types.includes('subpremise')) {
                address2 = component.long_name;
              } else if (types.includes('locality')) {
                city = component.long_name;
              } else if (types.includes('administrative_area_level_1')) {
                state = component.short_name;
              } else if (types.includes('postal_code')) {
                zip = component.long_name;
              }
            });
            
            const address = streetNumber && route ? `${streetNumber} ${route}` : place.formatted_address;
            
            setFormData(prev => ({
              ...prev,
              address: address,
              address2: address2,
              city: city,
              state: state,
              zip: zip,
              lat: lat.toString(),
              lng: lng.toString(),
            }));
            
            // Update map
            if (mapInstanceRef.current) {
              const newPosition = { lat, lng };
              mapInstanceRef.current.setCenter(newPosition);
              
              if (markerRef.current) {
                markerRef.current.setPosition(newPosition);
              } else {
                markerRef.current = new google.maps.Marker({
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
      }
    };

    setupAutocomplete();
  }, [formData.name]);

  // Debounced map update
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (mapInstanceRef.current && formData.lat && formData.lng) {
        const newPosition = { 
          lat: parseFloat(formData.lat), 
          lng: parseFloat(formData.lng) 
        };
        
        mapInstanceRef.current.setCenter(newPosition);
        
        if (markerRef.current) {
          markerRef.current.setPosition(newPosition);
        } else if (window.google) {
          markerRef.current = new window.google.maps.Marker({
            position: newPosition,
            map: mapInstanceRef.current,
            title: formData.name || "Store Location",
          });
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.lat, formData.lng, formData.name]);

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

  if (!store) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Spinner accessibilityLabel="Loading store..." size="large" />
      </div>
    );
  }

  return (
    <Page>
      <TitleBar title={`Edit Store: ${store.name}`} />
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Form method="post">
              <Box paddingBlockEnd="400">
                <Text variant="headingMd" as="h2">Store Details</Text>
              </Box>
              <FormLayout>
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
                <TextField
                  name="phone"
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(val) => {
                    const formatted = formatPhone(val);
                    handleChange("phone")(formatted);
                  }}
                  autoComplete="tel"
                />
                <Box paddingBlockStart="400">
                  <Text variant="headingMd" as="h2">Location</Text>
                </Box>
                {/* Address field full width */}
                <Box width="100%" marginBlockEnd="400">
                  <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#202223',
                  }}>
                    Address <span style={{ color: '#d82c0d' }}>*</span>
                  </label>
                  <input
                    ref={autocompleteRef}
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address")(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #c9cccf',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                    }}
                    placeholder="Start typing an address..."
                    autoComplete="off"
                  />
                </Box>
                {/* Map full width below address */}
                <Box width="100%" marginBlockEnd="400">
                  <div
                    ref={mapRef}
                    style={{
                      width: '100%',
                      height: '300px',
                      border: '1px solid #c9cccf',
                      borderRadius: '4px',
                      backgroundColor: '#f6f6f7',
                    }}
                  >
                    {!isMapLoaded && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: '#6d7175',
                      }}>
                        <Spinner size="small" />
                        <span style={{ marginLeft: '8px' }}>Loading map...</span>
                      </div>
                    )}
                  </div>
                </Box>
                {/* Hidden fields for form submission */}
                <input type="hidden" name="address2" value={formData.address2} />
                <input type="hidden" name="city" value={formData.city} />
                <input type="hidden" name="state" value={formData.state} />
                <input type="hidden" name="zip" value={formData.zip} />
                <input type="hidden" name="lat" value={formData.lat} />
                <input type="hidden" name="lng" value={formData.lng} />
                <Box paddingBlockStart="400">
                  <InlineStack align="end">
                    <ButtonGroup>
                      <Button
                        variant="secondary"
                        onClick={() => navigate("/app/view-stores")}
                      >
                        Cancel
                      </Button>
                      <Button submit variant="primary">
                        Update Store
                      </Button>
                    </ButtonGroup>
                  </InlineStack>
                </Box>
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 