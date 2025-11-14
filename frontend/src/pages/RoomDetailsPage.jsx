import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axiosInstance from "../utils/axiosInterceptor";
import {
  CalendarIcon,
  UserIcon,
  WifiIcon,
  FireIcon,
  HomeIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import Login from "../components/Login"; // Your Login popup component

export default function RoomDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const prefillRoom = location.state?.room || null;
  const prefillGuests = location.state?.guests || 2;
  const prefillCheckIn = location.state?.checkIn || "";
  const prefillCheckOut = location.state?.checkOut || "";

  const [room, setRoom] = useState(prefillRoom);
  const [loading, setLoading] = useState(!prefillRoom);
  const [guests, setGuests] = useState(prefillGuests);
  const [checkIn, setCheckIn] = useState(prefillCheckIn);
  const [checkOut, setCheckOut] = useState(prefillCheckOut);
  const [error, setError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const [showLoginPopup, setShowLoginPopup] = useState(false); // Login popup state

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!room) {
      const fetchRoom = async () => {
        try {
          const res = await axiosInstance.get(`/rooms/${id}`);
          const roomData = res.data.room || res.data;

          roomData.reviews = roomData.reviews?.length
            ? roomData.reviews
            : [
                { user: "John Doe", rating: 5, comment: "Amazing stay!" },
                { user: "Jane Smith", rating: 4, comment: "Very comfortable and clean." },
              ];

          roomData.amenities = roomData.amenities?.length
            ? roomData.amenities
            : [
                { icon: <WifiIcon className="w-5 h-5 text-blue-600" />, text: "Free High-Speed Wi-Fi" },
                { icon: <FireIcon className="w-5 h-5 text-blue-600" />, text: "Outdoor Swimming Pool" },
                { icon: <HomeIcon className="w-5 h-5 text-blue-600" />, text: "Free Parking" },
                { icon: <SparklesIcon className="w-5 h-5 text-blue-600" />, text: "On-site Restaurant" },
              ];

          setRoom(roomData);
        } catch (err) {
          console.error("Error fetching room details:", err);
          setError("Failed to load room details.");
        } finally {
          setLoading(false);
        }
      };
      fetchRoom();
    }
  }, [id, room]);

  const getMaxGuests = () => {
    if (!room?.type) return 1;
    switch (room.type.toLowerCase()) {
      case "single": return 1;
      case "double": return 2;
      case "deluxe": return 3;
      default: return 1;
    }
  };

  const calculateTotalAmount = () => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    return nights * (room?.price || 0);
  };

  const handleBooking = () => {
    setError("");
    const token = localStorage.getItem("token");

    // Show login popup if user is not logged in
    if (!token) {
      const totalAmount = calculateTotalAmount();
      localStorage.setItem(
        "pendingBooking",
        JSON.stringify({ room, checkIn, checkOut, guests, totalAmount })
      );
      setShowLoginPopup(true);
      return;
    }

    if (!checkIn || !checkOut) {
      setError("Please select both check-in and check-out dates.");
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      setError("Check-out date must be after check-in date.");
      return;
    }

    const maxGuests = getMaxGuests();
    if (guests < 1) {
      setError("Please enter at least one guest.");
      return;
    }
    if (guests > maxGuests) {
      setError(`This room can accommodate up to ${maxGuests} guest(s) only.`);
      return;
    }

    setBookingLoading(true);

    try {
      const totalAmount = calculateTotalAmount();
      localStorage.setItem(
        "pendingBooking",
        JSON.stringify({ room, checkIn, checkOut, guests, totalAmount })
      );

      navigate("/payment", {
        state: { room, roomId: id, checkIn, checkOut, guests, totalAmount },
      });
    } catch (err) {
      console.error("Booking flow error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token || ""); // store token if available
    setShowLoginPopup(false);
    handleBooking(); // Continue booking after login
  };

  if (loading)
    return <div className="text-center py-32 text-gray-600 text-lg">Loading room details...</div>;

  if (!room)
    return <div className="text-center py-32 text-red-600 text-lg">Room not found.</div>;

  const mainImage =
    room.images?.length > 0
      ? room.images[mainImageIndex]
      : "https://via.placeholder.com/800x600?text=No+Image+Available";

  return (
    <div className="min-h-screen pt-24 px-6 md:px-12 bg-gradient-to-b from-cyan-50 via-white to-cyan-100 dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 dark:text-gray-100 text-gray-800">
      {/* Room Title */}
      <div className="px-4 md:px-12 py-3 text-gray-800 dark:text-white font-semibold text-2xl">{room.name}</div>

      <div className="px-4 md:px-12 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Section */}
        <div className="md:col-span-2">
          <div className="rounded-2xl overflow-hidden relative">
            <img src={mainImage} alt="Room" className="w-full h-72 md:h-96 object-cover" />
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto">
            {room.images?.map((img, i) => (
              <div
                key={i}
                className={`w-20 md:w-36 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-all duration-200 ${
                  mainImageIndex === i ? "ring-2 ring-blue-500 scale-105 dark:ring-fuchsia-500" : ""
                }`}
                onClick={() => setMainImageIndex(i)}
              >
                <img src={img} alt={`Thumbnail ${i}`} className="h-16 md:h-24 w-full object-cover" />
              </div>
            ))}
          </div>

          <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Description</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">{room.description || "No description available."}</p>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-800 dark:text-white">Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {room.amenities.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                  {a.icon || <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-fuchsia-400" />}
                  <span>{a.text || a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="md:sticky top-20">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{room.name}</h2>
            <div className="text-3xl font-bold text-blue-600 dark:text-fuchsia-500">₹{room.price}</div>
            <div className="text-gray-500 dark:text-gray-300 text-sm mb-4">per night</div>

            <div className="space-y-3">
              <div>
                <label className="text-gray-600 dark:text-gray-300 text-sm flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" /> Check-in
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={today}
                  className="mt-1 w-full border rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>

              <div>
                <label className="text-gray-600 dark:text-gray-300 text-sm flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" /> Check-out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || today}
                  className="mt-1 w-full border rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>

              <div>
                <label className="text-gray-600 dark:text-gray-300 text-sm flex items-center gap-1">
                  <UserIcon className="w-4 h-4" /> Guests
                </label>
                <input
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  min={1}
                  max={getMaxGuests()}
                  className="mt-1 w-full border rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <div className="mt-3 text-red-500 text-sm font-medium">
              Hurry! Only 2 rooms left at this price.
            </div>

            <button
              onClick={handleBooking}
              disabled={bookingLoading}
              className="mt-5 w-full bg-gradient-to-r from-cyan-500 to-indigo-600 dark:from-violet-600 dark:to-fuchsia-500 hover:opacity-90 text-white py-2 rounded-lg font-semibold shadow-md transition-all duration-200 disabled:opacity-70"
            >
              {bookingLoading ? "Processing..." : "Book Now"}
            </button>
          </div>
        </div>
      </div>

      {/* Login Popup */}
      <Login
        open={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onLogin={handleLoginSuccess}
      />
    </div>
  );
}
