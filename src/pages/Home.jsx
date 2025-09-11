import { useAuth } from "../context/AuthContext.jsx";
import { Link, Navigate } from "react-router-dom";

export default function Home() {
  const { user, userData, login, logout, checking } = useAuth();

  if (checking) return <p>Loading...</p>;

  // Don't auto-redirect users to registration from home page
  // Let them navigate manually if they want to register

  const pages = [
    { name: "Login Page", path: "/login", description: "Authentication page" },
    { name: "Student Home", path: "/student", description: "Student dashboard and attendance" },
    { name: "Teacher Dashboard", path: "/teacher", description: "Teacher's main dashboard" },
    { name: "Admin Dashboard", path: "/admin", description: "Administrative controls" },
    { name: "Course Creation", path: "/teacher/create-course", description: "Create new courses" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Class Attendance Testing Hub
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Quick access to all pages for testing purposes
          </p>
          {user ? (
            <div className="bg-white p-4 rounded-lg shadow mb-8">
              <p className="text-xl font-semibold text-gray-800">
                Logged in as: {userData?.name || user.displayName}
              </p>
              <p className="text-gray-600">Role: {userData?.role || "Unknown"}</p>
              <button 
                onClick={logout}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={login}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors text-lg"
            >
              Sign in with Google
            </button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {pages.map((page) => (
            <Link
              key={page.path}
              to={page.path}
              className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {page.name}
              </h2>
              <p className="text-gray-600">{page.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
