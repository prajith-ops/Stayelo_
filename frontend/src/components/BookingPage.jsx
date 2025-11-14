import React, { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../utils/axiosInterceptor";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  CalendarIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/solid";

export default function BookingDashboard() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [viewBooking, setViewBooking] = useState(null);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const dateDropdownRef = useRef(null);

  const itemsPerPage = 5;
  const [startDate, endDate] = dateRange;
  const token = localStorage.getItem("token");

  // Detect dark mode
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

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axiosInstance.get("/bookings", {
          params: { t: Date.now() },
        });
        if (res.data && res.data.success) setBookings(res.data.bookings);
      } catch (err) {
        console.error("❌ Error fetching bookings:", err);
      }
    };
    fetchBookings();
  }, [token]);

  // Close date picker when clicked outside
  useEffect(() => {
    const outside = (e) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setShowDateDropdown(false);
      }
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const formatDateNice = (d) => (d ? new Date(d).toLocaleDateString() : "");

  const statusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
        return "bg-green-100 dark:bg-green-700 dark:text-green-100 text-green-700";
      case "CHECKED_IN":
        return "bg-blue-100 dark:bg-blue-700 dark:text-blue-100 text-blue-700";
      case "CHECKED_OUT":
        return "bg-gray-100 dark:bg-gray-700 dark:text-gray-100 text-gray-700";
      case "CANCELLED":
        return "bg-red-100 dark:bg-red-700 dark:text-red-100 text-red-700";
      case "PENDING":
        return "bg-yellow-100 dark:bg-yellow-600 dark:text-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 dark:bg-gray-700 dark:text-gray-100 text-gray-700";
    }
  };

  const matchesRange = (dateStr) => {
    if (!startDate && !endDate) return true;
    const d = new Date(dateStr);
    if (startDate && endDate) return d >= startDate && d <= endDate;
    if (startDate) return d >= startDate;
    return true;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesSearch =
        !q ||
        b.user?.email?.toLowerCase().includes(q) ||
        b._id?.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || b.status === statusFilter;
      const matchesCheckin = matchesRange(b.checkIn);
      return matchesSearch && matchesStatus && matchesCheckin;
    });
  }, [bookings, search, statusFilter, startDate, endDate]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setDateRange([null, null]);
  };

  const startEdit = (row) => {
    setEditingId(row._id);
    setEditedData({ ...row });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditedData({});
  };

  const saveEdit = async (id) => {
    try {
      const res = await axiosInstance.put(
        `/bookings/${id}`,
        { status: editedData.status }
      );
      const updatedBooking = res.data.booking;
      if (updatedBooking) {
        setBookings((prev) => prev.map((p) => (p._id === id ? updatedBooking : p)));
      }
      cancelEdit();
    } catch (err) {
      console.error("❌ Error updating booking:", err);
    }
  };

  const deleteBooking = async (id) => {
    try {
      await axiosInstance.delete(`/bookings/${id}`);
      setBookings((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      console.error("❌ Error deleting booking:", err);
    }
  };

  const handleChange = (e, field) => setEditedData({ ...editedData, [field]: e.target.value });

  const openView = (b) => setViewBooking(b);
  const closeView = () => setViewBooking(null);

  return (
    <div className={`min-h-screen  ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold
          bg-gradient-to-r from-cyan-500 to-indigo-600
          dark:from-violet-400 dark:to-fuchsia-500
          bg-clip-text text-transparent p-5">Booking Management</h1>
        </div>

        {/* Filters */}
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow px-4 py-4 mb-6 flex flex-col md:flex-row gap-3 md:items-center`}>
          <input
            type="text"
            placeholder="Search by email or booking ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border rounded-lg px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none"
          />
          <div className="relative" ref={dateDropdownRef}>
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
            >
              <CalendarIcon className="h-5 w-5 text-gray-500 dark:text-gray-300" />
              <span className="text-sm">
                {startDate && endDate
                  ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                  : "Select date"}
              </span>
            </button>
            {showDateDropdown && (
              <div className="absolute mt-2 z-40 bg-white dark:bg-gray-700 border rounded-lg shadow p-2">
                <DatePicker
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={setDateRange}
                  inline
                  className="bg-white dark:bg-gray-700"
                />
                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => setDateRange([null, null])}
                    className="text-sm px-2 py-1 text-gray-600 dark:text-gray-300"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowDateDropdown(false)}
                    className="text-sm px-2 py-1 text-blue-600 dark:text-blue-400"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">All Status</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CHECKED_IN">CHECKED_IN</option>
            <option value="CHECKED_OUT">CHECKED_OUT</option>
            <option value="PENDING">PENDING</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button
            onClick={clearFilters}
            className="border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 text-sm"
          >
            Clear Filters
          </button>
        </div>

        {/* Booking Table */}
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto`}>
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 dark:bg-gray-700 text-sm text-left text-gray-700 dark:text-gray-200">
              <tr>
                <th className="p-3 font-medium">Booking ID</th>
                <th className="p-3 font-medium">User</th>
                <th className="p-3 font-medium">Room</th>
                <th className="p-3 font-medium">Check-in</th>
                <th className="p-3 font-medium">Check-out</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {paginated.map((b) => {
                const isEditing = editingId === b._id;
                return (
                  <tr
                    key={b._id}
                    className={`border-b transition ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <td className="p-3">{b._id}</td>
                    <td className="p-3 font-medium">{b.user?.email}</td>
                    <td className="p-3">{b.room?.type || "—"}</td>
                    <td className="p-3">{formatDateNice(b.checkIn)}</td>
                    <td className="p-3">{formatDateNice(b.checkOut)}</td>
                    <td className="p-3">
                      {isEditing ? (
                        <select
                          value={editedData.status}
                          onChange={(e) => handleChange(e, "status")}
                          className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-700 dark:text-gray-100"
                        >
                          <option>CONFIRMED</option>
                          <option>CHECKED_IN</option>
                          <option>CHECKED_OUT</option>
                          <option>CANCELLED</option>
                          <option>PENDING</option>
                        </select>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClass(
                            b.status
                          )}`}
                        >
                          {b.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(b._id)}
                              className="p-2 bg-green-50 dark:bg-green-700 text-green-600 dark:text-green-100 rounded-lg hover:bg-green-100 dark:hover:bg-green-600"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => openView(b)}
                              className="p-2 bg-blue-50 dark:bg-blue-700 text-blue-600 dark:text-blue-100 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-600"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => startEdit(b)}
                              className="p-2 bg-yellow-50 dark:bg-yellow-600 text-yellow-600 dark:text-yellow-100 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-500"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => deleteBooking(b._id)}
                              className="p-2 bg-red-50 dark:bg-red-700 text-red-600 dark:text-red-100 rounded-lg hover:bg-red-100 dark:hover:bg-red-600"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className={`flex justify-between items-center px-4 py-3 border-t ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 text-gray-600 border-gray-200"} text-sm`}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Prev
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Next <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* View Modal */}
        {viewBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-11/12 max-w-lg p-6 relative">
              <button
                onClick={closeView}
                className="absolute top-3 right-3 text-gray-500 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
              <p><strong>User:</strong> {viewBooking.user?.email}</p>
              <p><strong>Room:</strong> {viewBooking.room?.type}</p>
              <p><strong>Check-in:</strong> {formatDateNice(viewBooking.checkIn)}</p>
              <p><strong>Check-out:</strong> {formatDateNice(viewBooking.checkOut)}</p>
              <p><strong>Status:</strong> {viewBooking.status}</p>
              <div className="mt-4 text-center">
                <button
                  onClick={closeView}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
