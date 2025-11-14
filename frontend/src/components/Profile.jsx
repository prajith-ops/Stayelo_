import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit, Save, X, Phone, MapPin, LogOut, Camera } from "lucide-react";
import axiosInstance from "../utils/axiosInterceptor";

const Profile = ({ open, onClose, onProfileUpdate }) => {
  const [flipped, setFlipped] = useState(false);
  const [profilePic, setProfilePic] = useState("/default-profile.png"); // default image
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [picFile, setPicFile] = useState(null);
  const [picVersion, setPicVersion] = useState(Date.now()); // cache-busting

  // Fetch user profile
  useEffect(() => {
    const fetchUser = async () => {
      // Try localStorage first
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setFormData(parsedUser);
        setProfilePic(parsedUser.profilePic || profilePic);
        setLoading(false); // Done loading immediately
        return;
      }

      // If no local user, fetch from backend
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axiosInstance.get("/auth/profile");
        const userData = res.data;
        setUser(userData);
        setFormData(userData);
        setProfilePic(userData.profilePic || profilePic);
        localStorage.setItem("user", JSON.stringify(userData));
        onProfileUpdate?.(userData);
      } catch (err) {
        console.error("❌ Error fetching profile:", err);
        alert(err.response?.data?.message || "Failed to fetch user profile.");
      } finally {
        setLoading(false);
      }
    };

    if (open) fetchUser(); // fetch only when modal opens
  }, [open, onProfileUpdate]);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(URL.createObjectURL(file)); // preview
      setPicFile(file); // store file for upload
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("You are not logged in!");

    try {
      const data = new FormData();
      data.append("name", formData.name || "");
      data.append("phone", formData.phone || "");
      data.append("location", formData.location || "");
      if (picFile) data.append("profilePic", picFile);

      const res = await axiosInstance.put(
        "/auth/update-profile",
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedUser = res.data.user;
      setUser(updatedUser);
      setFormData(updatedUser);
      setFlipped(false);
      setPicFile(null);
      setProfilePic(updatedUser.profilePic || profilePic);
      setPicVersion(Date.now());
      localStorage.setItem("user", JSON.stringify(updatedUser));
      onProfileUpdate?.(updatedUser);
      alert("✅ Profile updated successfully!");
    } catch (err) {
      console.error("❌ Error updating profile:", err);
      alert(err.response?.data?.message || "Error updating profile.");
    }
  };

  const handleCancel = () => {
    setFormData({ ...user });
    setProfilePic(user?.profilePic || profilePic);
    setPicFile(null);
    setFlipped(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  if (!open) return null;
  if (loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 text-white text-lg">
        Loading profile...
      </div>
    );
  if (!user) return null;

  const profilePicSrc = profilePic; // Cloudinary URL or default image

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: -80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative w-full max-w-md h-[550px]"
            style={{ perspective: "1000px" }}
          >
            <motion.div
              className="absolute w-full h-full"
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* FRONT SIDE */}
              <div
                className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 text-center text-gray-800 dark:text-gray-100"
                style={{ backfaceVisibility: "hidden" }}
              >
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
                <div className="relative w-32 h-32 mx-auto mt-4">
                  <img
                    src={profilePicSrc}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-green-100 dark:border-green-700 shadow-md"
                  />
                  <label
                    htmlFor="profilePicUpload"
                    className="absolute bottom-1 right-2 bg-green-600 hover:bg-green-700 text-white p-2 rounded-full cursor-pointer shadow-md"
                  >
                    <Camera size={16} />
                  </label>
                  <input
                    id="profilePicUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    className="hidden"
                  />
                </div>
                <h3 className="font-semibold text-lg mt-4">{user.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{user.email}</p>
                <div className="mt-4 space-y-2 text-sm text-left">
                  <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                    <Phone className="mr-2 text-gray-400 dark:text-gray-500" size={16} />
                    <span>{user.phone || "Phone not added"}</span>
                  </div>
                  <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                    <MapPin className="mr-2 text-gray-400 dark:text-gray-500" size={16} />
                    <span>{user.location || "No location set"}</span>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={() => setFlipped(true)}
                    className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-medium py-2 rounded-lg flex items-center justify-center transition-all"
                  >
                    <Edit size={16} className="mr-2" /> Edit Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg flex items-center justify-center transition-all"
                  >
                    <LogOut size={16} className="mr-2" /> Sign Out
                  </button>
                </div>
              </div>

              {/* BACK SIDE */}
              <div
                className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 text-gray-800 dark:text-gray-100"
                style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
              >
                <h2 className="text-center text-xl font-semibold mb-4">Edit Profile</h2>
                <div className="space-y-4 text-left">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                    <input
                      type="text"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                    <input
                      type="text"
                      value={formData.location || ""}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg flex items-center justify-center"
                  >
                    <Save size={16} className="mr-2" /> Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-medium py-2 rounded-lg flex items-center justify-center"
                  >
                    <X size={16} className="mr-2" /> Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Profile;
