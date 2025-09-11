import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function LoginPage() {
  const { user, login, checking, userData } = useAuth();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect based on role
  if (user && userData) {
    switch (userData.role) {
      case 'admin':
        return <Navigate to="/admin/teachers" replace />;
      case 'teacher':
        return <Navigate to="/teacher/dashboard" replace />;
      case 'student':
        return <Navigate to="/student/home" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // If user is signed in but no userData, redirect to student registration
  if (user && !userData && !checking) {
    return <Navigate to="/student" replace />;
  }

  const handleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await login();
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking auth
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      {/* Logo Placeholder with fade-in animation */}
      <div className="mb-8 animate-fade-in">
        <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xl font-bold transform hover:scale-105 transition-transform duration-200">
          Logo
        </div>
      </div>

      {/* Welcome Text with slide-up animation */}
      <div className="text-center space-y-2 animate-slide-up">
        <h1 className="text-3xl font-semibold mb-4 text-gray-800">
          Welcome to Class Attendance
        </h1>
        <p className="mb-8 text-gray-600">
          Please sign in with your Google account to continue
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md animate-shake">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Google Sign-In Button with hover effects */}
      <button
        type="button"
        className={`flex items-center bg-white border border-gray-300 rounded shadow px-6 py-3 
          hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
        onClick={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </div>
        ) : (
          <>
            <svg
              className="w-6 h-6 mr-3"
              viewBox="0 0 533.5 544.3"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#4285F4"
                d="M533.5 278.4c0-17.4-1.5-34-4.3-50.3H272v95.3h146.9c-6.4 34.9-25.9 64.4-55.4 84.3v69h89.4c52.4-48.3 82.6-119.4 82.6-198.3z"
              />
              <path
                fill="#34A853"
                d="M272 544.3c74 0 135.9-24.4 181.2-66.2l-89.4-69c-24.8 16.5-56.6 26.3-91.8 26.3-70.6 0-130.4-47.7-151.9-111.5H30.4v69.8A271 271 0 0 0 272 544.3z"
              />
              <path
                fill="#FBBC04"
                d="M120.1 325.9a163.1 163.1 0 0 1-9.1-53.9 163.2 163.2 0 0 1 9.1-53.9v-69.8H30.4a271 271 0 0 0 0 247.4l89.7-69.8z"
              />
              <path
                fill="#EA4335"
                d="M272 107.7c39.9 0 75.7 13.7 103.9 40.6l77.8-77.8C404.2 24 343.5 0 272 0 167.9 0 79.7 57.6 30.4 143.9l89.7 69.8c21.5-63.8 81.3-111.5 151.9-111.5z"
              />
            </svg>
            Sign in with Google
          </>
        )}
      </button>
    </div>
  );
}