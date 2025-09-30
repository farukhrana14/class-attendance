import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PendingStudentsManagement from "../components/PendingStudentsManagement";

export default function PendingStudentsPage() {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();

  const handleSignOut = () => {
    logout();
    setTimeout(() => {
      window.location.replace("/");
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/teacher")}
                className="text-blue-600 hover:text-blue-800 mr-4 text-sm font-medium"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Pending Student Requests
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {userData?.name}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-gray-600">
            Review and approve student registration requests for your courses.
            Approved students will be added to your course rosters and can
            access the attendance system.
          </p>
        </div>

        <PendingStudentsManagement />
      </main>
    </div>
  );
}
