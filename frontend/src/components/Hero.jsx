import React, { useState } from "react";
import axiosInstance from "../utils/axiosInterceptor";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [roomType, setRoomType] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();

    if (checkIn && checkOut && new Date(checkOut) < new Date(checkIn)) {
      alert("Check-out date must be after check-in date.");
      return;
    }

    if (priceMin && priceMax && Number(priceMin) > Number(priceMax)) {
      alert("Minimum price cannot exceed maximum price.");
      return;
    }

    setLoading(true);

    try {
      const params = {};

      if (destination.trim()) params.destination = destination.trim();
      if (checkIn) params.checkIn = checkIn;
      if (checkOut) params.checkOut = checkOut;
      if (guests > 0) params.guests = guests;
      if (roomType) params.roomType = roomType;
      if (priceMin) params.priceMin = priceMin;
      if (priceMax) params.priceMax = priceMax;

      const response = await axiosInstance.get(
        "/rooms/search",
        { params }
      );

      const data = response.data || [];

      if (data.length === 0) {
        alert("No rooms found. Try different filters.");
        setLoading(false);
        return;
      }

      // Navigate to rooms page with the results
      navigate("/rooms", { state: { rooms: data } });
    } catch (error) {
      console.error("❌ Failed to fetch rooms:", error.message);
      alert("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 xl:px-32 text-white bg-[url('/herobg.jpg')] bg-cover bg-no-repeat h-screen">
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold">
        Find Your{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-600
                          dark:from-violet-400 dark:to-fuchsia-500">
          Perfect Stay
        </span>
      </h2>
      <p className="mt-2 text-lg text-gray-200">
        Book your next adventure with us. Enjoy the best hotel deals and accommodations.
      </p>

      <form
  onSubmit={handleSearch}
  className="
    bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-100
    rounded-lg px-6 py-4
    flex flex-col md:flex-row md:flex-wrap
    gap-4
    w-full max-w-7xl
    shadow-lg
  "
>
  {/* Destination */}
  <div className="flex flex-col w-full md:w-[180px]">
    <label className="font-medium">Destination</label>
    <input
      value={destination}
      onChange={(e) => setDestination(e.target.value)}
      type="text"
      placeholder="Enter city"
      className="rounded border border-gray-300 dark:border-gray-700 px-3 py-2 mt-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
      required
    />
  </div>

  {/* Check-in */}
  <div className="flex flex-col w-full md:w-[150px]">
    <label className="font-medium">Check in</label>
    <input
      type="date"
      value={checkIn}
      onChange={(e) => setCheckIn(e.target.value)}
      className="rounded border border-gray-300 dark:border-gray-700 px-3 py-2 mt-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
    />
  </div>

  {/* Check-out */}
  <div className="flex flex-col w-full md:w-[150px]">
    <label className="font-medium">Check out</label>
    <input
      type="date"
      value={checkOut}
      onChange={(e) => setCheckOut(e.target.value)}
      className="rounded border border-gray-300 dark:border-gray-700 px-3 py-2 mt-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
    />
  </div>

  {/* Guests */}
  <div className="flex flex-col w-full md:w-[100px]">
    <label className="font-medium">Guests</label>
    <input
      type="number"
      min={1}
      max={10}
      value={guests}
      onChange={(e) => setGuests(Number(e.target.value))}
      className="rounded border border-gray-300 dark:border-gray-700 px-3 py-2 mt-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
      required
    />
  </div>

  {/* Room Type */}
  <div className="flex flex-col w-full md:w-[150px]">
    <label className="font-medium">Room Type</label>
    <select
      value={roomType}
      onChange={(e) => setRoomType(e.target.value)}
      className="rounded border border-gray-300 dark:border-gray-700 px-3 py-2 mt-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800"
    >
      <option value="">Select Type</option>
      <option value="Single">Single</option>
      <option value="Double">Double</option>
      <option value="Deluxe">Deluxe</option>
    </select>
  </div>

  {/* Price Min */}
  <div className="flex flex-col w-full md:w-[120px]">
    <label className="font-medium">Price Min</label>
    <input
      type="number"
      min={0}
      value={priceMin}
      onChange={(e) => setPriceMin(e.target.value)}
      className="rounded border border-gray-300 dark:border-gray-700 px-3 py-2 mt-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
      placeholder="₹0"
    />
  </div>

  {/* Price Max */}
  <div className="flex flex-col w-full md:w-[120px]">
    <label className="font-medium">Price Max</label>
    <input
      type="number"
      min={0}
      value={priceMax}
      onChange={(e) => setPriceMax(e.target.value)}
      className="rounded border border-gray-300 dark:border-gray-700 px-3 py-2 mt-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
      placeholder="₹5000"
    />
  </div>

  {/* Search Button */}
  <button
    type="submit"
    className="md:ml-auto mt-3 md:mt-0 w-full md:w-fit px-6 py-2 text-white font-semibold rounded-lg
               bg-gradient-to-r from-cyan-500 to-indigo-600
               dark:from-violet-500 dark:to-fuchsia-600
               shadow-md hover:opacity-90 hover:scale-[1.02] transition-all flex items-center gap-2"
    disabled={loading}
  >
    {loading ? "Searching..." : "Search"}
  </button>
</form>

    </div>
  );
};

export default Hero;
