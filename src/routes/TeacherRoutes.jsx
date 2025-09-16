// src/routes/TeacherRoutes.jsx
import { Route, useOutletContext } from "react-router-dom";
import TeacherDashboard from "../pages/teacher/TeacherDashboard.jsx";
import TeacherCoursesList from "../components/TeacherCoursesList.jsx";
import RollCallLauncher from "../pages/teacher/RollCallLauncher.jsx";

import CourseDetails from "../pages/teacher/CourseDetails.jsx";
import RollCall from "../pages/teacher/RollCall.jsx";
import AttendanceRedirect from "../pages/teacher/AttendanceRedirect.jsx";
import CourseAttendanceReport from "../pages/teacher/CourseAttendanceReport.jsx";
import CourseCreation from "../pages/teacher/CourseCreation.jsx";
import AddStudents from "../pages/teacher/AddStudents.jsx";

// Small adapters to inject Outlet context back into components that expect props:
function CoursesListWithCtx() {
  const {
    courses,
    coursesLoading,
    userLoading,
    ready,
    showEmpty,
    handleDeleteCourse,
  } = useOutletContext();
  return (
    <TeacherCoursesList
      courses={courses}
      loading={coursesLoading || userLoading}
      ready={ready}
      showEmpty={showEmpty}
      onDelete={handleDeleteCourse}
    />
  );
}

export default function TeacherRoutes() {
  return (
    <Route path="/teacher" element={<TeacherDashboard />}>
      {/* index -> courses list */}
      <Route index element={<CoursesListWithCtx />} />

      {/* alias for list */}
      <Route path="courses" element={<CoursesListWithCtx />} />

      {/* details + actions */}
      <Route path="courses/:courseId" element={<CourseDetails />} />
      <Route path="courses/:courseId/rollcall" element={<RollCall />} />
      <Route
        path="courses/:courseId/reports"
        element={<CourseAttendanceReport />}
      />

      {/* launchers / utilities */}
      <Route path="attendance" element={<AttendanceRedirect />} />
      <Route path="roll-call" element={<RollCallLauncher />} />

      {/* creation flows */}
      <Route path="create-course" element={<CourseCreation />} />
      <Route path="add-students" element={<AddStudents />} />
    </Route>
  );
}
