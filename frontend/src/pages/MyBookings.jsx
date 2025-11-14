import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInterceptor";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate(); // ✅ Initialize navigation

  const fallbackImage =
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=60";

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("You must be logged in to view bookings.");
          setLoading(false);
          return;
        }

        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload.id;

        const res = await axiosInstance.get(
          `/bookings/user/${userId}`
        );

        setBookings(res.data.bookings || []);
      } catch (err) {
        console.error("Error fetching user bookings:", err.response || err.message);
        setError(err.response?.data?.message || "Failed to fetch your bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const token = localStorage.getItem("token");
      await axiosInstance.put(
        `/bookings/${bookingId}/cancel`,
        {}
      );

      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: "Cancelled" } : b))
      );

      alert("Booking cancelled successfully!");
    } catch (err) {
      console.error("Error cancelling booking:", err.response || err.message);
      alert(err.response?.data?.message || "Failed to cancel booking.");
    }
  };

  // ✅ Navigate to BookingConfirmation with bookingId
  const handleViewDetails = (bookingId) => {
    navigate(`/booking-confirmation/${bookingId}`);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 dark:text-gray-300 text-xl font-medium">
        Loading your bookings...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen text-red-600 dark:text-red-400 text-xl font-medium">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen pt-24 px-6 md:px-12 bg-gradient-to-b from-cyan-50 via-white to-cyan-100 dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 dark:text-gray-100 text-gray-800">
      <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-500 to-indigo-600 dark:from-violet-400 dark:to-fuchsia-500 bg-clip-text text-transparent mb-10 p-5 text-center">
        My Bookings
      </h1>

      {bookings.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-300 text-lg">
          You have no bookings yet.
        </div>
      ) : (
        <div className="space-y-6 max-w-5xl mx-auto">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="flex flex-col sm:flex-row bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-lg transition overflow-hidden"
            >
              {/* 🖼️ Image Section */}
              <div className="sm:w-1/3 w-full h-48 sm:h-auto">
                <img
                  src={booking.room?.image || fallbackImage}
                  alt={booking.room?.name || "Room Image"}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 🧾 Details Section */}
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start flex-wrap">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                        {booking.room?.name || "Stayelo Premium Room"}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        {booking.room?.type || "Luxury Stay"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full self-start
                        ${
                          booking.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200"
                            : booking.status === "CONFIRMED"
                            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
                            : booking.status === "Checked-in"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                            : booking.status === "Checked-out"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200"
                            : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200"
                        }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      <span className="font-semibold">Check-in:</span>{" "}
                      {new Date(booking.checkIn).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-semibold">Check-out:</span>{" "}
                      {new Date(booking.checkOut).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-semibold">Guests:</span>{" "}
                      {booking.guests}
                    </p>
                    <p>
                      <span className="font-semibold">Total Price:</span> ₹
                      {booking.totalPrice}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex justify-end space-x-3">
                  {/* ✅ View Details Button */}
                  <button
                    onClick={() => handleViewDetails(booking._id)}
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    View Details
                  </button>

                  {booking.status !== "Cancelled" &&
                    booking.status !== "Checked-out" && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        className="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                      >
                        Cancel
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Footer />
    </div>
  );
};

export default MyBookingsPage;
