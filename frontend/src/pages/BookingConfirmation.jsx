import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInterceptor";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [room, setRoom] = useState(location.state?.room || null);
  const [loading, setLoading] = useState(!location.state);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;
      try {
        const token = localStorage.getItem("token");
        const res = await axiosInstance.get(`/bookings/${bookingId}`);

        setBooking(res.data.booking);
        setRoom(res.data.booking?.room || null);
      } catch (err) {
        console.error("❌ Error fetching booking:", err);
        setError("Unable to load booking details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (!booking) fetchBooking();
  }, [bookingId, booking]);

  const handleDownloadVoucher = () => {
    if (!booking) return;

    const doc = new jsPDF("p", "pt", "a4");

    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, 595, 70, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("Stayleo Hotels", 40, 45);
    doc.setFontSize(14);
    doc.text("Booking Voucher", 480, 45, { align: "right" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    let y = 110;
    const roomName = room?.name || "Not specified";

    doc.text("Booking Summary", 40, y);
    y += 25;
    doc.setFontSize(12);
    doc.text(`Booking ID: ${booking._id || "N/A"}`, 40, y);
    y += 18;
    doc.text(
      `Booking Date: ${booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "N/A"}`,
      40,
      y
    );
    y += 18;
    doc.text(`Status: ${booking.status || "Pending"}`, 40, y);
    y += 28;

    doc.setFontSize(14);
    doc.text("Stay Details", 40, y);
    y += 25;
    doc.setFontSize(12);
    doc.text(`Room: ${roomName}`, 40, y);
    y += 18;
    doc.text(
      `Check-In: ${booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : "N/A"}`,
      40,
      y
    );
    y += 18;
    doc.text(
      `Check-Out: ${booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : "N/A"}`,
      40,
      y
    );
    y += 18;
    doc.text(`Guests: ${booking.guests || 0}`, 40, y);
    y += 18;
    doc.text(`Total Price: ₹${booking.totalPrice || 0}`, 40, y);
    y += 40;

    const qrCanvasOnScreen = document.querySelector("#booking-qr canvas");
    if (qrCanvasOnScreen) {
      const qrImgData = qrCanvasOnScreen.toDataURL("image/png");
      doc.addImage(qrImgData, "PNG", 400, 120, 120, 120);
    }

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Thank you for booking with Stayleo Hotels. Please carry a valid ID proof at check-in.",
      40,
      750,
      { maxWidth: 500 }
    );

    doc.save(`Stayleo_Voucher_${booking._id || "Unknown"}.pdf`);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300 text-lg bg-gray-50 dark:bg-gray-900">
        Loading booking confirmation...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 dark:text-red-400 text-lg bg-gray-50 dark:bg-gray-900">
        {error}
      </div>
    );

  if (!booking)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300 text-lg bg-gray-50 dark:bg-gray-900">
        No booking details found.
      </div>
    );

  const { checkIn, checkOut, guests, totalPrice, createdAt, status, _id: id } = booking;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 py-16 px-4 pt-24">
      <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-3xl max-w-2xl w-full p-10 border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-6">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mt-3">Booking Confirmed!</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Your booking has been successfully confirmed. A confirmation email has been sent to your registered address.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 shadow-inner">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Booking Summary</h2>
          <div className="grid grid-cols-2 gap-y-3 text-gray-700 dark:text-gray-300">
            <p><strong>Booking ID:</strong></p><p>{id || "N/A"}</p>
            <p><strong>Booking Date:</strong></p><p>{createdAt ? new Date(createdAt).toLocaleString() : "N/A"}</p>
            <p><strong>Status:</strong></p><p className="capitalize">{status || "Pending"}</p>
            <p><strong>Room:</strong></p><p>{room?.name || "Not specified"}</p>
            <p><strong>Check-In:</strong></p><p>{checkIn ? new Date(checkIn).toLocaleDateString() : "N/A"}</p>
            <p><strong>Check-Out:</strong></p><p>{checkOut ? new Date(checkOut).toLocaleDateString() : "N/A"}</p>
            <p><strong>Guests:</strong></p><p>{guests || 0}</p>
            <p><strong>Total Price:</strong></p><p>₹{totalPrice || 0}</p>
          </div>

          {/* QR Code */}
          <div id="booking-qr" className="mt-8 text-center">
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Booking QR Code</h3>
            <div className="flex justify-center">
              <QRCodeCanvas
                value={`Booking ID: ${booking._id}\nRoom: ${room?.name}\nCheck-In: ${new Date(
                  booking.checkIn
                ).toLocaleDateString()}\nCheck-Out: ${new Date(
                  booking.checkOut
                ).toLocaleDateString()}\nGuests: ${booking.guests}\nTotal: ₹${booking.totalPrice}`}
                size={150}
                bgColor={window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "#1f2937" : "#ffffff"}
                fgColor={window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "#f472b6" : "#4f46e5"}
                level="H"
                includeMargin
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-center mt-8 gap-4 flex-wrap">
          <button
            onClick={handleDownloadVoucher}
            className="bg-gradient-to-r from-cyan-500 to-indigo-600 dark:from-violet-600 dark:to-fuchsia-500 hover:opacity-90 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-all"
          >
            Download Voucher
          </button>

          <button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-cyan-500 to-indigo-600 dark:from-violet-600 dark:to-fuchsia-500 hover:opacity-90 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
