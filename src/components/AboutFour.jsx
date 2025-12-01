import React from "react";
import TrackVisibility from "react-on-screen";
import CountUp from "react-countup";
import { Link } from "react-router-dom";

const AboutFour = () => {
  return (
    <div className="about-area-2 bg-white space-top">
      <div className="container">
        <div className="row">
           <div className="title-area text-center mb-20">
              <h3 className="sub-title">Know About Us</h3>
              <h2 className="sec-title text-dark">
                Professional Car Service You Can Trust{" "}
              </h2>
            </div>
          <div className="col-xxl-7 col-xl-6">
            <div className="about-thumb2 mb-40 mb-xl-0">
              <div className="about-img-1">
                <img src="assets/img/normal/about_2-1.webp" alt="MYCARBUDDY" />
              </div>
              <div className="about-img-2">
                <img src="assets/img/normal/about_2-2.webp" alt="MYCARBUDDY" />
              </div>
              <div className="about-counter-wrap jump-reverse">
                <img src="assets/img/icon/about_icon2-1.svg" alt="MYCARBUDDY" />
                <h3 className="about-counter">
                  <TrackVisibility once>
                    {({ isVisible }) =>
                      isVisible && (
                        <span className="counter-number">
                          <CountUp delay={0} start={0} end={30} />
                          + <span className="text-sm" style={{ fontSize: "20px" }}>Years</span>
                        </span>
                      )
                    }
                  </TrackVisibility>
                </h3>
                <h4 className="about-counter-text">Domain Industry Expertise</h4>
              </div>
              {/* <div className="about-year-wrap2 movingX">
                <div className="about-year-grid-wrap">
                  <div className="icon">
                    <img
                      src="assets/img/icon/about_icon2-2.png"
                      alt="Fixturbo"
                    />
                  </div>
                  <h3 className="about-counter">
                    <TrackVisibility once>
                      {({ isVisible }) =>
                        isVisible && (
                          <span className="counter-number">
                            <CountUp delay={0} start={0} end={10} />
                            k+
                          </span>
                        )
                      }
                    </TrackVisibility>
                  </h3>
                </div>
                <h4 className="about-year-text">Years Of Experiences</h4>
              </div> */}
            </div>
          </div>
          <div className="col-xxl-5 col-xl-6">
            <div className="about-content-wrap">
              <div className="title-area mb-30">
                {/* <span className="sub-title">Know About Us</span>
                <h2 className="sec-title">
                  Professional Car Service You Can Trust
                </h2> */}
                <p className="sec-text">
                  At My Car Buddy, we make car care effortless by bringing professional services straight to your doorstep. No more waiting at garages or service centers. Our expert mechanics and technicians come to you, whenever and wherever you need them.
                  <br></br>Whether it’s a routine service, car wash, detailing, oil change, battery replacement, or emergency breakdown support, we’ve got you covered. With just a few taps on our app or website, you can book a service at your convenience and relax while our team takes care of the rest.

                </p>
              </div>
              <div className="col-xl-auto col-lg-6">
                <div className="checklist">
                  <ul>
                    <li>
                      <i className="fas fa-check-circle" />
                      Interior & Exterior Car Wash
                    </li>
                    <li>
                      <i className="fas fa-check-circle" />A car repair is a
                      Waterless Eco-Friendly Wash
                    </li>
                    <li>
                      <i className="fas fa-check-circle" />
                      AC & Engine Deep Cleaning
                    </li>
                    <li>
                      <i className="fas fa-check-circle" />
                      Quick and Efficient Car Service
                    </li>
                  </ul>
                </div>
              </div>
              <div className="btn-wrap mt-20 font-bold">
                <Link to="/about" className="  mt-xl-0 mt-20 my-0 font-weight-bold">
                  Read More <i className="fas fa-arrow-right ms-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutFour;
