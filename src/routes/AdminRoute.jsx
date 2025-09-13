import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminRoute({ children }) {
  const { user, userData, checking } = useAuth();

  // Wait for both authentication and user data
  if (checking || (user && !userData)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-4"></div>
          <div className="text-lg text-blue-700 font-semibold">Loading Admin Dashboard…</div>
        </div>
      </div>
    );
  }

  // Must be logged in AND have admin role
  if (!user || userData?.role !== "admin") {
    console.log("Redirecting: Not admin", { user, userData });
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
}
