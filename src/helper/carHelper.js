import axios from "axios";
import CryptoJS from "crypto-js";


const getDecryptedCustAuth = (secretKey) => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.token || !user?.id) return { custId: null, token: null };
    const bytes = CryptoJS.AES.decrypt(user.id, secretKey);
    const custId = bytes.toString(CryptoJS.enc.Utf8);
    return { custId: custId || null, token: user.token };
  } catch (_) {
    return { custId: null, token: null };
  }
};

const buildCarDetailsFromVehicle = (v, imageBaseURL = "") => {
  const prefix = imageBaseURL.endsWith("/") ? imageBaseURL : `${imageBaseURL}/`;

  const resolveImg = (path) => {
    if (!path) return undefined;
    const clean = path.startsWith("/") ? path.slice(1) : path;
    return `${prefix}${clean}`;
  };

  const registrationNumber = (
    v.VehicleNumber || v.VehicleRegNo || v.registrationNumber || ""
  ).toString().toUpperCase();

  const vehicleID = Number(v.VehicleID || v.vehicleID || v.id) || 0;

  return {
    // IDs
    id: vehicleID,
    VehicleID: vehicleID,
    vehicleID,

    // Registration
    vehicleNumber: registrationNumber,
    VehicleNumber: registrationNumber,
    registrationNumber,

    // Brand
    brandID: Number(v.BrandID || v.brandID) || 0,
    brand: {
      id: Number(v.BrandID || v.brandID) || 0,
      name: v.BrandName || "",
      logo: resolveImg(v.BrandLogo),
    },

    // Model
    modelID: Number(v.ModelID || v.modelID) || 0,
    model: {
      id: Number(v.ModelID || v.modelID) || 0,
      name: v.ModelName || "",
      logo: resolveImg(v.VehicleImage),
    },

    // Fuel
    fuelTypeID: Number(v.FuelTypeID || v.fuelTypeID) || 0,
    fuel: {
      id: Number(v.FuelTypeID || v.fuelTypeID) || 0,
      name: v.FuelTypeName || "",
    },

    // Details
    yearOfPurchase: Number(v.YearOfPurchase || v.yearOfPurchase) || 0,
    YearOfPurchase: Number(v.YearOfPurchase || v.yearOfPurchase) || 0,
    kilometersDriven: Number(v.KilometersDriven || v.kilometersDriven || v.kilometerDriven) || 0,
    KilometersDriven: Number(v.KilometersDriven || v.kilometersDriven || v.kilometerDriven) || 0,
    kilometerDriven: v.KilometersDriven || v.kilometersDriven || v.kilometerDriven || "",
    engineType: v.EngineType || v.engineType || "",
    transmissionType: v.TransmissionType || v.transmissionType || "",
  };
};

export const getSelectedCarPayload = (carOverride) => {
  try {
    // Accept a direct car object (from React state) so callers don't have to
    // re-read localStorage after the user switches cars via CarSelectorSection.
    const selectedCar =
      carOverride ||
      JSON.parse(localStorage.getItem("selectedCarDetails") || "null");

    const resolvedRegistrationNumber = selectedCar
      ? (
          selectedCar.vehicleNumber ||
          selectedCar.VehicleNumber ||
          selectedCar.registrationNumber ||
          selectedCar.VehicleRegNo ||
          ""
        )
      : "";

    const resolvedYearOfPurchase =
      Number(selectedCar?.yearOfPurchase || selectedCar?.YearOfPurchase) || 0;

    const resolvedKmDriven =
      Number(
        selectedCar?.kilometersDriven ||
        selectedCar?.KilometersDriven ||
        selectedCar?.kilometerDriven
      ) || 0;

    return {
      registrationNumber: resolvedRegistrationNumber,
      vehicleNumber: resolvedRegistrationNumber,
      VehicleNumber: resolvedRegistrationNumber,
      vehicleID:
        selectedCar
          ? Number(selectedCar.id || selectedCar.VehicleID || selectedCar.vehicleID) || 0
          : 0,
      brandID:
        Number(
          selectedCar?.brandID ||
          selectedCar?.BrandID ||
          selectedCar?.brand?.id
        ) || 0,
      modelID:
        Number(
          selectedCar?.modelID ||
          selectedCar?.ModelID ||
          selectedCar?.model?.id
        ) || 0,
      fuelTypeID:
        Number(
          selectedCar?.fuelTypeID ||
          selectedCar?.FuelTypeID ||
          selectedCar?.fuel?.id
        ) || 0,
      kmDriven: resolvedKmDriven,
      kilometersDriven: resolvedKmDriven,
      yearOfPurchase: resolvedYearOfPurchase,
      YearOfPurchase: resolvedYearOfPurchase,
    };
  } catch (error) {
    console.error("[carHelper] Error reading selectedCarDetails:", error);
    return {
      registrationNumber: "",
      vehicleNumber: "",
      VehicleNumber: "",
      vehicleID: 0,
      brandID: 0,
      modelID: 0,
      fuelTypeID: 0,
      kmDriven: 0,
      kilometersDriven: 0,
      yearOfPurchase: 0,
      YearOfPurchase: 0,
    };
  }
};

/**
 * Fetch the customer's saved vehicles from the API.
 * Returns a raw array of vehicle objects from the CustomerVehicles API.
 *
 * @param {string} baseUrl
 * @param {string} secretKey
 * @returns {Promise<Array>}
 */
export const fetchSavedVehicles = async (baseUrl, secretKey) => {
  const { custId, token } = getDecryptedCustAuth(secretKey);
  if (!custId || !token) return [];
  try {
    const res = await axios.get(
      `${baseUrl}CustomerVehicles/CustId?CustId=${encodeURIComponent(custId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.data)
      ? res.data.data
      : [];
  } catch (err) {
    console.warn("[carHelper] fetchSavedVehicles failed:", err?.message);
    return [];
  }
};

/**
 * Auto-select the customer's first saved vehicle when:
 *   • The user is logged in, AND
 *   • No car has been explicitly selected yet (localStorage.selectedCarDetails is absent / null).
 *
 * After setting the car it dispatches `selectedCarUpdated` so HeaderOne refreshes
 * the car chip without requiring a page reload.
 *
 * @param {string} baseUrl   - e.g. process.env.REACT_APP_CARBUDDY_BASE_URL
 * @param {string} secretKey - e.g. process.env.REACT_APP_ENCRYPT_SECRET_KEY
 * @param {string} [imageBaseURL] - e.g. process.env.REACT_APP_CARBUDDY_IMAGE_URL (optional, for logos)
 * @returns {Promise<object|null>} The car details object that was saved, or null if nothing was set.
 */
export const autoSelectCarIfNeeded = async (
  baseUrl,
  secretKey,
  imageBaseURL = ""
) => {
  // 1. Already have a selected car → nothing to do
  try {
    const existing = JSON.parse(localStorage.getItem("selectedCarDetails") || "null");
    if (existing && (existing.vehicleID || existing.VehicleID || existing.brandID)) {
      return existing; // already set
    }
  } catch (_) { /* corrupt JSON — treat as absent */ }

  // 2. User must be logged in
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user?.token) return null;

  // 3. Decrypt customer ID
  const { custId, token } = getDecryptedCustAuth(secretKey);
  if (!custId || !token) return null;

  // 4. Fetch saved vehicles
  try {
    const res = await axios.get(
      `${baseUrl}CustomerVehicles/CustId?CustId=${encodeURIComponent(custId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const list = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.data)
      ? res.data.data
      : [];

    if (!list.length) return null;

    // 5. Prefer a primary/default vehicle; fall back to first in list
    const primary = list.find((v) => v.IsPrimary || v.isPrimary) || list[0];

    // 6. Build normalised object and persist
    const carDetails = buildCarDetailsFromVehicle(primary, imageBaseURL);
    localStorage.setItem("selectedCarDetails", JSON.stringify(carDetails));

    // 7. Tell HeaderOne (and any other listeners) to refresh the car chip
    window.dispatchEvent(new CustomEvent("selectedCarUpdated"));

    console.log("[carHelper] Auto-selected car:", carDetails.vehicleNumber || carDetails.brand?.name);
    return carDetails;
  } catch (err) {
    console.warn("[carHelper] autoSelectCarIfNeeded failed (non-blocking):", err?.message);
    return null;
  }
};