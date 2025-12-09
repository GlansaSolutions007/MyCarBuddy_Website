import React from "react";

const ThankYouLayer = ({ orderId, amount, method }) => {
    return (
        <div
            className="min-h-screen w-full flex items-center justify-center px-4 py-8 pb-20"
            style={{
                height: "600px",
                backgroundImage: "url('/assets/img/Thank-you-page-2.png')",
                backgroundSize: "cover",      
                backgroundPosition: "center", 
                backgroundRepeat: "no-repeat", 
            }}
        >
            <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl p-6 sm:p-10 max-w-lg w-full">

                <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-700 leading-tight">
                    Thank You
                </h1>
                <h4 className="text-2xl sm:text-3xl font-extrabold text-center leading-tight" style={{color:"#4b4848ff"}}>
                    Our team will reach out to you shortly.
                </h4>
            </div>
        </div>
    );
};

export default ThankYouLayer;
