// src/pages/TeacherDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  NavLink,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

// Page/Component Imports (confirm these paths in your repo)
import CourseDetails from "../components/CourseDetails";
import RollCall from "../components/RollCall";
import CourseAttendanceReport from "../components/CourseAttendanceReport";
import CourseCreation from "../components/CourseCreation";
import AddStudents from "../components/AddStudents";

// ---------- Helpers ----------

// Modal
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative">
        {children}
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ErrorBoundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
          <h2 className="text-2xl font-bold text-red-700 mb-2">
            Something went wrong.
          </h2>
          <p className="text-red-600 mb-4">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
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

// Small utility: safe getters for fields that may be named differently
const getCourseName = (c) => c.courseName || c.title || "Untitled Course";
const getUniversity = (c) => c.university || c.universityName || "—";

// ---------- Internal Route Components ----------
function CoursesList({ courses, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="mt-4 h-10 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!loading && courses.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg mb-4">No courses found</p>
          <p className="text-gray-400 mb-6">Create your first course to get started</p>
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
                <h3 className="text-lg font-bold">{course.courseCode || "No Code"}</h3>
                <span className="text-sm text-gray-500">
                  {course.semester || "—"} {course.year || ""}
                </span>
              </div>
              <p className="text-gray-700 mb-3">{getCourseName(course)}</p>
              <div className="text-sm text-gray-600">
                <p>University: {getUniversity(course)}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/teacher/courses/${course.id}/rollcall`);
                }}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
              >
                📋 Roll Call
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/teacher/courses/${course.id}/reports`);
                }}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium"
              >
                📈 Reports
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegisterAttendance({ courses }) {
  const navigate = useNavigate();
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Register Attendance</h1>
        <p className="mt-2 text-sm text-gray-600">Select a course to take roll call</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Select Course</h2>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => navigate(`/teacher/courses/${course.id}/rollcall`)}
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors duration-200 border-2 border-transparent hover:border-green-500"
            >
              <h3 className="text-lg font-bold text-gray-900">
                {course.courseCode || "No Code"}
              </h3>
              <p className="text-gray-700 mb-2">{getCourseName(course)}</p>
              <div className="text-sm text-gray-600">
                <p>Semester: {course.semester || "—"} {course.year || ""}</p>
                <p>University: {getUniversity(course)}</p>
                <p className="mt-2 text-green-600 font-medium">Click to take attendance →</p>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No courses found</p>
            <p className="text-gray-400 mb-6">Create a course first before taking attendance</p>
            <button
              onClick={() => navigate("/teacher/create-course")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Course
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportsHub({ courses }) {
  const navigate = useNavigate();
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Attendance Reports</h1>
        <p className="mt-2 text-sm text-gray-600">Select a course to view attendance reports</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Select Course</h2>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => navigate(`/teacher/courses/${course.id}/reports`)}
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors duration-200 border-2 border-transparent hover:border-purple-500"
            >
              <h3 className="text-lg font-bold text-gray-900">
                {course.courseCode || "No Code"}
              </h3>
              <p className="text-gray-700 mb-2">{getCourseName(course)}</p>
              <div className="text-sm text-gray-600">
                <p>Semester: {course.semester || "—"} {course.year || ""}</p>
                <p>University: {getUniversity(course)}</p>
                <p className="mt-2 text-purple-600 font-medium">View attendance reports →</p>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No courses found</p>
            <p className="text-gray-400 mb-6">Create a course first to view attendance reports</p>
            <button
              onClick={() => navigate("/teacher/create-course")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Course
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Main Component ----------
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Approval modal states
  const [statusApproval, setStatusApproval] = useState(
    userData?.statusApproval || null
  );
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Sync statusApproval from Firestore userData
  useEffect(() => {
    if (userData?.statusApproval) {
      setStatusApproval(userData.statusApproval);
      if (userData.statusApproval === "pending") {
        setShowApprovalModal(true);
      }
    }
  }, [userData]);

  // Fetch teacher’s courses (robust to missing userData)
  const fetchCourses = async () => {
    try {
      if (!userData?.email) {
        setCourses([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const coursesRef = collection(db, "courses");
      const q = query(coursesRef, where("teacherEmail", "==", userData.email));
      const querySnapshot = await getDocs(q);
      const coursesData = [];
      querySnapshot.forEach((docSnap) => {
        coursesData.push({ id: docSnap.id, ...docSnap.data() });
      });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.email]);

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // ---------- Dashboard content ----------
  const DashboardContent = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome, {userData?.name || "Teacher"}
        </h2>
        <p className="text-gray-600">Here’s what’s happening in your courses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-blue-600 text-lg font-semibold mb-2">
            Total Courses
          </div>
          <div className="text-3xl font-bold">{loading ? "…" : courses.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-green-600 text-lg font-semibold mb-2">
            Today’s Attendance
          </div>
          <div className="text-3xl font-bold">--</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold">Recent Courses</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {!loading && courses.length > 0 ? (
            courses.slice(0, 3).map((course) => (
              <div
                key={course.id}
                className="px-6 py-4 hover:bg-gray-50 flex justify-between"
              >
                <div>
                  <div className="font-semibold">{course.courseCode || "No Code"}</div>
                  <div className="text-sm text-gray-600">
                    {getCourseName(course)}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/teacher/courses/${course.id}`)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  View
                </button>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">
              {loading ? "Loading..." : "No courses yet"}
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => navigate("/teacher/courses")}
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            View all courses
          </button>
        </div>
      </div>
    </div>
  );

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Approval Modal */}
      <Modal open={showApprovalModal} onClose={() => setShowApprovalModal(false)}>
        <h2 className="text-2xl font-bold mb-4">Welcome {userData?.name}</h2>
        <p className="mb-4">
          Your teacher account is{" "}
          <span className="font-semibold text-yellow-600">pending approval</span>.
          Please wait for admin to approve your account.
        </p>
        <button
          onClick={() => setShowApprovalModal(false)}
          className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition"
        >
          OK
        </button>
      </Modal>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between bg-white px-4 py-3 shadow-md w-full">
        <div className="text-xl font-bold">Teacher Dashboard</div>
        <button
          onClick={toggleMobileMenu}
          className="text-gray-700 focus:outline-none"
          aria-label="Toggle Menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`bg-white shadow w-full md:w-64 md:flex flex-col md:sticky md:top-0 md:h-screen ${
          isMobileMenuOpen ? "block" : "hidden"
        } md:block`}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800 hidden md:block">
            Teacher Dashboard
          </h1>
          <div className="mt-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl">
                {userData?.name?.charAt(0) || "T"}
              </div>
              <div className="ml-3">
                <div className="font-medium">{userData?.name || "Teacher"}</div>
                <div className="text-sm text-gray-600">{userData?.email}</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="mt-4 w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
        <nav className="py-4 flex-1 overflow-y-auto">
          <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main
          </div>
          {sidebarItems.map((item) => (
            <NavLink
              end={item.path === "/teacher"}
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-gray-700 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600"
                    : "hover:bg-gray-50"
                }`
              }
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <ErrorBoundary>
          <Routes>
            {/* Dashboard */}
            <Route index element={<DashboardContent />} />

            {/* Courses list */}
            <Route path="/courses" element={<CoursesList courses={courses} loading={loading} />} />

            {/* Course details / subroutes */}
            <Route path="/courses/:courseId" element={<CourseDetails />} />
            <Route path="/courses/:courseId/rollcall" element={<RollCall />} />
            <Route path="/courses/:courseId/reports" element={<CourseAttendanceReport />} />

            {/* Creation and Student Management */}
            <Route path="/create-course" element={<CourseCreation />} />
            <Route path="/add-students" element={<AddStudents />} />

            {/* Attendance hub and Reports hub */}
            <Route path="/attendance" element={<RegisterAttendance courses={courses} />} />
            <Route path="/reports" element={<ReportsHub courses={courses} />} />

            {/* Settings placeholder */}
            <Route path="/settings" element={<div className="p-4">Settings Page</div>} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}
