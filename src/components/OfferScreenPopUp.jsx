// import React, { useState, useEffect, useRef } from 'react';
// import './OfferScreenPopUp.css';
// import InspectionPopup from "./InspectionPopup";


// const OfferScreenPopUp = () => {
//     const [isVisible, setIsVisible] = useState(false);
//     const [isAnimating, setIsAnimating] = useState(false);
//     const [showInspectionPopup, setShowInspectionPopup] = useState(false);


//     useEffect(() => {
//         // Show popup after 1 second
//         const showTimer = setTimeout(() => {
//             setIsVisible(true);
//             setIsAnimating(true);
//         }, 1000);

//         // Auto close popup after 6 seconds total (1s delay + 5s visible)
//         const hideTimer = setTimeout(() => {
//             setIsAnimating(false);
//             setTimeout(() => setIsVisible(false), 400); // wait for slide-down animation
//         }, 5000);

//         return () => {
//             clearTimeout(showTimer);
//             clearTimeout(hideTimer);
//         };
//     }, []);


//     const handleClose = () => {
//         setIsAnimating(false);
//         // Wait for animation to finish before unmounting
//         setTimeout(() => setIsVisible(false), 400);
//     };

//     if (!isVisible) return null;

//     return (
//         <div className={`offer-overlay ${isAnimating ? 'active' : ''}`} onClick={handleClose}>
//             {/* NEW: Fireworks Container */}
//             {/* {isAnimating && (
//                 <div className="fireworks-container">
//                     <div className="rocket r1"></div>
//                     <div className="rocket r2"></div>
//                     <div className="rocket r3"></div>
//                     <div className="blast b1"></div>
//                     <div className="blast b2"></div>
//                     <div className="blast b3"></div>
//                 </div>
//             )} */}

//             <div className={`offer-container ${isAnimating ? 'slide-up' : 'slide-down'}`} onClick={(e) => e.stopPropagation()}>

//                 {/* Close Button at Top Center */}
//                 <button className="offer-close-btn" onClick={handleClose}>
//                     <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none">
//                         <line x1="18" y1="6" x2="6" y2="18"></line>
//                         <line x1="6" y1="6" x2="18" y2="18"></line>
//                     </svg>
//                 </button>

//                 <div className="offer-content">
//                     {/* Header Section */}
//                     <div className="offer-header">
//                         {/* Left Top Logo */}
//                         <img
//                             src="/assets/img/MyCarBuddy-Logo1.png"
//                             alt="My Car Buddy"
//                             className="offer-brand-icon"
//                         />

//                         {/* Center Title */}
//                         <div className="offer-title-wrapper">
//                             <h1 className="offer-main-title">
//                                 New Year Car Care Offer <br />
//                                 <span className="year">2026</span>
//                             </h1>
//                         </div>

//                         <p className="offer-subtext">
//                             Limited-time New Year pricing — <br />
//                             Standard Inspection at ₹399 • Premium Inspection at ₹599
//                         </p>
//                     </div>


//                     {/* Placeholder for the Illustration (Trophy/Coins) */}
//                     <div className="offer-illustration-area">
//                         <div className="placeholder-art"></div>
//                     </div>

//                     {/* Footer Action */}
//                     <div className="offer-footer">
//                         <button className="offer-primary-btn" onClick={() => setShowInspectionPopup(true)}>
//                             Book New Year Inspection
//                             <span className="arrow">▶</span>
//                         </button>
//                     </div>
//                 </div>
//             </div>
//             {/* Inspection Popup */}
//             <InspectionPopup
//                 isOpen={showInspectionPopup}
//                 onClose={() => setShowInspectionPopup(false)}
//             />
//         </div>
//     );
// };

// export default OfferScreenPopUp;

////////////////////////////////////////////////////////////////////////

import React, { useState, useEffect } from 'react';
import Fireworks from 'react-canvas-confetti/dist/presets/fireworks';
import './OfferScreenPopUpNew.css';

const OfferScreenPopUp = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [startSparks, setStartSparks] = useState(false);

    useEffect(() => {
        const alreadyShown = sessionStorage.getItem("ny_popup_shown");

        if (alreadyShown === "true") return;

         const showTimer = setTimeout(() => {

        sessionStorage.setItem("ny_popup_shown", "true");

        setIsVisible(true);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsAnimating(true);
            });
        });

        const sparkTimer = setTimeout(() => {
            setStartSparks(true);
        }, 500);

        const hideTimer = setTimeout(() => {
            handleClose();
        }, 7000);

        return () => {
            clearTimeout(sparkTimer);
            clearTimeout(hideTimer);
        };

         }, 30000);
        return () => clearTimeout(showTimer);

    }, []);

    const handleClose = () => {
        setIsAnimating(false);
        setStartSparks(false);
        // Wait for CSS transition to finish before unmounting
        setTimeout(() => setIsVisible(false), 600);
    };

    if (!isVisible) return null;

    return (
        <div
            className={`ny-overlay ${isAnimating ? 'active' : ''}`}
            onClick={handleClose}
        >
            {/* Sparks Library */}
            {startSparks && (
                <Fireworks
                    autorun={{ speed: 5, duration: 1000 }}
                    decorateOptions={(options) => ({
                        ...options,
                        colors: ['#fca311', '#eea468', '#ffffff', '#ffb703'],
                        particleCount: 70,
                        spread: 160,
                    })}
                    style={{
                        position: 'fixed',
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        zIndex: 10000,
                        pointerEvents: 'none'
                    }}
                />
            )}

            <div
                className={`ny-container ${isAnimating ? 'zoom-in' : 'zoom-out'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button className="ny-close-btn" onClick={handleClose}>×</button>

                <div className="ny-content">
                    <img src="/assets/img/MyCarBuddy-Logo1.png" alt="Logo" className="ny-logo" />

                    <h2 className="ny-wish">Welcome to My Car Buddy</h2>
                    <h1 className="ny-main-title">
                        Your trusted doorstep car service provider.<br />
                        {/* <span className="year">2026</span> */}
                        <span className="year car-icon">
                            <i className="bi bi-car-front-fill"></i>
                        </span>
                    </h1>

                    <p className="ny-message">
                        From routine servicing to expert repairs, we ensure a smooth, safe, and hassle-free driving experience every time.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OfferScreenPopUp;