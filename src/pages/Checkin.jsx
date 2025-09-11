import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Time window logic is commented out for now.
// To be implemented: allow check-in only during a configurable time window per class session.
// Example:
// const CHECKIN_START = "08:00";
// const CHECKIN_END = "08:30";
// function isWithinTimeWindow() {
//   const now = new Date();
//   const [startHour, startMin] = CHECKIN_START.split(":").map(Number);
//   const [endHour, endMin] = CHECKIN_END.split(":").map(Number);
//   const start = new Date(now);
//   start.setHours(startHour, startMin, 0, 0);
//   const end = new Date(now);
//   end.setHours(endHour, endMin, 59, 999);
//   return now >= start && now <= end;
// }

export default function Checkin() {
  const auth = useAuth();
  const user = auth.user;
  const userData = auth.userData || {};
  const login = auth.login;
  const logout = auth.logout;
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckin = async () => {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      if (!user) {
        setError("You must be signed in as a student.");
        setLoading(false);
        return;
      }
      if (!userData || userData.role !== "student") {
        setError("You must be signed in as a student.");
        setLoading(false);
        return;
      }
      // Time window validation is currently disabled. To be implemented per class schedule.
      // TODO: Add geofence validation here if needed
      // For now, just record attendance
      await addDoc(collection(db, "attendance"), {
        studentEmail: user.email,
        studentName: userData.name,
        date: new Date().toISOString().split("T")[0],
        timestamp: serverTimestamp(),
        mode: "self",
        // gps: { lat, lng } // Add if available
      });
      setStatus("Check-in successful!");
      // Redirect to student home after successful check-in
      setTimeout(() => {
        navigate("/student/home");
      }, 1500);
    } catch (err) {
      setError("Check-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 font-sans">
      <h1 className="text-2xl font-semibold mb-4 text-gray-800">Self Check-in</h1>
      {/* {status && ...} */}
      {status && <div className="bg-green-100 text-green-800 p-4 rounded mb-4">{status}</div>}
      {error && <div className="bg-red-100 text-red-800 p-4 rounded mb-4">{error}</div>}

      {/* Not signed in: show Google sign-in button */}
      {!user && (
        <button
          onClick={login}
          className="flex items-center bg-white border border-gray-300 rounded shadow px-6 py-3 mb-4 hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            className="w-6 h-6 mr-3"
            viewBox="0 0 533.5 544.3"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.5-34-4.3-50.3H272v95.3h146.9c-6.4 34.9-25.9 64.4-55.4 84.3v69h89.4c52.4-48.3 82.6-119.4 82.6-198.3z" />
            <path fill="#34A853" d="M272 544.3c74 0 135.9-24.4 181.2-66.2l-89.4-69c-24.8 16.5-56.6 26.3-91.8 26.3-70.6 0-130.4-47.7-151.9-111.5H30.4v69.8A271 271 0 0 0 272 544.3z" />
            <path fill="#FBBC04" d="M120.1 325.9a163.1 163.1 0 0 1-9.1-53.9 163.2 163.2 0 0 1 9.1-53.9v-69.8H30.4a271 271 0 0 0 0 247.4l89.7-69.8z" />
            <path fill="#EA4335" d="M272 107.7c39.9 0 75.7 13.7 103.9 40.6l77.8-77.8C404.2 24 343.5 0 272 0 167.9 0 79.7 57.6 30.4 143.9l89.7 69.8c21.5-63.8 81.3-111.5 151.9-111.5z" />
          </svg>
          Sign in with Google
        </button>
      )}

      {/* Signed in as admin/teacher: show logout button */}
      {user && userData && userData.role !== "student" && (
        <>
          <div className="mb-4 text-yellow-700 bg-yellow-100 p-3 rounded">You are signed in as <b>{userData.role}</b>. Please log out and sign in as a student to check in.</div>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-6 py-3 rounded-lg text-lg font-bold shadow hover:bg-red-700 transition-colors mb-4"
          >
            Log Out
          </button>
        </>
      )}

      {/* Signed in as student: show check-in button */}
      {user && userData && userData.role === "student" && (
        <button
          onClick={handleCheckin}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-bold shadow hover:bg-blue-700 transition-colors"
        >
          {loading ? "Checking in..." : "Check In Now"}
        </button>
      )}

      {/* TODO: Add GPS/geofence validation UI here */}
    </div>
  );
}
