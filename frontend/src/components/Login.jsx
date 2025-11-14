import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CardTitle, CardDescription } from "./ui/Card";
import Input from "./ui/Input";
import { Button } from "./ui/Button";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../utils/axiosInterceptor";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const Login = ({ open, onClose, onLogin }) => {
  const [flipped, setFlipped] = useState(false);
  const [cardHeight, setCardHeight] = useState(520);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const googleDivRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // Adjust card height when flipping
  useEffect(() => {
    setCardHeight(flipped ? 650 : 520);
  }, [flipped]);

  // Detect theme
  const theme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";

  const buttonGradient =
    theme === "dark"
      ? "bg-gradient-to-r from-violet-600 to-fuchsia-500"
      : "bg-gradient-to-r from-cyan-500 to-indigo-600";

  const cardBackground =
    theme === "dark"
      ? "bg-gradient-to-br from-gray-800 via-violet-900 to-fuchsia-900"
      : "bg-white";

  const linkColor = theme === "dark" ? "text-violet-400" : "text-indigo-600";

  // -------------------- GOOGLE SIGN-IN --------------------
  useEffect(() => {
    if (!open) return; // Only render when modal is open

    const scriptId = "google-login-script";

    function renderGoogleButton() {
      if (!window.google || !googleDivRef.current) return;
      googleDivRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id:
          "571733474887-ppnob04t3a0hsk9gln6krgkneci3m9c3.apps.googleusercontent.com",
        callback: handleGoogleCallbackResponse,
      });
      window.google.accounts.id.renderButton(googleDivRef.current, {
        theme: "outline",
        size: "large",
        width: "100%",
      });
    }

    if (document.getElementById(scriptId)) {
      renderGoogleButton();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.id = scriptId;
      script.onload = renderGoogleButton;
      document.body.appendChild(script);
    }
  }, [open]);

  // Handle Google login
  const handleGoogleCallbackResponse = async (response) => {
    try {
      const res = await axiosInstance.post(
        "/auth/google-login",
        { token: response.credential }
      );
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      onLogin?.(user);
      alert("✅ Logged in with Google successfully!");
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || "Google login failed.");
    }
  };

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post(
        "/auth/login",
        loginForm
      );
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      onLogin?.(user);

      if (user.role?.toUpperCase() === "ADMIN")
        window.location.href = "/adminDashboard";
      else window.location.href = "/";
    } catch (err) {
      alert(err.response?.data?.message || "Login failed.");
    }
  };

  // SIGNUP
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupForm.name || !signupForm.email || !signupForm.password)
      return alert("Please fill all required fields");
    try {
      await axiosInstance.post("/auth/signup", {
        ...signupForm,
        role: "CUSTOMER",
      });
      alert("Signup successful! You can now log in.");
      setFlipped(false);
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed.");
    }
  };

  // FORGOT PASSWORD
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return alert("Please enter your email address.");
    setLoading(true);
    setForgotStatus(null);
    try {
      const res = await axiosInstance.post(
        "/auth/forgot-password",
        { email: forgotEmail }
      );
      alert(res.data.message || "OTP sent to your email.");
      setForgotStatus("success");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Close modal on outside click
  const handleOutsideClick = (e) => {
    if (e.target.id === "modal-overlay") onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="modal-overlay"
          onClick={handleOutsideClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 flex justify-end items-center z-50 p-4"
        >
          <motion.div
            className="relative w-full max-w-md"
            style={{ perspective: 1000 }}
            animate={{ height: cardHeight }}
            transition={{ duration: 0.6 }}
          >
            {showForgot ? (
              <motion.div
                className={`absolute inset-0 rounded-xl p-6 shadow-xl ${cardBackground}`}
              >
                {forgotStatus === "success" ? (
                  <ForgotOtpStep
                    email={forgotEmail}
                    onClose={() => setShowForgot(false)}
                  />
                ) : (
                  <form onSubmit={handleForgotPassword}>
                    <h2 className="text-xl font-semibold mb-2 text-center dark:text-white">
                      Forgot Password
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 text-center">
                      Enter your registered email to receive an OTP.
                    </p>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="mb-4"
                    />
                    <button
                      type="submit"
                      className={`w-full py-2 rounded-lg font-semibold text-white hover:opacity-90 transition ${buttonGradient}`}
                      disabled={loading}
                    >
                      {loading ? "Sending OTP..." : "Send OTP"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForgot(false)}
                      className="w-full mt-3 text-gray-500 hover:text-gray-700 dark:text-gray-300"
                    >
                      Back to Login
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div
                className="absolute w-full h-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* LOGIN SIDE */}
                <div
                  className={`absolute inset-0 rounded-xl p-6 shadow-xl ${cardBackground} dark:border dark:border-gray-700`}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <form onSubmit={handleLogin}>
                    <div className="mb-6 text-center">
                      <CardTitle className="font-bold text-[30px] dark:text-white">
                        Welcome Back
                      </CardTitle>
                      <CardDescription className="dark:text-gray-300">
                        Access your account
                      </CardDescription>
                    </div>

                    <label className="text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="mb-4 mt-2 dark:bg-gray-50 dark:text-black dark:border-gray-700 w-full"
                      value={loginForm.email}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, email: e.target.value })
                      }
                      required
                    />

                    <label className="text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <div className="relative mb-4 mt-2 w-full">
                      <Input
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="w-full pr-10 dark:bg-gray-50 dark:text-black dark:border-gray-700"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm({
                            ...loginForm,
                            password: e.target.value,
                          })
                        }
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowLoginPassword(!showLoginPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                      >
                        {showLoginPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    <div className="flex justify-between mb-4 text-sm">
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className={`${linkColor}`}
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      className={`w-full py-2 rounded-lg font-semibold text-white hover:opacity-90 transition ${buttonGradient}`}
                    >
                      Login
                    </button>

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                      <span className="mx-2 text-gray-500 dark:text-gray-400 text-sm">
                        Or
                      </span>
                      <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                    </div>

                    {/* Google Sign-In */}
                    <div
                      id="googleSignInDiv"
                      ref={googleDivRef}
                      className="w-full flex justify-center mt-2"
                    ></div>

                    <p className="flex justify-center text-slate-500 dark:text-gray-400 mt-4">
                      Don’t have an account?
                      <button
                        type="button"
                        className={`ml-1 font-semibold ${linkColor}`}
                        onClick={() => setFlipped(true)}
                      >
                        Sign up
                      </button>
                    </p>
                  </form>
                </div>

                {/* SIGNUP SIDE */}
                <div
                  className={`absolute inset-0 rounded-xl p-6 shadow-xl overflow-y-auto ${cardBackground} dark:border dark:border-gray-700`}
                  style={{
                    transform: "rotateY(180deg)",
                    backfaceVisibility: "hidden",
                  }}
                >
                  <form onSubmit={handleSignup}>
                    <div className="mb-6 text-center">
                      <CardTitle className="font-bold text-[30px] dark:text-white">
                        Create Account
                      </CardTitle>
                      <CardDescription className="dark:text-gray-300">
                        Join and manage bookings
                      </CardDescription>
                    </div>

                    {["name", "email", "password", "phone", "location"].map(
                      (field) => (
                        <div key={field} className="relative">
                          <label className="text-gray-700 dark:text-gray-300 capitalize">
                            {field === "name"
                              ? "Full Name"
                              : field.charAt(0).toUpperCase() + field.slice(1)}
                          </label>
                          <Input
                            type={
                              field === "password"
                                ? showSignupPassword
                                  ? "text"
                                  : "password"
                                : field === "email"
                                ? "email"
                                : "text"
                            }
                            placeholder={`Enter your ${field}`}
                            className="mb-4 mt-2 dark:bg-gray-50 dark:text-black dark:border-gray-700 w-full pr-10"
                            value={signupForm[field]}
                            onChange={(e) =>
                              setSignupForm({
                                ...signupForm,
                                [field]: e.target.value,
                              })
                            }
                            required={["name", "email", "password"].includes(
                              field
                            )}
                          />
                          {field === "password" && (
                            <button
                              type="button"
                              onClick={() =>
                                setShowSignupPassword(!showSignupPassword)
                              }
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                            >
                              {showSignupPassword ? (
                                <EyeSlashIcon className="h-5 w-5" />
                              ) : (
                                <EyeIcon className="h-5 w-5" />
                              )}
                            </button>
                          )}
                        </div>
                      )
                    )}

                    <button
                      type="submit"
                      className={`w-full py-2 rounded-lg font-semibold text-white hover:opacity-90 transition ${buttonGradient}`}
                    >
                      Sign Up
                    </button>

                    <p className="flex justify-center text-slate-500 dark:text-gray-400 mt-4">
                      Already have an account?
                      <button
                        type="button"
                        className={`ml-1 font-semibold ${linkColor}`}
                        onClick={() => setFlipped(false)}
                      >
                        Login
                      </button>
                    </p>
                  </form>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// -------------------- OTP STEP --------------------
const ForgotOtpStep = ({ email, onClose }) => {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) return alert("Please fill all fields");
    try {
      setLoading(true);
      const res = await axiosInstance.post(
        "/auth/reset-password",
        { email, otp, newPassword }
      );
      alert(res.data.message || "✅ Password reset successful!");
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP or request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2 text-center dark:text-white">
        Enter OTP
      </h2>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 text-center">
        We’ve sent an OTP to <strong>{email}</strong>
      </p>
      <form onSubmit={handleResetPassword}>
        <Input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          className="mb-3"
        />
        <Input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="mb-4"
        />
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-lg font-semibold text-white hover:opacity-90 transition bg-gradient-to-r from-violet-600 to-fuchsia-500`}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 text-gray-500 hover:text-gray-700 dark:text-gray-300"
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default Login;
