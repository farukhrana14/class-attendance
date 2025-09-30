// src/App.jsx
import React from "react";
import { Routes, Route, useOutletContext } from "react-router-dom";

// Pages
import Home from "./pages/Home.jsx";
// import LoginPage from "./pages/LoginPage.jsx";
import StudentHome from "./pages/StudentHome.jsx";
import StudentProfile from "./pages/StudentProfile.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import TeacherCoursesList from "./components/TeacherCoursesList.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";
// import AdminStudentManagement from "./components/AdminStudentManagement.jsx";
import AdminCourseManagement from "./components/AdminCourseManagement.jsx";
import AdminTeacherManagement from "./components/AdminTeacherManagement.jsx";
import { AdminModalProvider } from "./context/AdminModalContext.jsx";
import AdminApproveTeacher from "./pages/AdminApproveTeacher.jsx";
import NewTeacherPage from "./pages/NewTeacherPage.jsx";
import RollCallLauncher from "./pages/RollCallLauncher.jsx";
import RollCall from "./components/RollCall.jsx";
import CourseCreation from "./components/CourseCreation.jsx";
import AddStudents from "./components/AddStudents.jsx";
import CourseDetails from "./components/CourseDetails.jsx";
import CourseAttendanceReport from "./components/CourseAttendanceReport.jsx";
// Adapter: read data from <Outlet /> context and feed props to TeacherCoursesList
function CoursesListWithCtx() {
  const {
    courses,
    coursesLoading,
    userLoading,
    ready,
    showEmpty,
    handleDeleteCourse,
  } = useOutletContext() || {};

  // Safe fallbacks so list renders even if your hook doesn't provide these yet
  const computedReady =
    typeof ready === "boolean" ? ready : !coursesLoading && !userLoading;
  const computedShowEmpty =
    typeof showEmpty === "boolean"
      ? showEmpty
      : computedReady && (!Array.isArray(courses) || courses.length === 0);

  return (
    <TeacherCoursesList
      courses={courses}
      loading={Boolean(coursesLoading || userLoading)}
      ready={computedReady}
      showEmpty={computedShowEmpty}
      onDelete={handleDeleteCourse || (() => {})}
    />
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public / hub */}
      <Route path="/" element={<Home />} />
      {/* <Route path="/login" element={<LoginPage />} /> */}
      <Route path="/login/new-teacher" element={<NewTeacherPage />} />
      {/* <Route path="/student-new" element={<StudentHomeNew />} /> */}

      {/* Student */}
      <Route path="/student" element={<StudentHome />} />
      <Route path="/student-profile" element={<StudentProfile />} />

      {/* Teacher (children render inside TeacherDashboard via <Outlet />) */}
      <Route path="/teacher" element={<TeacherDashboard />}>
        <Route index element={<CoursesListWithCtx />} />
        <Route path="courses" element={<CoursesListWithCtx />} />

        <Route path="roll-call" element={<RollCallLauncher />} />
        <Route path="courses/:courseId" element={<CourseDetails />} />
        <Route path="courses/:courseId/rollcall" element={<RollCall />} />

        <Route path="create-course" element={<CourseCreation />} />
        <Route path="manage-students" element={<AddStudents />} />
        <Route
          path="courses/:courseId/reports"
          element={<CourseAttendanceReport />}
        />
      </Route>

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

      {/* Fallback route removed for now. To be implemented with route protection in step 7. */}
      {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
    </Routes>
  );
}
