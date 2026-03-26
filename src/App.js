import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import RouteScrollToTop from "./helper/RouteScrollToTop";
import ScrollToTop from "react-scroll-to-top";
import AboutPage from "./pages/AboutPage";
import ServicePage from "./pages/ServicePage";
import ServiceDetailsPage from "./pages/ServiceDetailsPage";

import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import WishlistPage from "./pages/WishlistPage";
import ContactPage from "./pages/ContactPage";
import HomePageThree from "./pages/HomePageThree";
import ServiceDetails from "./components/ServiceDetails";
import { CartProvider } from "./context/CartContext";
import SelectTimeSlotPage from './components/SelectTimeSlotPage';
import TimeSlotPage from "./pages/TimeSlotPage";
import 'react-datepicker/dist/react-datepicker.css';
import ProfilePage from "./pages/ProfilePage";
import MyBookingsPage from "./pages/MyBookingsPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import RefundPage from "./pages/RefundPage";
import CaseStudiesPage from "./pages/CaseStudiesPage";
import ServiceInDetailsPage from "./pages/ServiceInDetailsPage";
import NotFoundPage from "./pages/NotFoundPage";
import ReschedulePage from "./pages/ReschedulePage";
import CarDamageAnalysisPage from "./pages/CarDamageAnalysisPage";
import SearchPage from "./pages/SearchPage";
import AppRedirectPage from "./pages/AppRedirectPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import RedirectToPayment from "./pages/RedirectToPayment";
import ConfirmBookings from "./pages/ConfirmBookingsPage";
import ThankYouPage from "./pages/ThankYouPage";
import NotificationPopup from "./components/NotificationPopup";
import OfferScreenPopUp from "./components/OfferScreenPopUp";
// import AIChatWidget from "./components/AIChatWidget";
import FeedbackPage from "./pages/FeedbackPage"
function App() {
  useEffect(() => {
    // Check if notification was received in background
    if (localStorage.getItem('notificationReceived') === 'true') {
      localStorage.removeItem('notificationReceived');
      window.dispatchEvent(new CustomEvent('notificationReceived'));
    }
  }, []);

  return (
    <BrowserRouter>
      <CartProvider>
        <RouteScrollToTop />
        <ScrollToTop smooth color="#E8092E" />
        <NotificationPopup />
        {/* <AIChatWidget /> */}

        <Routes>
          <Route exact path="/" element={<><HomePageThree /> <OfferScreenPopUp/></>} />
          <Route exact path="/about" element={<AboutPage />} />
          <Route exact path="/service" element={<ServicePage />} />
          {/* <Route exact path="/service-details/:categoryId" element={<ServiceDetailsPage />} /> */}
           <Route path="/service/:categoryname/:categoryId" element={<ServiceDetailsPage />} />
          <Route path="/servicedetails/:packagename/:id" element={<ServiceInDetailsPage />} />
          <Route exact path="/cart" element={<CartPage />} />
          <Route exact path="/checkout" element={<CheckoutPage />} />
          <Route exact path="/contact" element={<ContactPage />} />
          <Route exact path="/selecttimeslot" element={<TimeSlotPage />} />
          <Route exact path="/profile" element={<ProfilePage />} />
          <Route exact path="/mybookings" element={<MyBookingsPage />} />
          <Route exact path="/terms" element={<TermsPage />} />
          <Route exact path="/privacy" element={<PrivacyPage />} />
          <Route exact path="/refund-cancellation" element={<RefundPage />} />
          <Route exact path="/case-studies" element={<CaseStudiesPage />} />
          <Route exact path="/reschedule" element={<ReschedulePage />} />
          <Route exact path="/car-damage-analysis" element={<CarDamageAnalysisPage />} />
          <Route exact path="/search" element={<SearchPage />} />
          <Route exact path="/redirect" element={<AppRedirectPage />} />
          <Route exact path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/redirect-to-payment/:encodedUrl" element={<RedirectToPayment />} />
          <Route path="/confirm-bookings" element={<ConfirmBookings />} />
          <Route path="/payment-successful" element={<ThankYouPage />} />
          <Route path="/customer-feedback" element={<FeedbackPage />} />
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
