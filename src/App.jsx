import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
// Pages
import Home from "./pages/Home.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import StudentHome from "./pages/StudentHome.jsx";
import StudentHomeNew from "./pages/StudentHomeNew.jsx";
import StudentProfile from "./pages/StudentProfile.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";
// import AdminStudentManagement from "./components/AdminStudentManagement.jsx";
import AdminCourseManagement from "./components/AdminCourseManagement.jsx";
import AdminTeacherManagement from "./components/AdminTeacherManagement.jsx";
import { AdminModalProvider } from "./context/AdminModalContext.jsx";
import AdminApproveTeacher from "./pages/AdminApproveTeacher.jsx";
import NewTeacherPage from "./pages/NewTeacherPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public / hub */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/new-teacher" element={<NewTeacherPage />} />
      <Route path="/student-new" element={<StudentHomeNew />} />

      {/* Student */}
      <Route path="/student" element={<StudentHome />} />
      <Route path="/student-profile" element={<StudentProfile />} />

      {/* Teacher */}
      {/* Redirect old /teacher/dashboard to /teacher */}
      <Route path="/teacher/dashboard" element={<Navigate to="/teacher" replace />} />
      {/* Wildcard ensures all subroutes like /teacher/roll-call, /teacher/courses, etc. work */}
      <Route path="/teacher/*" element={<TeacherDashboard />} />

      {/* Admin Dashboard */}
      <Route
        path="/admin"
        element={
          <AdminModalProvider>
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          </AdminModalProvider>
        }
      />

      {/* Admin Management Subroutes */}
      <Route
        path="/admin/teacher"
        element={
          <AdminModalProvider>
            <AdminRoute>
              <AdminTeacherManagement />
            </AdminRoute>
          </AdminModalProvider>
        }
      />
      <Route
        path="/admin/teacher/approve"
        element={
          <AdminModalProvider>
            <AdminRoute>
              <AdminApproveTeacher />
            </AdminRoute>
          </AdminModalProvider>
        }
      />
      {/* <Route path="/admin/students" element={
        <AdminModalProvider>
          <AdminRoute>
            <AdminStudentManagement />
          </AdminRoute>
        </AdminModalProvider>
      } /> */}
      <Route
        path="/admin/courses"
        element={
          <AdminModalProvider>
            <AdminRoute>
              <AdminCourseManagement />
            </AdminRoute>
          </AdminModalProvider>
        }
      />

  // Fallback route removed for now. To be implemented with route protection in step 7.
  {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
    </Routes>
  );
}
