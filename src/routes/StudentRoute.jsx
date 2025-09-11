import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function StudentRoute({ children }) {
  const { user, userData, checking } = useAuth();

  if (checking || (user && !userData)) {
    return <p style={{ padding: 16 }}>Loading…</p>;
  }

  // Only allow users with role 'student'
  if (!user || userData?.role !== "student") {
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
}
