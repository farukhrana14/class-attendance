import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function StudentAdminRoute({ children }) {
  const { user, userData, checking } = useAuth();

  // Still checking auth, show loading
  if (checking) {
    return <p style={{ padding: 16 }}>Loading…</p>;
  }

  // Must be logged in
  if (!user) {
    console.log("Redirecting: Not logged in");
    return <Navigate to="/not-authorized" replace />;
  }

  // If user exists but no userData, allow through (for registration flow)
  // If userData exists, must be student or admin
  if (userData && userData.role !== "student" && userData.role !== "admin") {
    console.log("Redirecting: Not student or admin", { user, userData });
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
}
