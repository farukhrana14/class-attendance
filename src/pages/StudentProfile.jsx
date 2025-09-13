import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function StudentProfile() {
  const { user, userData, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // DEBUG: Log auth state for troubleshooting
    // eslint-disable-next-line no-console
    console.log("[StudentProfile] user:", user);
    // eslint-disable-next-line no-console
    console.log("[StudentProfile] userData:", userData);
    // eslint-disable-next-line no-console
    console.log("[StudentProfile] userData.role:", userData && userData.role);
  }, [user, userData]);

  // Redirect if not a student, show only loader while redirecting
  useEffect(() => {
    if (
      !loading &&
      user &&
      userData &&
      userData.role !== "student"
    ) {
      navigate("/student", { replace: true });
    }
    // Do NOT redirect if user or userData are null; wait for them to load
  }, [user, userData, loading, navigate]);

  if (loading || !user || !userData || userData.role !== "student") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  const student = {
    name: userData.name || user.displayName || user.email,
    studentId: userData.studentId || "",
    email: user.email,
    university: userData.university || "",
    semester: userData.semester || "",
    section: userData.section || "",
    avatarUrl: ""
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col max-w-md mx-auto">
      <header className="flex items-center justify-between bg-white p-4 shadow sticky top-0 z-10">
        <button
          className="mr-2 p-2 rounded-full hover:bg-gray-200 focus:outline-none"
          aria-label="Back"
          onClick={() => window.history.back()}
        >
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-xl font-bold text-blue-600">Profile</div>
        <div style={{ width: 40 }}></div> {/* Spacer for symmetry */}
      </header>
      <section className="bg-white p-4 m-4 rounded-lg shadow space-y-2 border-2 border-blue-400">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600">
            {student.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{student.name}</h2>
            <p className="text-gray-600 text-sm">Student ID: {student.studentId}</p>
            <p className="text-gray-600 text-sm">{student.university}</p>
          </div>
        </div>
      </section>
      <section className="flex-grow p-4 space-y-4 overflow-auto">
        <h3 className="text-lg font-semibold mb-4 text-blue-700 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Profile Details
        </h3>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-lg border border-blue-100 max-w-md mx-auto">
          <ul className="divide-y divide-blue-200">
            <li className="flex items-center justify-between py-3">
              <span className="font-semibold text-blue-700 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                WhatsApp number:
              </span>
              <span className="text-blue-900 font-mono">+880171555555</span>
            </li>
            <li className="flex items-center justify-between py-3">
              <span className="font-semibold text-blue-700 flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Email ID:
              </span>
              <span className="text-blue-900 font-mono">{student.email}</span>
            </li>
            <li className="flex items-center justify-between py-3">
              <span className="font-semibold text-blue-700 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                </svg>
                CGPA:
              </span>
              <span className="text-blue-900 font-bold">3.85</span>
            </li>
            <li className="flex items-center justify-between py-3">
              <span className="font-semibold text-blue-700 flex items-center gap-2">
                <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                </svg>
                Credit completed:
              </span>
              <span className="text-blue-900 font-bold">84</span>
            </li>
          </ul>
        </div>
      </section>
      {/* Bottom Navigation */}
      <nav className="bg-white sticky bottom-0 border-t border-gray-200 flex justify-around text-gray-600">
        <button
          className="p-3 flex flex-col items-center text-blue-600"
          aria-current="page"
          aria-label="Home"
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M3 9.75L12 3l9 6.75v9.75a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 19.5V9.75z" />
            <path d="M9 22V12h6v10" />
          </svg>
          Home
        </button>
        <button
          className="p-3 flex flex-col items-center hover:text-blue-600"
          aria-label="Signout"
          onClick={logout}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4" />
          </svg>
          Signout
        </button>
        <button
          className="p-3 flex flex-col items-center text-gray-400 cursor-not-allowed"
          aria-label="Settings (Disabled)"
          disabled
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.75V6m0 12v1.25m7.07-10.32l-.88.88m-10.32 10.32l-.88.88m12.02 0l-.88-.88m-10.32-10.32l-.88-.88M21 12h-1.25M4.25 12H3m16.07 4.07l-.88-.88m-10.32-10.32l-.88-.88" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Settings
        </button>
        <button
          className="p-3 flex flex-col items-center hover:text-blue-600"
          aria-label="Profile"
          onClick={() => window.location.href = "/student-profile"}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M5.121 17.804A9 9 0 1110 21c0-3-1-5-1-5" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profile
        </button>
      </nav>
    </div>
  );
}
