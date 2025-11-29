// src/components/HeroSection.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const images = [
    "assets/img/hero/bannerdesign1.png",
    "assets/img/hero/bannerdesign2.png"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  const handleContactClick = () => {
    const phone = "7075243939";

    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      // Open phone dialer
      window.location.href = `tel:${phone}`;
    } else {
      // Open WhatsApp Web
      window.open(`https://wa.me/91${phone}`, "_blank");
    }
  };

  return (
    <section
      style={{
        backgroundImage: `url(${images[currentImage]})`,
      }}
      className="hero-section-mobile-fix"
    >
      <h2 className="d-none">My Car Buddy</h2>
      <h1 className="d-none">MyCarBuddy</h1>

      {/* Background curve */}
      {/* <svg
        viewBox="0 0 350 600"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          height: "100%",
          zIndex: 0,
        }}
      >
        <path
          d="M800,0 C700,200 600,350 400,450 C200,550 0,400 0,200 C0,0 150,-50 400,0 C650,50 800,-50 800,0 Z"
          fill="#fdf3e7"
        />
      </svg> */}

      {/* Floating particles */}
      {/* <ParticlesBg /> */}

      {/* Left content */}
      <div
        style={{
          flex: "1 1 400px",
          zIndex: 2,
          paddingLeft: "50px",
        }}
      >
        <div className="hero-style3 row">
          <div className="col-md-6">
            <div className="hero-subtitle text-white" data-ani="slideinup" data-ani-delay="0s">
              <span>
                <img src="assets/img/hero/hero_shape_3.png" alt="MyCarBuddy" />
                Welcome To MyCarBuddy
              </span>
            </div>
            <h1 className="hero-title text-white" data-ani="slideinup" data-ani-delay="0.1s">
              Premium Car Care at Your Doorstep
            </h1>
            <p className="hero-text text-white" data-ani="slideinup" data-ani-delay="0.2s">
              My Car Buddy bring hassle-free service right when you need it, so you enjoy life while we care for your car.
            </p>
            <p className="hero-text text-white" data-ani="slideinup" data-ani-delay="0.2s">
              Our experts assess your car’s needs with clarity, no hidden costs, only genuine solutions.
            </p>
            <p className="hero-text text-white" data-ani="slideinup" data-ani-delay="0.2s">
              Treat your car like our best buddy. Book now for expert care that keeps it running at its best!
            </p>
            <div className="btn-group" data-ani="slideinup" data-ani-delay="0.3s">
              {/* <Link to="/about" className="btn">
                                  Learn More
                                </Link> */}
              <div className="call-media-wrap">

                <Link to="/service" className="btn btn-primary px-4 py-3">
                  Explore Services
                </Link>
                <Link onClick={handleContactClick} className="btn btn-primary px-4 py-3">
                  Call Now
                </Link>
                {/* <div className="icon">
                                    <img src="/assets/img/icon/phone-1.svg" alt="MyCarBuddy" />
                                  </div>
                                  <div className="media-body">
                                    <h6 className="title text-white">Requesting A Call:</h6>
                                    <h4 className="link1">
                                      <a className="text-white" href="tel:9885653865">
                                        +91 98856 53865
                                      </a>
                                      <br />
                                      <a className="text-white" href="tel:7075243939">
                                        +91 70752 43939
                                      </a>
                                    </h4>
                                  </div> */}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            {/* <img src="/assets/img/hero/carwash.png" alt="Car Wash" className="hero-image"  /> */}

          </div>
        </div>





      </div>

      {/* 3D Car Model */}
      {/* <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              style={{
                flex: "1 1 400px",
                height: "400px",
                maxWidth: "600px",
                zIndex: 2,
              }}
            >
              <Canvas camera={{ position: [3, 2, 5] }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={1.2} />
                <Environment preset="sunset" />
                <OrbitControls enableZoom={false} enableRotate={false} />
                <CarModel />
              </Canvas>
            </motion.div> */}
    </section>
  );
};

export default HeroSection;
