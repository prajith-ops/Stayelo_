import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../utils/axiosInterceptor";

const BookingTrendsChart = () => {
  const [range, setRange] = useState("1Y");
  const [data, setData] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // 📊 Fetch booking trends
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await axiosInstance.get("/bookings/trends");
        setData(res.data || []);
      } catch (error) {
        console.error("Error fetching booking trends:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  // ✅ Detect dark mode (via root <html> class)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    setDarkMode(document.documentElement.classList.contains("dark"));
    return () => observer.disconnect();
  }, []);

  // ✅ Filter data by range
  const filteredData = useMemo(() => {
    if (!data.length) return [];

    const now = new Date();
    const getMonthsAgo = (months) =>
      new Date(now.setMonth(now.getMonth() - months)).toISOString().slice(0, 7);

    switch (range) {
      case "3M":
        return data.slice(-3);
      case "6M":
        return data.slice(-6);
      case "1Y":
        return data.slice(-12);
      case "ALL":
        return data;
      default:
        return data.slice(-6);
    }
  }, [data, range]);

  const latestValue = filteredData.length
    ? filteredData[filteredData.length - 1].bookings
    : null;

  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
  };

  const strokeColor = darkMode ? "#e216c7" : "#06b6d4";

  return (
    <motion.div
      className="bg-white dark:bg-gray-900 shadow-md rounded-2xl p-5"
      variants={chartVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">
          Booking Trends
        </h3>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {["3M", "6M", "1Y", "ALL"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                range === r
                  ? "bg-blue-500 text-white shadow"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
          Loading chart...
        </div>
      ) : filteredData.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-10">
          No booking data available.
        </p>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={range}
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={filteredData}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: darkMode ? "#d1d5db" : "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: darkMode ? "#d1d5db" : "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#1f2937" : "#fff",
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    color: darkMode ? "#fff" : "#000",
                  }}
                  labelStyle={{
                    fontWeight: "600",
                    color: darkMode ? "#fff" : "#374151",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="none"
                  fill="url(#colorBookings)"
                />

                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke={strokeColor}
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive
                  animationDuration={600}
                />

                {latestValue && (
                  <ReferenceDot
                    x={filteredData[filteredData.length - 1].label}
                    y={latestValue}
                    r={4}
                    fill={strokeColor}
                    stroke={darkMode ? "#111" : "#fff"}
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
        Showing data for <span className="font-medium">{range}</span> range
      </p>
    </motion.div>
  );
};

export default BookingTrendsChart;
