import React, { useEffect, useRef, useState } from "react";
import "./ChooseCarModalWithScanner.css";
import BrandPopup from "./BrandPopup";
import ModelPopup from "./ModelPopup";
import axios from "axios";
import { createWorker } from 'tesseract.js';

const ChooseCarModal = ({ isVisible, onClose, onCarSaved }) => {
  const BASE_URL = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const [carType, setCarType] = useState("");
  const [brand, setBrand] = useState(null);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [fuels, setFuels] = useState([]);
  const [model, setModel] = useState("");
  const [fuel, setFuel] = useState("");
  const [showBrandPopup, setShowBrandPopup] = useState(false);
  const [showModelPopup, setShowModelPopup] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const modalRef = useRef();
  const imageBaseURL = process.env.REACT_APP_CARBUDDY_IMAGE_URL;
  const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;

  // RC Scanner states
  const [rcImages, setRcImages] = useState({ front: null, back: null });
  const [rcImagePreviews, setRcImagePreviews] = useState({ front: null, back: null });
  const [isProcessingRC, setIsProcessingRC] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [useScanner, setUseScanner] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  useEffect(() => {
    const fetchBrands = async () => {
      setLoadingBrands(true);
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        const response = await axios.get(
          `${BASE_URL}VehicleBrands/GetVehicleBrands`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data?.status && Array.isArray(response.data.data)) {
          const formattedBrands = response.data.data
            .filter((b) => b.IsActive === true)
            .map((b) => ({
              id: b.BrandID,
              name: b.BrandName,
              logo: `${imageBaseURL}${b.BrandLogo.startsWith("/") ? b.BrandLogo.slice(1) : b.BrandLogo}`,
            }));
          console.log("Formatted brands:", formattedBrands);
          setBrands(formattedBrands);
        }
      } catch (err) {
        console.error("Failed to fetch brands", err);
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchBrands();
    fetchFuels();
  }, []);

  const fetchModels = async (brandId) => {
    setLoadingModels(true);
    try {
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      const response = await axios.get(`${BASE_URL}VehicleModels/BrandId?brandid=${brandId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Raw models data:", response.data);

      if (Array.isArray(response.data)) {
        console.log("Raw models data:", response.data);
        const getImageUrl = (path) => {
          if (!path) return "https://via.placeholder.com/100?text=No+Image";
          const fileName = path.split('/').pop();
          return  `${imageBaseURL}${path.startsWith("/") ? path.slice(1) : path}`;
        };
        const filteredModels = response.data
          .filter((m) => m.BrandID === brandId && m.IsActive)
          .map((m) => ({
            id: m.ModelID,
            name: m.ModelName,
            logo: getImageUrl(m.VehicleImage),
          }));

        setModels(filteredModels);
      }
      else {
        setModels([]);
        console.error("Error fetching models:", response.data);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    } finally {
      setLoadingModels(false);
    }
  };

  const fetchFuels = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      const res = await axios.get(`${BASE_URL}FuelTypes/GetFuelTypes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data?.status && Array.isArray(res.data.data)) {
        const formatted = res.data.data
          .filter(f => f.IsActive)
          .map(f => {
            const fileName = f.FuelImage?.split("/").pop();
            const encodedFileName = encodeURIComponent(fileName);
            const imageUrl = `${imageBaseURL}${f.FuelImage}`;

            return {
              id: f.FuelTypeID,
              name: f.FuelTypeName,
              image: imageUrl,
            };
          });
        setFuels(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch fuels", err);
    }
  };

  // RC Scanner Functions
  const handleRCImageUpload = (event, side) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const newImages = { ...rcImages, [side]: file };
      setRcImages(newImages);

      const reader = new FileReader();
      reader.onload = (e) => {
        const newPreviews = { ...rcImagePreviews, [side]: e.target.result };
        setRcImagePreviews(newPreviews);
      };
      reader.readAsDataURL(file);
    }
  };

  const processRCImages = async () => {
    const { front, back } = rcImages;
    if (!front && !back) return;

    setIsProcessingRC(true);
    setOcrProgress(0);

    try {
      const worker = await createWorker('eng');

      worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-/ ',
      });

      let combinedText = '';

      // Process front image if available
      if (front) {
        const { data: { text: frontText } } = await worker.recognize(front);
        combinedText += frontText + ' ';
      }

      // Process back image if available
      if (back) {
        const { data: { text: backText } } = await worker.recognize(back);
        combinedText += backText + ' ';
      }

      await worker.terminate();

      console.log('Combined OCR Text:', combinedText);

      // Extract information from OCR text
      const extractedData = extractCarInfoFromOCR(combinedText);
      setOcrResult(extractedData);

      if (extractedData) {
        await autoPopulateCarDetails(extractedData);
      }

    } catch (error) {
      console.error("OCR processing failed:", error);
      alert("Failed to process RC images. Please try again or use manual selection.");
    } finally {
      setIsProcessingRC(false);
      setOcrProgress(0);
    }
  };

  // const extractCarInfoFromOCR = (ocrText) => {
  //   const text = ocrText.toLowerCase();

  //   // Common car brands in India with variations and common misspellings
  //   const carBrands = [
  //     {
  //       name: 'maruti',
  //       variations: ['maruti suzuki', 'maruti-suzuki', 'suzuki', 'maruti udyog'],
  //       commonMisspellings: ['maruthi', 'maruti', 'marut', 'marooti']
  //     },
  //     {
  //       name: 'hyundai',
  //       variations: ['hyndai', 'hundai', 'hyundai motor', 'hyundai motors'],
  //       commonMisspellings: ['hyndai', 'hundai', 'hyundi', 'hyundia']
  //     },
  //     {
  //       name: 'tata',
  //       variations: ['tata motors', 'tata motor', 'telco'],
  //       commonMisspellings: ['tata', 'tata motors']
  //     },
  //     {
  //       name: 'mahindra',
  //       variations: ['mahindra & mahindra', 'm&m', 'mahindra mahindra'],
  //       commonMisspellings: ['mahindra', 'mahendra', 'mahinder']
  //     },
  //     {
  //       name: 'toyota',
  //       variations: ['toyota kirloskar', 'toyota india'],
  //       commonMisspellings: ['toyota', 'toyata']
  //     },
  //     {
  //       name: 'honda',
  //       variations: ['honda cars', 'honda india'],
  //       commonMisspellings: ['honda', 'hond']
  //     },
  //     {
  //       name: 'ford',
  //       variations: ['ford india', 'ford motors'],
  //       commonMisspellings: ['ford', 'frod']
  //     },
  //     {
  //       name: 'volkswagen',
  //       variations: ['vw', 'volkswagon', 'volkswagen india'],
  //       commonMisspellings: ['volkswagen', 'volkswagon', 'vw', 'volkswagan']
  //     },
  //     {
  //       name: 'nissan',
  //       variations: ['nissan motor', 'nissan india'],
  //       commonMisspellings: ['nissan', 'nison']
  //     },
  //     {
  //       name: 'renault',
  //       variations: ['renault india', 'renault nissan'],
  //       commonMisspellings: ['renault', 'renalt', 'renolt']
  //     },
  //     {
  //       name: 'skoda',
  //       variations: ['skoda auto', 'skoda india'],
  //       commonMisspellings: ['skoda', 'skod']
  //     },
  //     {
  //       name: 'fiat',
  //       variations: ['fiat india', 'fiat automobiles'],
  //       commonMisspellings: ['fiat', 'fiate']
  //     },
  //     {
  //       name: 'chevrolet',
  //       variations: ['chevy', 'gm', 'general motors'],
  //       commonMisspellings: ['chevrolet', 'chevy', 'chevrolate']
  //     },
  //     {
  //       name: 'audi',
  //       variations: ['audi ag', 'audi india'],
  //       commonMisspellings: ['audi', 'aud']
  //     },
  //     {
  //       name: 'bmw',
  //       variations: ['bmw india', 'bmw group'],
  //       commonMisspellings: ['bmw', 'bmv']
  //     },
  //     {
  //       name: 'mercedes',
  //       variations: ['mercedes-benz', 'benz', 'mercedes benz'],
  //       commonMisspellings: ['mercedes', 'mercedez', 'merceds']
  //     },
  //     {
  //       name: 'jaguar',
  //       variations: ['jaguar land rover', 'jaguar india'],
  //       commonMisspellings: ['jaguar', 'jaguar']
  //     },
  //     {
  //       name: 'land rover',
  //       variations: ['landrover', 'lr', 'land rover india'],
  //       commonMisspellings: ['land rover', 'landrover', 'land rover']
  //     },
  //     {
  //       name: 'volvo',
  //       variations: ['volvo cars', 'volvo india'],
  //       commonMisspellings: ['volvo', 'volvo'],
  //     }
  //   ];