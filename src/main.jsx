import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Home from "./pages/Home.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import AdminTeacherManagement from "./components/AdminTeacherManagement.jsx";
import CourseCreation from "./components/CourseCreation.jsx";
import CourseDetails from "./components/CourseDetails.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";
import TeacherRoute from "./routes/TeacherRoute.jsx";
import "./index.css";
import NotAuthorized from "./pages/NotAuthorized.jsx";
import StudentHome from "./pages/StudentHome.jsx";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/not-authorized" element={<NotAuthorized />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/teachers"
            element={
              <AdminRoute>
                <AdminTeacherManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <TeacherRoute>
                <TeacherDashboard />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/courses"
            element={
              <TeacherRoute>
                <TeacherDashboard />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/attendance"
            element={
              <TeacherRoute>
                <TeacherDashboard />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/reports"
            element={
              <TeacherRoute>
                <TeacherDashboard />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/settings"
            element={
              <TeacherRoute>
                <TeacherDashboard />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/courses/new"
            element={
              <TeacherRoute>
                <CourseCreation />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/courses/:courseId"
            element={
              <TeacherRoute>
                <CourseDetails />
              </TeacherRoute>
            }
          />
          <Route path="/student" element={<StudentHome />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
