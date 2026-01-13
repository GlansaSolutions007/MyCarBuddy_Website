import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./TestimonialOne.css";

const testimonials = [
  {
    name: "Ravi Kumar",
    role: "IT Professional",
    rating: 4,
    text: "I went for an oil change at My Car Buddy and the service was super smooth. The team explained which oil would be best for my car and finished the work quickly. I could feel the difference in performance right after driving out. Great experience overall."
  },
  {
    name: "Priya Reddy",
    role: "College Student",
    rating: 4,
    text: "I usually don't bother with fancy car washes, but My Car Buddy was worth it. They cleaned every corner, including the seats and dashboard. My car looked shiny on the outside and smelled fresh inside. Definitely recommending them to my friends."
  },
  {
    name: "Sandeep Varma",
    role: "Businessman",
    rating: 5,
    text: "My Swift had an ugly dent on the left door. The technicians at My Car Buddy repaired it so neatly that you can't even tell there was damage. The paint finish is excellent and matches the rest of the car perfectly. I'm impressed with their attention to detail."
  },
  {
    name: "Meghana",
    role: "Homemaker",
    rating: 4,
    text: "I spend a lot of time in my car, so the interiors had become messy. After My Car Buddy's deep cleaning service, the seats and floor mats looked spotless. Even the coffee stains were gone and the car smelled fresh. It felt like stepping into a new car again."
  },
  {
    name: "Anjali Sharma",
    role: "Teacher",
    rating: 4,
    text: "Went in for a regular check-up at My Car Buddy and I liked how professional the staff was. They inspected everything carefully and told me exactly what needed attention. No unnecessary repairs were suggested, which gave me confidence in their honesty."
  },
  {
    name: "Naveen",
    role: "Marketing Executive",
    rating: 4,
    text: "Got both oil and filters changed at My Car Buddy in under an hour. They used good quality parts and explained how often I should replace them. My car's engine runs smoother now and I noticed a slight improvement in mileage too. Very satisfied with their service."
  },
  {
    name: "Arjun",
    role: "Software Engineer",
    rating: 5,
    text: "My car broke down suddenly while going to work, and I was stressed. Called My Car Buddy and they arrived quickly. They diagnosed the issue on the spot and fixed it, saving me from towing hassles. Really thankful for their quick and professional help."
  },
  {
    name: "Divya",
    role: "MBA Student",
    rating: 4,
    text: "Booked the full service package at My Car Buddy, which included oil change, car wash, and a few minor repairs. Everything was done neatly and on time. My car now feels brand new—smooth drive, shiny look, and fresh interiors. Truly value for money service."
  },
  {
    name: "Kiran Rao",
    role: "Software Developer",
    rating: 4,
    text: "I usually don't have time to take my car to the garage for cleaning because of my busy schedule. My Car Buddy's doorstep car wash was a lifesaver—they came home, cleaned everything thoroughly, and my car looked spotless. Super convenient and totally worth it!"
  },
  {
    name: "Manoj",
    role: "Business Traveler",
    rating: 4,
    text: "My car broke down while I was returning from out of the city, and there were no service stations nearby. I immediately opened the My Car Buddy app and booked roadside service. Their team reached quickly and fixed the issue—such an amazing service, truly a lifesaver!"
  }
];

const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const TestimonialOne = () => {
  return (
    <section className="testimonial-section">
      <div className="container">
        {/* Section Header */}
        <div className="testimonial-header">
          <span className="testimonial-subtitle">Client Testimonials</span>
          <h2 className="testimonial-title">
            What Our <span>Happy Customers</span> Say
          </h2>
        </div>

        {/* Testimonial Slider */}
        <Swiper
          className="testimonial-swiper"
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={24}
          slidesPerView={1}
          loop={true}
          speed={800}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          navigation={{
            nextEl: ".testimonial-next",
            prevEl: ".testimonial-prev",
          }}
          pagination={{
            el: ".testimonial-pagination",
            clickable: true,
          }}
          breakpoints={{
            576: {
              slidesPerView: 1,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 24,
            },
            992: {
              slidesPerView: 3,
              spaceBetween: 24,
            },
            1200: {
              slidesPerView: 3,
              spaceBetween: 30,
            },
          }}
        >
          {testimonials.map((testimonial, index) => (
            <SwiperSlide key={index}>
              <div className="testimonial-card">
                {/* Quote Icon */}
                <div className="testimonial-quote">
                  <i className="fas fa-quote-right" />
                </div>

                {/* Rating */}
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`fas fa-star ${i < testimonial.rating ? 'filled' : 'empty'}`}
                    />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="testimonial-text">{testimonial.text}</p>

                {/* Author */}
                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    {getInitials(testimonial.name)}
                  </div>
                  <div className="testimonial-author-info">
                    <h4 className="testimonial-author-name">{testimonial.name}</h4>
                    <p className="testimonial-author-role">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Pagination */}
        <div className="testimonial-pagination"></div>

        {/* Navigation */}
        <div className="testimonial-nav">
          <button className="testimonial-nav-btn testimonial-prev">
            <i className="fas fa-arrow-left" />
          </button>
          <button className="testimonial-nav-btn testimonial-next">
            <i className="fas fa-arrow-right" />
          </button>
        </div>

        {/* Stats */}
        <div className="testimonial-stats">
          <div className="testimonial-stat">
            <div className="testimonial-stat-number">120K+</div>
            <div className="testimonial-stat-label">Happy Customers</div>
          </div>
          <div className="testimonial-stat">
            <div className="testimonial-stat-number">4.8</div>
            <div className="testimonial-stat-label">Average Rating</div>
          </div>
          <div className="testimonial-stat">
            <div className="testimonial-stat-number">98%</div>
            <div className="testimonial-stat-label">Would Recommend</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialOne;
