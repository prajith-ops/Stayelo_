import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Rooms from "../components/Rooms";
import BookingPage from "../components/BookingPage";
import CustomerManagementPage from "../components/CustomerManagementPage";
import ReportCard from "../components/ReportCard";
import BookingTrendsChart from "../components/BookingTrendsChart";
import RevenueBreakdownChart from "../components/RevenueBreakdownChart";
import RoomOccupancyBar from "../components/RoomOccupancyBar";
import DatePicker from "react-datepicker";
import { motion } from "framer-motion";
import "react-datepicker/dist/react-datepicker.css";
import axiosInstance from "../utils/axiosInterceptor";
import jsPDF from "jspdf";
import { io } from "socket.io-client";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [range, setRange] = useState("30days");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    occupancyRate: "0%",
    totalRevenue: 0,
    totalRooms: 0,
  });
  const [loading, setLoading] = useState(true);

  // --- Live Chat ---
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef(null);

  const ranges = [
    { label: "Last 7 Days", value: "7days" },
    { label: "Last 30 Days", value: "30days" },
    { label: "This Quarter", value: "quarter" },
    { label: "Custom Range", value: "custom" },
  ];

  const handleRangeSelect = (value) => {
    setRange(value);
    if (value !== "custom") {
      setStartDate(null);
      setEndDate(null);
    }
  };

  // ================= FETCH DASHBOARD DATA =================
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [bookingsRes, roomsRes] = await Promise.all([
        axiosInstance.get("/bookings"),
        axiosInstance.get("/rooms"),
      ]);

      const bookings = bookingsRes.data?.bookings || [];
      const rooms = roomsRes.data?.rooms || [];

      const today = new Date().toISOString().split("T")[0];

      const todayCheckIns = bookings.filter(
        (b) => b.checkIn?.split("T")[0] === today
      ).length;

      const todayCheckOuts = bookings.filter(
        (b) => b.checkOut?.split("T")[0] === today
      ).length;

      const confirmedBookings = bookings.filter(
        (b) => b.status?.toUpperCase() === "CONFIRMED"
      ).length;

      const occupancyRate =
        rooms.length > 0
          ? `${Math.round((confirmedBookings / rooms.length) * 100)}%`
          : "0%";

      const totalRevenue = bookings.reduce(
        (sum, b) => sum + (b.room?.price || 0),
        0
      );

      setStats({
        totalBookings: bookings.length,
        todayCheckIns,
        todayCheckOuts,
        occupancyRate,
        totalRevenue,
        totalRooms: rooms.length,
      });
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ================= SOCKET.IO =================
  useEffect(() => {
    fetchDashboardData();
    socketRef.current = io("http://localhost:4000");

    socketRef.current.on("connect", () => {
      console.log("✅ Connected to live dashboard socket");
    });

    socketRef.current.on("dashboardUpdate", (update) => {
      setStats((prev) => ({ ...prev, ...update }));
    });

    socketRef.current.on("chat_history", (history) => {
      setMessages(history);
    });

    socketRef.current.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on("disconnect", () => {
      console.log("⚠️ Disconnected from socket");
    });

    return () => socketRef.current.disconnect();
  }, []);

  // ================= SEND CHAT MESSAGE =================
  const handleSendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit("send_message", {
      sender: "Admin",
      text: newMessage.trim(),
      timestamp: new Date(),
    });

    setNewMessage("");
  };

  // ================= EXPORT REPORT TO PDF =================
  const handleExport = () => {
    const doc = new jsPDF("p", "pt", "a4");

    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 595, 70, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Stayleo Admin Dashboard Report", 40, 45);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    let y = 110;

    const formattedDate = new Date().toLocaleString("en-IN", {
      dateStyle: "long",
      timeStyle: "short",
    });

    const paragraph = `
Over the past ${
      range === "custom"
        ? `${startDate?.toLocaleDateString()} to ${endDate?.toLocaleDateString()}`
        : range === "7days"
        ? "7 days"
        : range === "30days"
        ? "30 days"
        : "few weeks"
    }, Stayleo Hotel recorded a total of ${stats.totalBookings} bookings.

Today, there were ${stats.todayCheckIns} check-ins and ${stats.todayCheckOuts} check-outs.

The current occupancy rate stands at ${stats.occupancyRate}.

Total revenue generated: ₹${stats.totalRevenue.toLocaleString()}, with ${stats.totalRooms} rooms actively available.

Generated on ${formattedDate}.
`;

    const lines = doc.splitTextToSize(paragraph.trim(), 520);
    doc.text(lines, 40, y);

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(
      "Stayleo Admin Report | Generated Automatically | © 2025 Stayleo",
      40,
      810
    );

    doc.save(`Stayleo_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 text-gray-800 dark:text-gray-100 pt-32">
      
      {/* Hamburger toggle for mobile */}
      <button
        className="md:hidden fixed top-23 left-4 z-50 bg-gray-200 dark:bg-gray-800 p-2 rounded shadow-md"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
      </button>

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onSectionSelect={setActiveSection}
        activeSection={activeSection}
      />

      {/* Main content */}
      <main
        className={`flex-1 p-4 md:p-8 space-y-8 overflow-y-auto transition-all duration-300 ${
          sidebarOpen ? "md:ml-64" : "md:ml-16"
        } ml-0`}
      >
        {/* === DASHBOARD === */}
        {activeSection === "dashboard" && (
          <>
            {loading ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                Loading data...
              </p>
            ) : (
              <>
                {/* STATS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {[
                    { label: "Total Bookings", value: stats.totalBookings, color: "bg-indigo-500" },
                    { label: "Today's Check-ins", value: stats.todayCheckIns, color: "bg-green-500" },
                    { label: "Today's Check-outs", value: stats.todayCheckOuts, color: "bg-red-500" },
                    { label: "Occupancy Rate", value: stats.occupancyRate, color: "bg-yellow-500" },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all p-6 text-center"
                    >
                      <div className={`w-12 h-12 mx-auto rounded-full ${stat.color} mb-3`} />
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.label}</h3>
                      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* BOOKING TRENDS */}
                <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-cyan-600 dark:text-fuchsia-400">
                      Booking Trends Overview
                    </h2>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Visualized over time
                    </span>
                  </div>
                  <div className="h-96 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <BookingTrendsChart range={range} startDate={startDate} endDate={endDate} />
                  </div>
                </section>

                {/* LIVE CHAT */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 mt-8">
                  <h2 className="text-xl font-semibold text-cyan-600 dark:text-fuchsia-400 mb-4">
                    Live Chat
                  </h2>
                  <div className="h-64 overflow-y-auto mb-4 border rounded-lg p-2 bg-gray-50 dark:bg-gray-900">
                    {messages.map((msg, idx) => (
                      <div key={idx} className="mb-2">
                        <span className="font-bold">{msg.sender}:</span>{" "}
                        <span>{msg.text}</span>
                        <div className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none dark:bg-gray-700 dark:text-gray-100"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                      Send
                    </button>
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {activeSection === "rooms" && <Rooms />}
        {activeSection === "booking" && <BookingPage />}
        {activeSection === "customers" && <CustomerManagementPage />}

        {/* REPORTS */}
        {activeSection === "reports" && (
          <>
            <div className="flex justify-between items-center">
              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-500 to-indigo-600 dark:from-violet-400 dark:to-fuchsia-500 bg-clip-text text-transparent pb-5">
                Reports & Analytics
              </h1>
              <button
                onClick={handleExport}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Export
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {ranges.map((r) => (
                <button
                  key={r.value}
                  onClick={() => handleRangeSelect(r.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    range === r.value
                      ? "bg-blue-100 text-blue-600"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {r.label}
                </button>
              ))}

              {range === "custom" && (
                <motion.div className="flex items-center gap-3" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">From:</span>
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      placeholderText="Start Date"
                      className="border px-3 py-2 rounded-lg text-sm w-36 focus:ring-2 focus:ring-blue-400 outline-none dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">To:</span>
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      placeholderText="End Date"
                      className="border px-3 py-2 rounded-lg text-sm w-36 focus:ring-2 focus:ring-blue-400 outline-none dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 dark:text-gray-900 mt-4">
              <ReportCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} change="+5.2%" positive />
              <ReportCard
                title="Average Booking Value"
                value={`₹${
                  stats.totalBookings > 0
                    ? Math.round(stats.totalRevenue / stats.totalBookings).toLocaleString()
                    : 0
                }`}
                change="+3.1%"
                positive
              />
              <ReportCard title="Monthly Growth Rate" value="+6.4%" change="+1.8%" positive />
              <ReportCard title="Total Bookings" value={stats.totalBookings} change="+8.0%" positive />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <RevenueBreakdownChart />
              <RoomOccupancyBar />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
