import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import TeacherOnboardingForm from "../components/TeacherOnboardingForm";
import { Navigate } from "react-router-dom";

export default function NewTeacherPage() {
  const { user, userData, checking } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [teacherName, setTeacherName] = useState("");

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (userData && userData.role === "teacher") {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {showSuccess ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome {teacherName}</h2>
            <p className="mb-4">
              Your status is{" "}
              <span className="font-semibold text-yellow-600">
                pending for approval
              </span>
              . Please wait.
            </p>
            <a
              href="/teacher/dashboard"
              className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      ) : (
        <TeacherOnboardingForm
          user={user}
          onSuccess={setTeacherName && (() => setShowSuccess(true))}
        />
      )}
    </>
  );
}
