import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInterceptor";
import { Edit, Trash2, Plus, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [newRoom, setNewRoom] = useState({
    type: "Single",
    price: "",
    location: "",
    description: "",
    amenities: "",
    rating: "",
    available: true,
  });

  // ===================== FETCH ROOMS =====================
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axiosInstance.get("/rooms");
        setRooms(res.data);
      } catch (err) {
        console.error("Error fetching rooms:", err.response?.data || err.message);
      }
    };
    fetchRooms();
  }, []);

  // ===================== HANDLERS =====================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRoom((prev) => ({
      ...prev,
      [name]: name === "available" ? value === "true" : value,
    }));
  };

  const handleFileChange = (e) => setImages([...e.target.files]);

  // ===================== ADD OR UPDATE ROOM =====================
  const handleSaveRoom = async () => {
    if (!newRoom.price || !newRoom.location || !newRoom.description)
      return alert("Please fill in all required fields.");

    if (!editingRoom && images.length === 0)
      return alert("Please upload at least one image for new rooms.");

    try {
      setLoading(true);
      const formData = new FormData();
      Object.entries(newRoom).forEach(([key, value]) => formData.append(key, value));
      images.forEach((file) => formData.append("images", file));

      const token = localStorage.getItem("token");
      let res;

      if (editingRoom) {
        res = await axiosInstance.put(
          `/rooms/${editingRoom._id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        const updated = res.data.room || res.data;
        setRooms((prev) => prev.map((r) => (r._id === editingRoom._id ? updated : r)));
      } else {
        res = await axiosInstance.post("/rooms", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        const addedRoom = res.data.room || res.data;
        setRooms((prev) => [addedRoom, ...prev]);
      }

      setNewRoom({
        type: "Single",
        price: "",
        location: "",
        description: "",
        amenities: "",
        rating: "",
        available: true,
      });
      setImages([]);
      setEditingRoom(null);
      setModalOpen(false);
    } catch (err) {
      console.error("Error saving room:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to save room.");
    } finally {
      setLoading(false);
    }
  };

  // ===================== DELETE ROOM =====================
  const handleDeleteRoom = async (roomId) => {
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.delete(`/rooms/${roomId}`);
      setRooms((prev) => prev.filter((r) => r._id !== roomId));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Error deleting room:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to delete room.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-8 transition-colors duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="
          text-4xl md:text-5xl font-extrabold 
          bg-gradient-to-r from-cyan-500 to-indigo-600 
          dark:from-violet-400 dark:to-fuchsia-500
          bg-clip-text text-transparent pb-5
        ">
          Manage Rooms
        </h1>
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => {
            setEditingRoom(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <Plus size={18} /> Add New Room
        </motion.button>
      </div>

      {/* Room Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {rooms.map((room) => (
          <motion.div
            key={room._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, boxShadow: "0px 15px 25px rgba(47, 217, 223, 0.2)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden cursor-pointer"
          >
            <img
              src={
                room.images?.[0] ||
                "https://res.cloudinary.com/demo/image/upload/v1730512762/stayelo/rooms/default_room.jpg"
              }
              alt="Room"
              className="h-48 w-full object-cover"
            />
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {room.type}
              </h2>
              <p className="text-sm text-gray-500">{room.location}</p>

              <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 line-clamp-2">
                {room.description}
              </p>

              {room.amenities && (
                <p className="text-xs text-gray-500 mt-2">
                  {Array.isArray(room.amenities)
                    ? room.amenities.join(" • ")
                    : room.amenities}
                </p>
              )}

              <div className="flex items-center gap-1 text-yellow-500 mt-3">
                <Star size={18} fill="currentColor" />
                <span className="text-gray-800 dark:text-gray-100 font-medium">
                  {room.rating || "N/A"}
                </span>
              </div>

              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">
                ₹{room.price}
                <span className="text-sm font-normal text-gray-500 ml-1">
                  /night
                </span>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-5">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setEditingRoom(room);
                    setNewRoom({
                      type: room.type,
                      price: room.price,
                      location: room.location,
                      description: room.description,
                      amenities: Array.isArray(room.amenities)
                        ? room.amenities.join(", ")
                        : room.amenities,
                      rating: room.rating,
                      available: room.available,
                    });
                    setModalOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-medium py-2 rounded-lg shadow-md hover:shadow-lg"
                >
                  <Edit size={18} /> Edit
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmDelete(room)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 text-white font-medium py-2 rounded-lg shadow-md hover:shadow-lg"
                >
                  <Trash2 size={18} /> Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                {editingRoom ? "Edit Room" : "Add New Room"}
              </h2>

              <div className="space-y-3">
                <input
                  type="text"
                  name="type"
                  placeholder="Room Type*"
                  value={newRoom.type}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="number"
                  name="price"
                  placeholder="Price per Night*"
                  value={newRoom.price}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="text"
                  name="location"
                  placeholder="Location*"
                  value={newRoom.location}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white"
                />
                <textarea
                  name="description"
                  placeholder="Description*"
                  value={newRoom.description}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white"
                ></textarea>
                <input
                  type="text"
                  name="amenities"
                  placeholder="Amenities (comma separated)"
                  value={newRoom.amenities}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="number"
                  name="rating"
                  placeholder="Rating (0–5)"
                  value={newRoom.rating}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white"
                />
                <select
                  name="available"
                  value={newRoom.available}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white"
                >
                  <option value="true">Available</option>
                  <option value="false">Not Available</option>
                </select>

                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => setModalOpen(false)}
                  className="bg-gray-300 dark:bg-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRoom}
                  disabled={loading}
                  className={`${
                    loading
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  } text-white px-5 py-2 rounded-md font-semibold transition`}
                >
                  {loading
                    ? editingRoom
                      ? "Updating..."
                      : "Adding..."
                    : editingRoom
                    ? "Update Room"
                    : "Add Room"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          >
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-2xl text-center w-full max-w-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete “{confirmDelete.type}” Room?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="bg-gray-300 dark:bg-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteRoom(confirmDelete._id)}
                  className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-5 py-2 rounded-md hover:from-red-600 hover:to-pink-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Rooms;
