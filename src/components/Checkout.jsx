import React, { useContext, useState } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import SuccessFailureModal from "./SuccessFailureModal";

const Checkout = () => {
  const { cartItems } = useCart();
  const [modal, setModal] = useState({ show: false, type: "", message: "" });
  const navigate = useNavigate();

  const totalAmount = cartItems.reduce((acc, item) => acc + item.price, 0);

  const handleModalClose = () => {
    setModal({ show: false, type: "", message: "" });
    if (modal.type === "success") {
      navigate("/profile?tab=mybookings"); // redirect to profile with query
    }
  };

  const loadRazorpay = () => {
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY,
      amount: totalAmount * 100,
      currency: "INR",
      name: "My Car Buddy a product by Glansa Solutions Pvt. Ltd.",
      description: "Payment for Car Services",
      image: "./public/assets/img/logo-yellow-01.png",
      handler: function (response) {
        console.log("Payment successful:", response);
        setModal({
          show: true,
          type: "success",
          message: "Payment successful! Redirecting to bookings...",
        });
      },
      prefill: {
        name: "Sourav",
        email: "sourav@example.com",
        contact: "9999999999",
      },
      notes: {
        address: "Developer Test Address",
      },
      theme: {
        color: "#28a745",
      },
      modal: {
        ondismiss: function () {
          setModal({
            show: true,
            type: "error",
            message: "Payment was cancelled or failed.",
          });
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="container py-5">
      <div className="row g-4">
        {/* Payment Options Section */}
        <div className="col-lg-12">
          <div className="card shadow p-4">
            <h3 className="mb-4">Checkout</h3>

            <h5 className="mb-3">Select Payment Method</h5>
            <div className="form-check mb-2">
              <input
                className="form-check-input"
                type="radio"
                name="payment"
                id="razorpay"
                defaultChecked
              />
              <label className="form-check-label" htmlFor="razorpay">
                Razorpay/ UPI/ Credit/ Debit Card
              </label>
            </div>

            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="radio"
                name="payment"
                id="cod"
              />
              <label className="form-check-label" htmlFor="cod">
                Cash on Delivery
              </label>
            </div>

            <div className="d-flex gap-3 mb-4">
              <img src="/assets/img/update-img/payment-method/01.png" alt="visa" width="50" />
              <img src="/assets/img/update-img/payment-method/02.png" alt="mastercard" width="50" />
              <img src="/assets/img/update-img/payment-method/03.png" alt="paypal" width="50" />
            </div>

            <div className="text-end">
              <button className="btn btn-success btn-lg" onClick={loadRazorpay}>Confirm Payment</button>
            </div>
          </div>
        </div>

      </div>
      <SuccessFailureModal
        show={modal.show}
        type={modal.type}
        message={modal.message}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default Checkout;
