import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../utils/axiosInterceptor";
import { Loader2, CheckCircle } from "lucide-react";

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // ✅ Get booking from location.state or fallback to localStorage
  const savedBooking = JSON.parse(localStorage.getItem("pendingBooking"));
  const { room, checkIn, checkOut, guests, totalAmount } =
    location.state || savedBooking || {};

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ✅ Redirect if booking data missing
  useEffect(() => {
    if (!room || !totalAmount) {
      alert("Missing room or amount details. Redirecting...");
      navigate("/", { replace: true });
    }
  }, [room, totalAmount, navigate]);

  // ✅ Load Razorpay SDK
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!room || !totalAmount) return;

    setLoading(true);

    const sdkLoaded = await loadRazorpayScript();
    if (!sdkLoaded) {
      alert("Razorpay SDK failed to load. Check your connection.");
      setLoading(false);
      return;
    }

    try {
      // ✅ Step 1: Create Razorpay order (amount in paise)
      const { data } = await axiosInstance.post(
        "/payment/create-order",
        { amount: totalAmount }
      );

      const { order } = data;
      if (!order) {
        alert("Order creation failed!");
        setLoading(false);
        return;
      }

      // ✅ Step 2: Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Stayelo",
        description: `Booking for ${room.name}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // ✅ Step 3: Verify payment
            const verifyRes = await axiosInstance.post(
              "/bookings/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                user: user._id,
                room: room._id,
                checkIn,
                checkOut,
                guests,
                totalAmount, // ✅ keep in rupees
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success && verifyRes.data.booking?._id) {
              const bookingId = verifyRes.data.booking._id;
              setSuccess(true);

              // ✅ Redirect after small delay
              setTimeout(() => {
                localStorage.removeItem("pendingBooking");
                navigate(`/booking-confirmation/${bookingId}`, {
                  replace: true,
                  state: { booking: verifyRes.data.booking, room },
                });
              }, 1500);
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            console.error("❌ Error verifying payment:", err);
            alert("Error verifying payment. Please try again.");
          }
        },
        prefill: {
          name: user?.name || "Guest",
          email: user?.email || "",
        },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("❌ Payment initiation failed:", error);
      alert("Error starting payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Success screen
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <CheckCircle size={64} className="text-green-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">
          Payment Successful!
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Redirecting to booking confirmation...
        </p>
      </div>
    );
  }

  // ✅ Default Payment UI
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl text-center w-96">
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
          Proceed to Payment
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Amount: ₹{totalAmount}
        </p>
        <button
          onClick={handlePayment}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 w-full"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Pay Now"}
        </button>
      </div>
    </div>
  );
}
