import React from "react";
import { Link } from "react-router-dom";

const ProcessAreaTwo = () => {
  return (
    <div
      className="process-area-2 space-top  bg-smoke pb-50"
    // style={{ backgroundImage: "url(assets/img/bg/process2-bg.png)" }}
    >
      <div className="container mb-4">
        <div className="row justify-content-center ">
          <div className="col-xl-5 col-lg-7">
            <div className="title-area text-center mb-0">
              <h3 className="sub-title">Why Choose Us?</h3>
              <h2 className="sec-title text-dark">
                Reliable Car Care, Right Where You Need It{" "}
                <img
                  className="title-bg-shape shape-center"
                  src="assets/img/bg/title-bg-shape2.png"
                  alt="MyCarBuddy"
                />
              </h2>
            </div>
          </div>
        </div>
        <div class="row mt-4 mb-4">
          <div class="col-xxl-6 col-xl-6">
            <div class="about-feature-wrap style-shadow">
              <div class="icon"><img src="assets/img/icon/icon3.1-04.png" alt="CarBuddy" /></div>
              <div class="about-feature-wrap-details">
                <h5 class="about-feature-title">Convenience at Your Fingertips</h5>
                <p class="about-feature-text">Book a service in seconds and let us handle the rest. We come to you, wherever you are, so you never have to disrupt your day for car care.</p>
              </div>
            </div>
          </div>
          <div class="col-xxl-6 col-xl-6">
            <div class="about-feature-wrap style-shadow">
              <div class="icon"><img src="assets/img/icon/icon3.1-02.png" alt="CarBuddy" /></div>
              <div class="about-feature-wrap-details">
                <h5 class="about-feature-title">Expertise You Can Rely On</h5>
                <p class="about-feature-text">Gentle hand wash, high-pressure rinse, tyre cleaning, and wax protection to keep your car looking brand new — right in your driveway.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="row mt-4">
          <div class="col-xxl-6 col-xl-6">
            <div class="about-feature-wrap style-shadow">
              <div class="icon"><img src="assets/img/icon/icon3.1-01.png" alt="CarBuddy" /></div>
              <div class="about-feature-wrap-details">
                <h5 class="about-feature-title">Transparent & Honest Service</h5>
                <p class="about-feature-text">No hidden fees, no surprises. We provide clear estimates, upfront pricing, and honest recommendations—so you always know what to expect.</p>
              </div>
            </div>
          </div>
          <div class="col-xxl-6 col-xl-6">
            <div class="about-feature-wrap style-shadow">
              <div class="icon"><img src="assets/img/icon/icon3.1-03.png" alt="CarBuddy" /></div>
              <div class="about-feature-wrap-details">
                <h5 class="about-feature-title">Comprehensive Solutions</h5>
                <p class="about-feature-text">From emergency repairs to routine maintenance, we cover it all. Whether it’s a flat tire, battery issue, or a full service, Car Buddy is your one-stop solution for all automotive needs.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="text-center mt-4">
        </div>

      </div>
    </div>
  );
};

export default ProcessAreaTwo;
