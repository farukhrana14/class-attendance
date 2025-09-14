// src/pages/TeacherDashboard.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Components
import CourseDetails from "../components/CourseDetails";
import RollCall from "../components/RollCall";
import CourseAttendanceReport from "../components/CourseAttendanceReport";
import CourseCreation from "../components/CourseCreation";
import AddStudents from "../components/AddStudents";

// Loader Component
function Loader() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
}

// Sidebar items
const sidebarItems = [
  { name: "Dashboard", path: "/teacher", icon: "📊" },
  { name: "Courses", path: "/teacher/courses", icon: "📚" },
  { name: "Create Course", path: "/teacher/create-course", icon: "➕" },
  { name: "Manage Students", path: "/teacher/add-students", icon: "👥" },
  { name: "Register Attendance", path: "/teacher/attendance", icon: "📅" },
  { name: "Reports", path: "/teacher/reports", icon: "📈" },
  { name: "Settings", path: "/teacher/settings", icon: "⚙️" },
];

// Helpers
const getCourseName = (c) => c.courseName || c.title || "Untitled Course";
const getUniversity = (c) => c.university || c.universityName || "—";

function CoursesList({ courses, loading }) {
  const navigate = useNavigate();

  if (loading) return <Loader />;

  if (!loading && courses.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg mb-4">No courses found</p>
          <p className="text-gray-400 mb-6">
            Create your first course to get started
          </p>
          <button
            onClick={() => navigate("/teacher/create-course")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Courses</h2>
        <button
          onClick={() => navigate("/teacher/create-course")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Create New Course
        </button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-lg shadow p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-200"
          >
            <div
              onClick={() => navigate(`/teacher/courses/${course.id}`)}
              className="cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold">
                  {course.courseCode || "No Code"}
                </h3>
                <span className="text-sm text-gray-500">
                  {course.semester || "—"} {course.year || ""}
                </span>
              </div>
              <p className="text-gray-700 mb-3">{getCourseName(course)}</p>
              <div className="text-sm text-gray-600">
                <p>University: {getUniversity(course)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  if (import.meta.env.DEV) {
    console.log("[TeacherDashboard] userData:", userData);
  }

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      if (!userData?.email) {
        setCourses([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const coursesRef = collection(db, "courses");
      const enrolled = userData.enrolledCourses || [];
      let coursesData = [];
      if (enrolled.length > 0) {
        // Firestore 'in' queries support up to 10 items per query
        const chunkSize = 10;
        for (let i = 0; i < enrolled.length; i += chunkSize) {
          const chunk = enrolled.slice(i, i + chunkSize);
          const q = query(coursesRef, where("id", "in", chunk));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((docSnap) => {
            coursesData.push({ id: docSnap.id, ...docSnap.data() });
          });
        }
      }
      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [userData?.email]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6 hidden md:block">
        <h1 className="text-xl font-bold mb-2">Teacher Dashboard</h1>
        {userData && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-blue-900">
            <div className="font-semibold">{userData.name}</div>
            <div className="text-xs break-all">{userData.email}</div>
          </div>
        )}
        <nav>
          {sidebarItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 mb-2 rounded-lg ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`
              }
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="mt-6 w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {loading ? (
          <Loader />
        ) : (
          <Routes>
            <Route index element={<CoursesList courses={courses} loading={loading} />} />
            <Route path="/courses" element={<CoursesList courses={courses} loading={loading} />} />
            <Route path="/courses/:courseId" element={<CourseDetails />} />
            <Route path="/courses/:courseId/rollcall" element={<RollCall />} />
            <Route path="/courses/:courseId/reports" element={<CourseAttendanceReport />} />
            <Route path="/create-course" element={<CourseCreation />} />
            <Route path="/add-students" element={<AddStudents />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
