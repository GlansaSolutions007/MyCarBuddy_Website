// import React from "react";

// const ThankYouLayer = () => {
//     return (
//         <div
//             className="w-full h-screen"
//             style={{
//                 height: "100vh",
//                 backgroundImage: "url('/assets/img/laptopthankyou.png')",
//                 backgroundSize: "cover",
//                 backgroundPosition: "center",
//                 backgroundRepeat: "no-repeat",
//             }}
//         >
//         </div>
//     );
// };

// export default ThankYouLayer;

////////////////////////////////////////////////

import React from "react";

const ThankYouLayer = () => {
  return (
    <>
      <style>
        {`
          .thankyou-bg {
            width: 100%;
            height: 100vh;
            background-image: url('/assets/img/laptopthankyou-2.png');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          }

          /* Mobile Image */
          @media (max-width: 640px) {
            .thankyou-bg {
              background-image: url('/assets/img/mobilethankyou.png');
            }
          }
        `}
      </style>

      <div className="thankyou-bg"></div>
    </>
  );
};

export default ThankYouLayer;
