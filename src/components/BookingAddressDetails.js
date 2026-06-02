import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  StandaloneSearchBox
} from "@react-google-maps/api";
import Select from "react-select";
import { useAlert } from "../context/AlertContext";
import Swal from "sweetalert2";

const libraries = ["places"];
const containerStyle = {
  width: "100%",
  height: "300px",
};

const BookingAddressDetails = ({
  formData,
  setFormData,
  handlereInputChange,
  states,
  cities,
  handleMapClick,
  fetchCities,
  serviceAvailable,
  // setSelectedSavedAddressID
}) => {
  const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token || "";
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const bytes = CryptoJS.AES.decrypt(user.id, secretKey);
  const decryptedCustId = bytes.toString(CryptoJS.enc.Utf8);
  const { showAlert } = useAlert();

  const [searchBox, setSearchBox] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const cityInputRef = useRef(null);
  const [locating, setLocating] = useState(false);
  const isSavedChosen = !!formData.selectedSavedAddressID;
  // When we auto-select a saved address on load, skip the next live reverse geocode
  const blockLiveGeocodeRef = useRef(false);
  const [addressesLoaded, setAddressesLoaded] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const cityOptions = cities
    .map((city) => ({
      value: city.CityID,
      label: city.CityName,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));



  // Function to reverse geocode and update form fields
  const reverseGeocode = async (lat, lng) => {
    // If user has a saved address chosen, do not override with live location
    if (isSavedChosen) return;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const addressComponents = data.results[0].address_components;
        

        const cityComp = addressComponents.find((c) =>
          c.types.includes("locality")
        );
        const stateComp = addressComponents.find((c) =>
          c.types.includes("administrative_area_level_1")
        );
        const postalCodeComp = addressComponents.find((c) =>
          c.types.includes("postal_code")
        );
        const streetComp = addressComponents.find((c) =>
          c.types.includes("route")
        );
        const areaComp = addressComponents.find((c) =>
          c.types.includes("sublocality") || c.types.includes("neighborhood")
        );
        const address = data.results[0].formatted_address;

        // Validate pincode against available service cities
        const detectedPincode = postalCodeComp ? postalCodeComp.long_name : "";
 
        if (detectedPincode) {
          const matchedCity = cities.find(
            (c) => Number(c.Pincode) === Number(detectedPincode) && c.IsActive
          );

          if (!matchedCity) {
            showAlert("Service is not available in your selected location.");
            setFormData((prev) => ({
              ...prev,
              StateID: "",
              CityID: "79",
              pincode: "",
              addressLine1: "",
              addressLine2: "",
              CityName: "",
            }));
            return;
          } else {
            // If matched, set State/City from matched city
            setFormData((prev) => ({
              ...prev,
              StateID: prev.StateID || matchedCity.StateID,
              CityID: matchedCity.CityID,
            }));
          }
        }

        setFormData((prev) => ({
          ...prev,
          CityName: prev.CityName?.trim() ? prev.CityName : (cityComp ? cityComp.long_name : prev.CityName),
          StateID: prev.StateID,
          pincode: prev.pincode?.trim() ? prev.pincode : (postalCodeComp ? postalCodeComp.long_name : prev.pincode),
          addressLine2: prev.addressLine2?.trim() ? prev.addressLine2 : (address ? address : prev.addressLine2),
        }));

        // Optionally, you can update StateID by matching with states list
        if (stateComp) {
          const matchedState = states.find(
            (s) =>
              s.StateName.replace(/\s+/g, "").toLowerCase() ===
              stateComp.long_name.replace(/\s+/g, "").toLowerCase()
          );
          if (matchedState) {
            setFormData((prev) => ({
              ...prev,
              StateID: prev.StateID || matchedState.StateID,
            }));
          }
        }
      }
    } catch (error) {
      // console.error("Error reverse geocoding:", error);
    }
  };

  // Do NOT auto-use current location on mount; wait for explicit user action
  // (prevents auto-filling without user entry)

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire({
        icon: "warning",
        title: "Geolocation not supported",
        text: "Your browser does not support geolocation.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setFormData((prev) => ({
          ...prev,
          mapLocation: {
            latitude: lat,
            longitude: lng,
          },
        }));

        await reverseGeocode(lat, lng);
        setLocating(false);
      },
      (error) => {
        // console.error("Error using current location:", error);
        setLocating(false);
        Swal.fire({
          icon: "error",
          title: "Location access error",
          text: "Unable to fetch your location. Please allow location access and try again.",
          confirmButtonColor: "#d33",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Reverse geocode when map location changes
  useEffect(() => {
    // Only attempt live geocode after addresses are fetched
    if (!addressesLoaded) return;
    // If a saved address is chosen or we intentionally set map from saved, skip live geocode
    if (isSavedChosen) return;
    if (blockLiveGeocodeRef.current) {
      blockLiveGeocodeRef.current = false;
      return;
    }
    if (formData.mapLocation.latitude && formData.mapLocation.longitude) {
      reverseGeocode(formData.mapLocation.latitude, formData.mapLocation.longitude);
    }
  }, [formData.mapLocation.latitude, formData.mapLocation.longitude, isSavedChosen, addressesLoaded]);

  // Fetch saved addresses
  useEffect(() => {

    const fetchAddresses = async () => {
      try {
        const response = await axios.get(
          `${BaseURL}CustomerAddresses/custid?custid=${decryptedCustId || ""}`,
          {
            headers: { Authorization: `Bearer ${user?.token}` },
          }
        );

        if(response.data.length > 0){
          const formatted = response.data.map((addr) => ({
              id: addr.AddressID,
              address1: addr.AddressLine1,
              address2: `${addr.AddressLine2 || ""}`,
              pincode: addr.Pincode,
              stateId: addr.StateID,
              stateName: addr.StateName,
              cityId: addr.CityID,
              CityName: addr.CityName,
              lat: addr.Latitude,
              lng: addr.Longitude,
              floorNumber: addr.FloorNumber || "",
              area: addr.Area || "",
            }))
            // sort DESC by id (assumed newest last by ID)
            .sort((a, b) => Number(b.id) - Number(a.id));
          setSavedAddresses(formatted);

          // Auto-select last saved address on load if none selected
          if (!formData.selectedSavedAddressID && formatted.length > 0) {
            const newest = formatted[0];
            setFormData((prev) => ({
              ...prev,
              StateID: newest.stateId,
              CityID: newest.cityId,
              pincode: newest.pincode,
              addressLine1: newest.address1,
              addressLine2: newest.address2,
              CityName: newest.CityName || "",
              selectedSavedAddressID: String(newest.id),
              mapLocation: {
                latitude: newest.lat,
                longitude: newest.lng,
              },
            }));
            // prevent the upcoming mapLocation effect from triggering live reverse geocode
            blockLiveGeocodeRef.current = true;
          }
          setAddressesLoaded(true);
        }






      } catch (error) {
        // console.error("Error fetching addresses:", error);
      }
    };

    fetchAddresses();
  }, [BaseURL, user?.token]);


  // Filter cities based on user input
  useEffect(() => {
    if (formData.CityName && formData.CityName.length > 0) {
      const filtered = cities.filter((city) =>
        city.CityName.toLowerCase().includes(formData.CityName.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowCitySuggestions(true);
    } else {
      setFilteredCities([]);
      setShowCitySuggestions(false);
    }
  }, [formData.CityName, cities]);

  // Handle city selection from dropdown
  const handleCitySelect = (city) => {
    setFormData((prev) => ({
      ...prev,
      CityName: city.CityName,
      CityID: city.CityID,
    }));
    setShowCitySuggestions(false);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target)) {
        setShowCitySuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const onPlacesChanged = () => {

    const places = searchBox.getPlaces();
    if (!places || places.length === 0) return;
    const place = places[0];
    const loc = place.geometry?.location;
    if (!loc) return;

    // Extract city and pincode from place's address components
    let cityName = "";
    let pincode = "";
    let stateIdKeep = formData.StateID;
    const comps = place.address_components || [];
    comps.forEach((c) => {
      if (c.types?.includes("locality")) cityName = c.long_name;
      if (c.types?.includes("postal_code")) pincode = c.long_name;
    });
    
    fetchCities(pincode);
    const filteredCities = cities.filter((c) => c.Pincode === pincode);
    if (filteredCities.length > 0) {
      // alert("filteredCities");
    } else {
      showAlert("Service is not available in your selected location.");
      setFormData((prev) => ({
        ...prev,
        StateID: "",
        CityID: "79",
        pincode: "",
        addressLine1: "",
        addressLine2: "",
        CityName: "",
      }));



      return;
    }

    // Update form and map
    // setFormData((prev) => ({
    //   ...prev,
    //   CityName: cityName || prev.CityName,
    //   pincode: pincode || prev.pincode,
    //   mapLocation: {
    //     latitude: loc.lat(),
    //     longitude: loc.lng(),
    //   },
    // }));

    // Prevent immediate live reverse geocode after we already set via search
    blockLiveGeocodeRef.current = true;
    handleMapClick(loc.lat(), loc.lng(), place.name || place.formatted_address || "");
  };

  // On blur of addressLine1, geocode and update map center
  const handleAddressBlur = async () => {
    alert();
    const addressText = (formData.addressLine2 || "").trim();
    if (!addressText) return;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressText)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      const first = data?.results?.[0];
      if (!first) return;
      const loc = first.geometry?.location;
      if (loc?.lat && loc?.lng) {
        handleMapClick(loc.lat, loc.lng);
      }
    } catch (e) {
      // console.error("Geocoding on address blur failed", e);
    }
  };

  // When user selects saved address → populate form
  const handleSavedAddressChange = (e) => {
    const selectedId = e.target.value;
   

    if (!selectedId){
      setFormData((prev) => ({
        ...prev,
        StateID: "",
        CityID: "",
        pincode: "",
        addressLine1: "",
        addressLine2: "",
        cityName: "",
        selectedSavedAddressID: "",
        mapLocation: {
          latitude: "",
          longitude: "",
        },
      }));
      return;
    };

    const addr = savedAddresses.find((a) => a.id.toString() === selectedId);
    if (addr) {
      setFormData((prev) => ({
        ...prev,
        StateID: addr.stateId,
        CityID: addr.cityId,
        pincode: addr.pincode,
        addressLine1: addr.address1,
        addressLine2: addr.address2,
        cityName: addr.cityName || "",
        selectedSavedAddressID: selectedId,
        mapLocation: {
          latitude: addr.lat,
          longitude: addr.lng,
        },
      }));

      handleMapClick(addr.lat, addr.lng);
    }
  };

  return (
    <div className="card shadow-sm p-4 mb-4">
      <h5 className="mb-3 text-primary fw-bold">📦 Address</h5>

      {/* Instruction Section */}
     

      {/* Map Search + Map */}
      {isLoaded && (
        <>
          <div className="position-relative">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{
                lat: formData.mapLocation.latitude
                  ? parseFloat(formData.mapLocation.latitude)
                  : 17.385044,
                lng: formData.mapLocation.longitude
                  ? parseFloat(formData.mapLocation.longitude)
                  : 78.486671,
              }}
            zoom={15}
            onClick={(e) => {
              if (isSavedChosen) return; // disable map edits when using saved address
              if (!e || !e.latLng) return;
              handleMapClick(e.latLng.lat(), e.latLng.lng());
            }}
          >
            <Marker
              position={{
                  lat: formData.mapLocation.latitude
                    ? parseFloat(formData.mapLocation.latitude)
                    : 17.385044,
                  lng: formData.mapLocation.longitude
                    ? parseFloat(formData.mapLocation.longitude)
                    : 78.486671,
                }}
            />
          </GoogleMap>
          {!isSavedChosen && (
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="btn btn-primary shadow position-absolute"
              style={{ top: 10, right: 10, borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Use my current location"
            >
              {locating ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : (
                <i className="fas fa-location-arrow"></i>
              )}
            </button>
          )}
          </div>

          {!isSavedChosen && (
            <div className="mb-3 mt-3">
              <StandaloneSearchBox
                onLoad={(ref) => setSearchBox(ref)}
                onPlacesChanged={onPlacesChanged}
              >
                <input
                  type="text"
                  placeholder="Search for location"
                  className="form-control"
                />
              </StandaloneSearchBox>
            </div>
          )}

        </>
      )}

      {/* Saved Address Dropdown */}
        {savedAddresses.length > 0 ? (
     <div className="mb-3 mt-2">
  <label className="form-label fw-semibold">Choose Saved Address</label>

    <select
      className="form-select"
      value={formData.selectedSavedAddressID}
      onChange={handleSavedAddressChange}
      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
    >
      <option value="">Select Saved Address</option>
      <option value="">New Address</option>
      {savedAddresses.map((addr) => {
        const fullAddress = `${addr.address2}`;
        const truncated = fullAddress.length > 30 ? fullAddress.slice(0, 30) + "..." : fullAddress;
        return (
          <option key={addr.id} value={addr.id} title={fullAddress}>
            {truncated}
          </option>
        );
      })}
    </select>

</div>
  ) : (
    ""
  )}

      {/* Form Fields */}
      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label fw-semibold">State <span className="text-danger">*</span></label>
          <select
            className="form-select"
            name="StateID"
            value={formData.StateID}
            onChange={handlereInputChange}
            readOnly={isSavedChosen}
          >
            <option value="">Select State</option>
            {states.map((state) => (
              <option key={state.StateID} value={state.StateID}>
                {state.StateName}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label fw-semibold">Pincode <span className="text-danger">*</span></label>
          <input
            type="text"
            name="pincode"
            className="form-control"
            placeholder="Pincode"
            value={formData.pincode}
            maxLength={6} // Restricts to 6 characters
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ""); // Allow only numbers
              if (value.length <= 6) {
                handlereInputChange({ target: { name: "pincode", value } });
              }
            }}
            readOnly={isSavedChosen}
          />
        </div>

        <div className="col-md-4 mb-3 ">
          <label className="form-label fw-semibold">City <span className="text-danger">*</span></label>
          <input
            type="text"
            name="CityName"
            className="form-control"
            placeholder="e.g., Banjara Hills, Jubilee Hills, HITEC City"
            value={formData.CityName}
            onChange={handlereInputChange}
            readOnly={isSavedChosen}
          />
          <input type="hidden" name="CityID" value={formData.CityID} />
        </div>

        
        <div className="col-md-12 mb-3">
          <label className="form-label fw-semibold">Floor Number / Area </label>
          <input
            type="text"
            name="addressLine1"
            className="form-control"
            placeholder="e.g., Ground Floor, 1st Floor, 2nd Floor"
            value={formData.addressLine1}
            onChange={handlereInputChange}
          />
        </div>
        <div className="col-md-12 mb-3">
          <label className="form-label fw-semibold">Address <span className="text-danger">*</span></label>
          <textarea
            className="form-control"
            name="addressLine2"
            placeholder="Full Address"
            rows={1}
            value={formData.addressLine2}
            onChange={handlereInputChange}
            onBlur={handleAddressBlur}
            readOnly={isSavedChosen}
            
          ></textarea>
        </div>
        
        
      </div>
    </div>
  );
};

export default BookingAddressDetails;
