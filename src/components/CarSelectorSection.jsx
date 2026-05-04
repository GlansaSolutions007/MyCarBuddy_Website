import React, { useState } from "react";
import ChooseCarModal from "./ChooseCarModalGridLayout";
import { FaCar } from "react-icons/fa";
import "./CarSelectorSection.css";

const CarSelectorSection = ({
  savedVehicles = [],
  selectedCar = null,
  onCarChange,
  imageBaseURL = "",
  error = "",
  variant = "ip",
}) => {
  const [showChooseCarModal, setShowChooseCarModal] = useState(false);

  const p = variant; // prefix for CSS class names: "ip" or "bsm"

  // Build display label for a raw vehicle row
  const vehicleLabel = (v) => {
    const brand = v.BrandName || v.brandName || "";
    const model = v.ModelName || v.modelName || "";
    const reg = (v.VehicleNumber || v.VehicleRegNo || "").toUpperCase();
    return [brand, model].filter(Boolean).join(" ") + (reg ? ` – ${reg}` : "");
  };

  // Match a raw API vehicle row against the currently-selected car
  const isVehicleSelected = (v) => {
    if (!selectedCar) return false;
    const vid = Number(v.VehicleID || v.vehicleID);
    const selId = Number(
      selectedCar.id || selectedCar.VehicleID || selectedCar.vehicleID
    );
    if (vid && selId && vid === selId) return true;
    // Fall back to reg number comparison
    const vReg = (v.VehicleNumber || v.VehicleRegNo || "").toUpperCase();
    const sReg = (
      selectedCar.vehicleNumber ||
      selectedCar.VehicleNumber ||
      selectedCar.registrationNumber ||
      ""
    ).toUpperCase();
    return vReg && sReg && vReg === sReg;
  };

  const resolveImg = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const prefix = imageBaseURL.endsWith("/") ? imageBaseURL : `${imageBaseURL}/`;
    const clean = path.startsWith("/") ? path.slice(1) : path;
    return `${prefix}${clean}`;
  };

  // Build a normalised selectedCarDetails object from a raw API row and
  // persist + notify exactly like ChooseCarModal does.
  const selectVehicle = (v) => {
    const registrationNumber = (
      v.VehicleNumber || v.VehicleRegNo || ""
    )
      .toString()
      .toUpperCase();

    const vehicleID = Number(v.VehicleID || v.vehicleID || 0);

    const carDetails = {
      id: vehicleID,
      VehicleID: vehicleID,
      vehicleID,
      vehicleNumber: registrationNumber,
      VehicleNumber: registrationNumber,
      registrationNumber,
      brandID: Number(v.BrandID || v.brandID) || 0,
      brand: {
        id: Number(v.BrandID || v.brandID) || 0,
        name: v.BrandName || v.brandName || "",
        logo: resolveImg(v.BrandLogo),
      },
      modelID: Number(v.ModelID || v.modelID) || 0,
      model: {
        id: Number(v.ModelID || v.modelID) || 0,
        name: v.ModelName || v.modelName || "",
        logo: resolveImg(v.VehicleImage),
      },
      fuelTypeID: Number(v.FuelTypeID || v.fuelTypeID) || 0,
      fuel: {
        id: Number(v.FuelTypeID || v.fuelTypeID) || 0,
        name: v.FuelTypeName || v.fuelTypeName || "",
      },
      yearOfPurchase: Number(v.YearOfPurchase || v.yearOfPurchase) || 0,
      YearOfPurchase: Number(v.YearOfPurchase || v.yearOfPurchase) || 0,
      kilometersDriven:
        Number(v.KilometersDriven || v.kilometersDriven || v.kilometerDriven) ||
        0,
      KilometersDriven:
        Number(v.KilometersDriven || v.kilometersDriven || v.kilometerDriven) ||
        0,
      kilometerDriven:
        v.KilometersDriven || v.kilometersDriven || v.kilometerDriven || "",
      engineType: v.EngineType || v.engineType || "",
      transmissionType: v.TransmissionType || v.transmissionType || "",
    };

    try {
      localStorage.setItem("selectedCarDetails", JSON.stringify(carDetails));
      window.dispatchEvent(new CustomEvent("selectedCarUpdated"));
    } catch (_) {}

    if (onCarChange) onCarChange(carDetails);
  };

  // Called when ChooseCarModal saves a brand-new car
  const handleCarSaved = (carDetails) => {
    try {
      localStorage.setItem("selectedCarDetails", JSON.stringify(carDetails));
      window.dispatchEvent(new CustomEvent("selectedCarUpdated"));
    } catch (_) {}
    if (onCarChange) onCarChange(carDetails);
    setShowChooseCarModal(false);
  };

  // Currently selected display label (for the section sub-heading)
  const selectedLabel = selectedCar
    ? [
        selectedCar.brand?.name,
        selectedCar.model?.name,
        (selectedCar.vehicleNumber || selectedCar.VehicleNumber || selectedCar.registrationNumber || "").toUpperCase(),
      ]
        .filter(Boolean)
        .join(" – ")
    : null;

  return (
    <>
      <div className={`${p}-car-selector`}>
        {/* Section header */}
        <div className={`${p}-car-selector__label`}>
          <span>
            🚗 Select Car for Service{" "}
            <span style={{ color: "#ef4444" }}>*</span>
          </span>
          {variant === "ip" && (
            <span className={`${p}-address-selector__label-line`} />
          )}
          <span
            style={{
              fontSize: "0.72rem",
              color: "#6b7280",
              fontWeight: variant === "ip" ? 500 : 400,
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            {selectedLabel
              ? `Currently: ${selectedLabel}`
              : "Choose the car you want serviced"}
          </span>
        </div>

        {/* Error banner */}
        {error && (
          <div className={`${p}-address-error-banner`}>
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Car cards */}
        <div className={`${p}-address-list`}>
          {savedVehicles.map((v) => {
            const vid = v.VehicleID || v.vehicleID;
            const selected = isVehicleSelected(v);
            const modelImg = resolveImg(v.VehicleImage);
            const brandImg = resolveImg(v.BrandLogo);
            const fuel = v.FuelTypeName || v.fuelTypeName || "";
            const reg = (v.VehicleNumber || v.VehicleRegNo || "").toUpperCase();

            return (
              <button
                key={vid}
                type="button"
                className={`${p}-address-card ${selected ? `${p}-address-card--selected` : ""}`}
                onClick={() => selectVehicle(v)}
              >
                <span className={`${p}-address-card__left`}>
                  {/* Car image / icon */}
                  <span className={`${p}-address-card__icon`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {modelImg ? (
                      <img
                        src={modelImg}
                        alt={v.ModelName || "Car"}
                        style={{ width: 36, height: 36, objectFit: "contain" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : brandImg ? (
                      <img
                        src={brandImg}
                        alt={v.BrandName || "Brand"}
                        style={{ width: 32, height: 32, objectFit: "contain" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <FaCar size={22} color="#6b7280" />
                    )}
                  </span>

                  <span className={`${p}-address-card__body`}>
                    <span className={`${p}-address-card__title`}>
                      {[v.BrandName || v.brandName, v.ModelName || v.modelName]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                    <span className={`${p}-address-card__sub`}>
                      {[reg, fuel].filter(Boolean).join(" · ")}
                    </span>
                    {/* {(v.IsPrimary || v.isPrimary) && (
                      <span className={`${p}-address-card__badge`}>
                        Primary
                      </span>
                    )} */}
                  </span>
                </span>

                {selected && (
                  <span className={`${p}-address-card__tick`}>✓</span>
                )}
              </button>
            );
          })}

          {/* Add New Car card */}
          <button
            type="button"
            className={`${p}-address-card ${p}-address-card--other`}
            onClick={() => setShowChooseCarModal(true)}
          >
            <span className={`${p}-address-card__left`}>
              <span className={`${p}-address-card__icon`}>➕</span>
              <span className={`${p}-address-card__body`}>
                <span className={`${p}-address-card__title`}>Add New Car</span>
                <span className={`${p}-address-card__sub`}>
                  Register a different vehicle
                </span>
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* ChooseCarModal for adding a new car */}
      {showChooseCarModal && (
        <ChooseCarModal
          isVisible={showChooseCarModal}
          onClose={() => setShowChooseCarModal(false)}
          onCarSaved={handleCarSaved}
        />
      )}
    </>
  );
};

export default CarSelectorSection;
