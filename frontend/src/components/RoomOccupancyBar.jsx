import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInterceptor";
import { Moon, Sun, Loader2 } from "lucide-react";

const RoomOccupancyBar = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [occupancyData, setOccupancyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchOccupancy = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const token = localStorage.getItem("token");

        if (!token) {
          console.warn("No admin token found in localStorage!");
          setErrorMsg("Admin token missing. Please login as admin.");
          setLoading(false);
          return;
        }

        console.log("Fetching rooms from backend with token...", token);

        // Fetch all rooms (admin route)
        const res = await axiosInstance.get("/rooms");

        console.log("Raw response: ", res);
        const rooms = res.data || [];
        console.log("Rooms data received: ", rooms);

        if (!rooms.length) {
          setOccupancyData([]);
          return;
        }

        // Group by room type and calculate occupancy
        const grouped = rooms.reduce((acc, room) => {
          console.log("Processing room: ", room);
          const type = room.type || "Unknown";
          const capacity = room.capacity || 1;
          const isOccupied = !room.available;

          if (!acc[type]) acc[type] = { total: 0, occupied: 0 };

          acc[type].total += capacity;
          if (isOccupied) acc[type].occupied += capacity;

          console.log(`Grouped stats for ${type}: `, acc[type]);
          return acc;
        }, {});

        // Convert to array for rendering
        const formatted = Object.entries(grouped).map(([type, stats]) => {
          const rate =
            stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;
          console.log(`Formatted ${type}: ${rate}% occupied`);
          return { type, rate };
        });

        console.log("Final occupancy data: ", formatted);
        setOccupancyData(formatted);
      } catch (err) {
        console.error(
          "Error fetching occupancy data:",
          err.response?.data || err.message
        );
        if (err.response?.status === 401) {
          setErrorMsg("Unauthorized. Admin token is invalid or expired.");
        } else {
          setErrorMsg("Failed to fetch occupancy data. Check console for details.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOccupancy();
  }, []);

  return (
    <div
      className={`p-5 rounded-2xl shadow-xl transition-all duration-500 ${
        darkMode
          ? "bg-gray-900/90 border border-gray-700 text-gray-100"
          : "bg-white border border-gray-200 text-gray-800"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3
          className={`font-semibold text-lg ${
            darkMode ? "text-indigo-400" : "text-indigo-600"
          }`}
        >
          Occupancy by Room Type
        </h3>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-full border ${
            darkMode ? "border-gray-500" : "border-gray-300"
          } hover:scale-110 transition`}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8 text-gray-400">
          <Loader2 className="animate-spin mr-2" size={18} />
          Loading occupancy data...
        </div>
      ) : errorMsg ? (
        <p className="text-center text-red-500 py-4">{errorMsg}</p>
      ) : occupancyData.length === 0 ? (
        <p className="text-center text-gray-500 py-4">
          No occupancy data available.
        </p>
      ) : (
        <div className="space-y-5">
          {occupancyData.map((room) => (
            <div key={room.type}>
              <div className="flex justify-between text-sm mb-1">
                <span
                  className={`font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {room.type}
                </span>
                <span
                  className={`font-semibold ${
                    darkMode ? "text-indigo-300" : "text-indigo-600"
                  }`}
                >
                  {room.rate}% occupied
                </span>
              </div>

              <div
                className={`w-full h-2 rounded-full transition-all duration-500 ${
                  darkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    darkMode ? "bg-indigo-500" : "bg-indigo-400"
                  }`}
                  style={{ width: `${room.rate}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomOccupancyBar;
