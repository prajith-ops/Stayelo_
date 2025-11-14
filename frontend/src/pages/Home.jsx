import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInterceptor";
import Hero from "../components/Hero";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/Card";
import { StarIcon, MapPinIcon, CurrencyRupeeIcon } from "@heroicons/react/24/solid";

import { LuBrain } from "react-icons/lu";
import { MdOutlineSecurity } from "react-icons/md";
import { FaRegClock } from "react-icons/fa";
import { FiMail } from "react-icons/fi";
import { SiSimpleanalytics } from "react-icons/si";
import { HiOutlineDeviceMobile } from "react-icons/hi";
import { hotelRooms } from "../components/HotelRoomsDummy";
import { Button } from "../components/ui/Button";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Footer from "../components/Footer";


const Home = () => {
  const navigate = useNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay()]);
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const [recommendedRooms, setRecommendedRooms] = useState([]);
  const [preferredType, setPreferredType] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setPrevBtnEnabled(emblaApi.canScrollPrev());
      setNextBtnEnabled(emblaApi.canScrollNext());
    };

    emblaApi.on("select", onSelect);
    onSelect();
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  // fetch recommendations
  const fetchRecommendations = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsLoggedIn(false);
      setRecommendedRooms([]);
      setPreferredType("");
      setExplanation("");
      return;
    }

    setIsLoggedIn(true);

    try {
      setLoadingRecommendations(true);
      const response = await axiosInstance.get(
        "/recommendations"
      );

      setRecommendedRooms(response.data.recommendations || []);
      setPreferredType(response.data.preferredType || "");
      setExplanation(response.data.explanation || "");
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setIsLoggedIn(false);
      }
      setRecommendedRooms([]);
      setPreferredType("");
      setExplanation("");
    } finally {
      setLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();

    const onStorage = (e) => {
      if (e.key === "token" || e.key === null) fetchRecommendations();
    };

    const onAuthChanged = () => fetchRecommendations();

    window.addEventListener("storage", onStorage);
    window.addEventListener("authChanged", onAuthChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("authChanged", onAuthChanged);
    };
  }, []);

  const LoadingShimmer = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-cyan-100/40 dark:bg-gray-700 h-72 rounded-xl"
        />
      ))}
    </div>
  );
  const [rooms, setRooms] = useState([]);

useEffect(() => {
  const fetchRooms = async () => {
    try {
      const res = await axiosInstance.get("/rooms/public");
      setRooms(res.data);
    } catch (err) {
      console.log("Error fetching featured rooms:", err);
    }
  };
  fetchRooms();
}, []);

  return (
    <div className="
      min-h-screen 
      bg-gradient-to-b from-cyan-50 via-white to-cyan-100
      dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 
      dark:text-gray-100 text-gray-800
    ">
      <Hero />

      {/* ✅ LOGGED-IN RECOMMENDATIONS */}
      {isLoggedIn && (
        <div className="flex flex-col justify-center items-center mt-20 gap-10 pt-10 pb-20 px-6 md:px-16 lg:px-24 xl:px-32 w-full">
          <h1 className="
          text-4xl md:text-5xl font-extrabold 
          bg-gradient-to-r from-cyan-500 to-indigo-600 
          dark:from-violet-400 dark:to-fuchsia-500
          bg-clip-text text-transparent
        ">
            <LuBrain className="text-cyan-600 dark:text-violet-400 float-left mr-5" />
            Recommended for You
          </h1>

          {explanation && (
            <p className="text-gray-700 dark:text-gray-300 italic text-center max-w-2xl leading-relaxed">
              {explanation}
            </p>
          )}

          {preferredType && (
            <p className="text-gray-600 dark:text-gray-300 mt-1 text-center max-w-2xl">
              You often book{" "}
              <span className="font-semibold text-cyan-600 dark:text-violet-400">
                {preferredType}
              </span>{" "}
              rooms — here are similar options.
            </p>
          )}

          {loadingRecommendations ? (
            <LoadingShimmer />
          ) : recommendedRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
              {recommendedRooms.map((room) => (
                <Card
                  key={room._id}
                  className="rounded-xl overflow-hidden border border-cyan-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-xl hover:shadow-cyan-200/40 transition-all duration-300 dark:hover:shadow-fuchsia-200/40"
                >
                  <CardHeader className="p-0">
                    <img
                      src={room.images?.[0] || "/default-room.jpg"}
                      alt={room.type || room.name}
                      className="w-full h-48 object-cover"
                    />
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg font-semibold">
                      {room.type || room.name}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">
                      {room.location}
                    </CardDescription>
                    <p className="text-cyan-700 font-bold mt-2 dark:text-violet-300">
                      ₹{room.price} / night
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      ⭐ {room.rating || "4.5"}
                    </p>
                  </CardContent>
                  <div className="flex justify-between items-center p-4">
                    <Button
                      className="bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-violet-500 dark:hover:bg-violet-600"
                      onClick={() => navigate(`/roomdetails/${room._id}`)}
                    >
                      Book Now
                    </Button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {room.guests || 2} Guests
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center">
              No AI recommendations available yet — try booking a few rooms
              first.
            </p>
          )}
        </div>
      )}

      {/* ✅ LOGGED-OUT VIEW */}
      {!isLoggedIn && (
        <>
          {/* 🔹 Why Choose Stayelo Section (only when logged out) */}
          <div className="flex flex-col justify-center items-center pt-20 gap-10 dark:bg-gray-900 px-6 md:px-16 lg:px-24 xl:px-32 w-full">
            <h1 className="
          text-4xl md:text-5xl font-extrabold 
          bg-gradient-to-r from-cyan-500 to-indigo-600 
          dark:from-violet-400 dark:to-fuchsia-500
          bg-clip-text text-transparent p-5
        ">
              Why Choose Stayelo ?
            </h1>
            <p className="text-gray-600 dark:text-gray-300  text-center">
              Experience the perfect blend of luxury, technology, and personalized service.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 w-full">
              <Card className="flex justify-center items-center shadow-none border-none bg-white dark:bg-gray-800">
                <CardHeader className="flex items-center gap-4">
                  <LuBrain className="text-blue-500 text-4xl" />
                  <CardTitle>AI-Powered Recommendations</CardTitle>
                </CardHeader>
                <CardDescription className="text-center text-gray-700 dark:text-gray-300">
                  Smart suggestions tailored to your preferences, ensuring you find the perfect stay every time.
                </CardDescription>
              </Card>

              <Card className="flex justify-center items-center shadow-none border-none bg-white dark:bg-gray-800">
                <CardHeader className="flex items-center gap-4">
                  <MdOutlineSecurity className="text-blue-500 text-4xl" />
                  <CardTitle>Secure Booking</CardTitle>
                </CardHeader>
                <CardDescription className="text-center text-gray-700 dark:text-gray-300">
                  JWT authentication ensures your data and transactions are safe and secure.
                </CardDescription>
              </Card>

              <Card className="flex justify-center items-center shadow-none border-none bg-white dark:bg-gray-800">
                <CardHeader className="flex items-center gap-4">
                  <FaRegClock className="text-blue-500 text-4xl" />
                  <CardTitle>24/7 Support</CardTitle>
                </CardHeader>
                <CardDescription className="text-center text-gray-700 dark:text-gray-300">
                  Round-the-clock customer service and instant booking confirmations for a hassle-free experience.
                </CardDescription>
              </Card>

              <Card className="flex justify-center items-center shadow-none border-none bg-white dark:bg-gray-800">
                <CardHeader className="flex items-center gap-4">
                  <div className="bg-fuchsia-100 rounded-full p-3 flex items-center justify-center w-12 h-12">
                    <FiMail className="text-fuchsia-800 w-6 h-6" />
                  </div>
                  <CardTitle>Email Notifications</CardTitle>
                </CardHeader>
                <CardDescription className="text-center text-gray-700 dark:text-gray-300">
                  Instant email alerts for bookings, promotions, and updates to keep you informed.
                </CardDescription>
              </Card>

              <Card className="flex justify-center items-center shadow-none border-none bg-white dark:bg-gray-800">
                <CardHeader className="flex items-center gap-4">
                  <div className="bg-orange-100 rounded-full p-3 flex items-center justify-center w-12 h-12">
                    <SiSimpleanalytics className="text-orange-800 w-6 h-6" />
                  </div>
                  <CardTitle>Analytics Dashboard</CardTitle>
                </CardHeader>
                <CardDescription className="text-center text-gray-700 dark:text-gray-300">
                  Comprehensive reporting and revenue analytics for administrators to optimize operations.
                </CardDescription>
              </Card>

              <Card className="flex justify-center items-center shadow-none border-none bg-white dark:bg-gray-800">
                <CardHeader className="flex items-center gap-4">
                  <div className="bg-purple-100 rounded-full p-3 flex items-center justify-center w-12 h-12">
                    <HiOutlineDeviceMobile className="text-purple-500 w-6 h-6" />
                  </div>
                  <CardTitle>Mobile Optimized</CardTitle>
                </CardHeader>
                <CardDescription className="text-center text-gray-700 dark:text-gray-300">
                  Fully responsive design for seamless booking experiences on any device.
                </CardDescription>
              </Card>
            </div>
          </div>

          {/* ✅ FEATURED HOTELS */}
<div className="flex flex-col justify-center items-center  gap-10 pt-20 pb-20 w-full  dark:bg-gray-900">
  <h1 className="
          text-4xl md:text-5xl font-extrabold 
          bg-gradient-to-r from-cyan-500 to-indigo-600 
          dark:from-violet-400 dark:to-fuchsia-500
          bg-clip-text text-transparent
        ">
    Featured Hotels
  </h1>

  <div className="relative w-5/6">
    {/* Embla Viewport */}
    <div className="overflow-hidden w-full" ref={emblaRef}>
      <div className="embla__container flex">

        {rooms && rooms.length > 0 ? (
          rooms.slice(0, 6).map((room) => (
            <div
              key={room._id}
              className="embla__slide min-w-[80%] sm:min-w-[50%] lg:min-w-[33%] px-4"
            >
              <div
                className="
                  bg-white/85 backdrop-blur-lg 
                  dark:bg-gray-800/60 
                  border border-cyan-200/40 dark:border-gray-700 
                  rounded-2xl shadow-md hover:shadow-xl
                  transition-all transform hover:-translate-y-2 
                  overflow-hidden flex flex-col
                "
              >
                {/* IMAGE */}
                {room.images?.length ? (
                  <img
                    src={room.images[0]}
                    alt={room.type}
                    className="w-full h-52 object-cover"
                  />
                ) : (
                  <div className="w-full h-52 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                    No Image Available
                  </div>
                )}

                {/* BODY */}
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="text-lg font-bold text-cyan-700 dark:text-violet-300">
                    {room.type}
                  </h2>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4 text-cyan-500 dark:text-gray-400" />
                    {room.location}
                  </p>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 flex-1">
                    {(room.description || "").slice(0, 70)}...
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <StarIcon className="w-4 h-4" />
                      <span>{room.rating || "4.0"}</span>
                    </div>

                    <div className="flex items-center text-gray-800 dark:text-gray-200 font-semibold gap-1">
                      <CurrencyRupeeIcon className="w-4 h-4" />
                      {room.price}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        /night
                      </span>
                    </div>
                  </div>

                  {/* BUTTON */}
                  <button
                    className="mt-5 w-full py-2 text-sm font-semibold rounded-lg
                    bg-gradient-to-r from-cyan-500 to-indigo-600 
                    dark:from-violet-500 dark:to-fuchsia-600 
                    text-white hover:opacity-90 hover:scale-[1.02]
                    transition-all duration-200"
                    onClick={() => navigate(`/roomdetails/${room._id}`)}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No featured rooms available.
          </p>
        )}
      </div>
    </div>

    {/* BUTTONS */}
    <button
      onClick={scrollPrev}
      disabled={!prevBtnEnabled}
      className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/90 dark:bg-gray-700/80 p-2 rounded-full shadow disabled:opacity-40"
    >
      <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-white" />
    </button>

    <button
      onClick={scrollNext}
      disabled={!nextBtnEnabled}
      className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/90 dark:bg-gray-700/80 p-2 rounded-full shadow disabled:opacity-40"
    >
      <ChevronRight className="w-6 h-6 text-gray-700 dark:text-white" />
    </button>
  </div>
</div>

        </>
      )}

      <Footer />
    </div>
  );
};

export default Home;
