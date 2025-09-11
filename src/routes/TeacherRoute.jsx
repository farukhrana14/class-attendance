import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function TeacherRoute({ children }) {
  const { user, userData, checking } = useAuth();

  // Wait for both authentication and user data
  if (checking || (user && !userData)) {
    return <p style={{ padding: 16 }}>Loading…</p>;
  }

  // Must be logged in AND have either teacher or admin role
  if (!user || (userData?.role !== "teacher" && userData?.role !== "admin")) {
    console.log("Redirecting: Not teacher or admin", { user, userData });
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
}
