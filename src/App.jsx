import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Home from "./pages/Home.jsx";
import StudentHome from "./pages/StudentHome.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx"; // Now using the enhanced version

export default function App() {
  return (
    <Routes>
      {/* Public / hub */}
      <Route path="/" element={<Home />} />

      {/* Student */}
      <Route path="/student" element={<StudentHome />} />

      {/* Teacher (wildcard catches /teacher and any /teacher/...) */}
      <Route path="/teacher/*" element={<TeacherDashboard />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}