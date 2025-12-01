import React from "react";
import TrackVisibility from "react-on-screen";
import CountUp from "react-countup";

const FaqAreaTwo = () => {
  return (
    <section className="faq-area-2 space mt-50">
      <div className="container mt-50 pt-50">
         <div className="title-area text-center mb-40">
              <h3 className="sub-title">FAQ</h3>
              <h2 className="sec-title text-dark">
                Your Car Service Questions Answered{" "}
                <img
                  className="title-bg-shape shape-center"
                  src="assets/img/bg/title-bg-shape2.png"
                  alt="MyCarBuddy"
                />
              </h2>
            </div>
        <div className="row gx-60 flex-row-reverse">
          {/* Counter & Image Section */}
          <div className="col-xl-6">
            <div className="faq-thumb2 mb-xl-0 mb-50">
              {/* <div className="about-counter-grid jump">
                <img
                  src="assets/img/icon/faq2-counter-icon-1.svg"
                  alt="Car Service"
                />
                <div className="media-right">
                  <h3 className="about-counter">
                    <TrackVisibility once>
                      {({ isVisible }) =>
                        isVisible && (
                          <span className="counter-number">
                            <CountUp delay={0} start={0} end={250} />+
                          </span>
                        )
                      }
                    </TrackVisibility>
                  </h3>
                  <h4 className="about-counter-text">Cars Washed</h4>
                </div>
              </div> */}
              <img src="assets/img/normal/faq-thumb-2-1.webp" alt="MyCarBuddy" />
            </div>
          </div>

          {/* FAQ Section */}
          <div className="col-xl-6">


            <div className="accordion-area accordion" id="faqAccordion" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {/* Question 1 */}
              <div className="accordion-card style2 active">
                <div className="accordion-header" id="collapse-item-1">
                  <button
                    className="accordion-button"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse-1"
                    aria-expanded="true"
                    aria-controls="collapse-1"
                  >
                    What is usually checked during a car inspection service?
                  </button>
                </div>
                <div
                  id="collapse-1"
                  className="accordion-collapse collapse show"
                  aria-labelledby="collapse-item-1"
                  data-bs-parent="#faqAccordion"
                >
                  <div className="accordion-body">
                    <p className="faq-text">
                      Car inspection from My Car Buddy can include brakes, clutch, tyres, batteries, lights, and overall body condition and physical conditioning
                    </p>
                  </div>
                </div>
              </div>

              {/* Question 2 */}
              <div className="accordion-card style2">
                <div className="accordion-header" id="collapse-item-2">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse-2"
                    aria-expanded="false"
                    aria-controls="collapse-2"
                  >
                    What is included in My Car Buddy detailing services?
                  </button>
                </div>
                <div
                  id="collapse-2"
                  className="accordion-collapse collapse"
                  aria-labelledby="collapse-item-2"
                  data-bs-parent="#faqAccordion"
                >
                  <div className="accordion-body">
                    <p className="faq-text">
                      Detailing services with My Car Buddy usually include polishing, waxing, scratch removal, interior cleaning, and dashboard restoration for a refreshed look.
                    </p>
                  </div>
                </div>
              </div>

              {/* Question 3 */}
              <div className="accordion-card style2">
                <div className="accordion-header" id="collapse-item-3">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse-3"
                    aria-expanded="false"
                    aria-controls="collapse-3"
                  >
                    How much does denting & painting service cost?
                  </button>
                </div>
                <div
                  id="collapse-3"
                  className="accordion-collapse collapse"
                  aria-labelledby="collapse-item-3"
                  data-bs-parent="#faqAccordion"
                >
                  <div className="accordion-body">
                    <p className="faq-text">
                      Costs depend on car type, dent type, and paint quality. My Car Buddy provides denting & painting with options for panel-wise or full-body painting.
                    </p>
                  </div>
                </div>
              </div>

              {/* Question 4 */}
              <div className="accordion-card style2">
                <div className="accordion-header" id="collapse-item-4">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse-4"
                    aria-expanded="false"
                    aria-controls="collapse-4"
                  >
                    Where can I get My Car Buddy services in Hyderabad?
                  </button>
                </div>
                <div
                  id="collapse-4"
                  className="accordion-collapse collapse"
                  aria-labelledby="collapse-item-4"
                  data-bs-parent="#faqAccordion"
                >
                  <div className="accordion-body">
                    <p className="faq-text">
                      My car buddy services are available near by your location in Hyderabad
                    </p>
                  </div>
                </div>
              </div>

              {/* Question 5 */}
              <div className="accordion-card style2">
                <div className="accordion-header" id="collapse-item-5">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse-5"
                    aria-expanded="false"
                    aria-controls="collapse-5"
                  >
                    Does My Car Buddy handle clutch and body parts replacement?
                  </button>
                </div>
                <div
                  id="collapse-5"
                  className="accordion-collapse collapse"
                  aria-labelledby="collapse-item-5"
                  data-bs-parent="#faqAccordion"
                >
                  <div className="accordion-body">
                    <p className="faq-text">
                      Yes, My Car Buddy offers clutch replacement (clutch plate, pressure plate, cylinder) and body parts replacement like bumpers, doors, and fenders.
                    </p>
                  </div>
                </div>
              </div>

              {/* Question 6 */}
              <div className="accordion-card style2">
                <div className="accordion-header" id="collapse-item-6">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse-6"
                    aria-expanded="false"
                    aria-controls="collapse-6"
                  >
                    What battery replacement options are available with My Car Buddy?
                  </button>
                </div>
                <div
                  id="collapse-6"
                  className="accordion-collapse collapse"
                  aria-labelledby="collapse-item-6"
                  data-bs-parent="#faqAccordion"
                >
                  <div className="accordion-body">
                    <p className="faq-text">
                      My Car Buddy offers battery replacement, charging checks, and jump-start services for different car battery brands and models.
                    </p>
                  </div>
                </div>
              </div>

              {/* Question 7 */}
              <div className="accordion-card style2">
                <div className="accordion-header" id="collapse-item-7">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse-7"
                    aria-expanded="false"
                    aria-controls="collapse-7"
                  >
                    What suspension services are available with My Car Buddy?
                  </button>
                </div>
                <div
                  id="collapse-7"
                  className="accordion-collapse collapse"
                  aria-labelledby="collapse-item-7"
                  data-bs-parent="#faqAccordion"
                >
                  <div className="accordion-body">
                    <p className="faq-text">
                      My Car Buddy provides suspension checks, shock absorber replacement, and alignment services, which are handled at the garage only.
                    </p>
                  </div>
                </div>
              </div>

              {/* Question 8 */}
              <div className="accordion-card style2">
                <div className="accordion-header" id="collapse-item-8">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse-8"
                    aria-expanded="false"
                    aria-controls="collapse-8"
                  >
                    Is car wash vacuuming enough for cleaning car interiors?
                  </button>
                </div>
                <div
                  id="collapse-8"
                  className="accordion-collapse collapse"
                  aria-labelledby="collapse-item-8"
                  data-bs-parent="#faqAccordion"
                >
                  <div className="accordion-body">
                    <p className="faq-text">
                      Car wash vacuuming removes dust from carpets and seats. My Car Buddy also covers AC vent cleaning and dashboard care as part of extended services.
                    </p>
                  </div>
                </div>
              </div>

              {/* Question 9 */}
              <div className="accordion-card style2">
                <div className="accordion-header" id="collapse-item-9">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse-9"
                    aria-expanded="false"
                    aria-controls="collapse-9"
                  >
                    What does AC service and repairs usually include?
                  </button>
                </div>
                <div
                  id="collapse-9"
                  className="accordion-collapse collapse"
                  aria-labelledby="collapse-item-9"
                  data-bs-parent="#faqAccordion"
                >
                  <div className="accordion-body">
                    <p className="faq-text">
                      AC service may involve gas refill, filter cleaning, or cooling system checks. My Car Buddy provides these under AC service repairs also provides detailing of the AC functionality
                    </p>
                  </div>
                </div>
              </div>

              {/* Question 10 */}
              <div className="accordion-card style2">
                <div className="accordion-header" id="collapse-item-10">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse-10"
                    aria-expanded="false"
                    aria-controls="collapse-10"
                  >
                    Can insurance claims be applied for dents and scratches?
                  </button>
                </div>
                <div
                  id="collapse-10"
                  className="accordion-collapse collapse"
                  aria-labelledby="collapse-item-10"
                  data-bs-parent="#faqAccordion"
                >
                  <div className="accordion-body">
                    <p className="faq-text">
                      Insurance claim services can cover dents, accidental repairs, windshield damages, and more, depending on policy
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqAreaTwo;
