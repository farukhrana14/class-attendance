import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  NavLink,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// Components
import CourseDetails from "../components/CourseDetails";
import RosterManagement from "../components/RosterManagement";
import RollCall from "../components/RollCall";
import CourseAttendanceReport from "../components/CourseAttendanceReport";

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

// ---------- Main Component ----------
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingStudentsCount, setPendingStudentsCount] = useState(0);
  const [pendingEnrollmentsCount, setPendingEnrollmentsCount] = useState(0);
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

  // Fetch teacher’s courses
  const fetchCourses = async () => {
    if (!userData?.email) return;
    try {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [userData]);

  // Placeholder counts (student signup not enabled)
  useEffect(() => {
    setPendingStudentsCount(0);
    setPendingEnrollmentsCount(0);
  }, []);

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
          Welcome, {userData?.name}
        </h2>
        <p className="text-gray-600">
          Here’s what’s happening in your courses.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-blue-600 text-lg font-semibold mb-2">
            Total Courses
          </div>
          <div className="text-3xl font-bold">{courses.length}</div>
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
          {courses.length > 0 ? (
            courses.slice(0, 3).map((course) => (
              <div
                key={course.id}
                className="px-6 py-4 hover:bg-gray-50 flex justify-between"
              >
                <div>
                  <div className="font-semibold">{course.courseCode}</div>
                  <div className="text-sm text-gray-600">
                    {course.courseName}
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
              No courses yet
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
          <span className="font-semibold text-yellow-600">pending approval</span>
          . Please wait for admin to approve your account.
        </p>
        <button
          onClick={() => setShowApprovalModal(false)}
          className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition"
        >
          OK
        </button>
      </Modal>

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
                <div className="font-medium">{userData?.name}</div>
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
              {item.name === "Pending Students" && pendingStudentsCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                  {pendingStudentsCount}
                </span>
              )}
              {item.name === "Pending Enrollments" &&
                pendingEnrollmentsCount > 0 && (
                  <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                    {pendingEnrollmentsCount}
                  </span>
                )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <ErrorBoundary>
          <Routes>
            <Route index element={<DashboardContent />} />
            <Route path="/courses" element={<div>Courses Page</div>} />
            <Route
              path="/courses/roster/:courseId"
              element={<RosterManagement />}
            />
            <Route path="/courses/:courseId" element={<CourseDetails />} />
            <Route
              path="/courses/:courseId/rollcall"
              element={<RollCall />}
            />
            <Route path="/reports" element={<div>Reports Page</div>} />
            <Route
              path="/courses/:courseId/reports"
              element={<CourseAttendanceReport />}
            />
            <Route path="/settings" element={<div>Settings Page</div>} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}
