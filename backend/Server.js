require("dotenv").config(); // Load environment variables
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// Initialize database connection
require("./db/connection");

const app = express();
const server = http.createServer(app);

// --- SOCKET.IO SETUP ---
// In development allow any origin to avoid CORS issues with dynamic dev ports
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// --- CHAT SOCKET HANDLING ---
const ChatMessage = require("./modals/ChatMessage");

io.on("connection", (socket) => {
  console.log(`✅ New client connected: ${socket.id}`);

  // Send previous chat messages
  ChatMessage.find()
    .sort({ createdAt: 1 })
    .then((messages) => socket.emit("chat_history", messages))
    .catch((err) => console.error("Error fetching chat history:", err));

  // Save & broadcast messages
  socket.on("send_message", async (data) => {
    try {
      const newMessage = new ChatMessage(data);
      await newMessage.save();
      io.emit("receive_message", newMessage);
    } catch (err) {
      console.error("Error saving chat message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// --- MIDDLEWARE ---
app.use(morgan("dev"));
app.use(express.json());
// Allow any origin in development to avoid CORS/preflight failures while developing locally.
// In production this will use the value of FRONTEND_URL from env.
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
    credentials: true,
  })
);

// --- STATIC FILES (for uploads like profile pics) ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- ROUTES ---
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/payment", paymentRoutes);

// --- SERVE FRONTEND BUILD (Vite → build folder in Docker) ---
app.use(express.static(path.join(__dirname, "build")));

// ✅ Express v5 compatible route for frontend (fixes PathError)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// --- DEFAULT ROUTE ---
app.get("/", (req, res) => {
  res.send("🏨 Welcome to Online Hotel Booking & Management System API");
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error("🚨 Server Error:", err);
  res.status(500).json({
    message: "Something went wrong!",
    error: err.message,
  });
});

// --- START SERVER ---
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
