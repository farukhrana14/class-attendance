import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

const sidebarItems = [
  { name: "Overview", path: "/admin" },
  { name: "Teachers", path: "/admin/teachers" },
  { name: "Students", path: "/admin/students" },
  { name: "Courses", path: "/admin/courses" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState("Overview");
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalSections: 0
  });

  // Update active menu based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    const currentItem = sidebarItems.find(item => item.path === currentPath);
    if (currentItem) {
      setActiveMenu(currentItem.name);
    }
  }, [location.pathname]);

  // Fetch real-time statistics
  useEffect(() => {
    // Fetch teachers count
    const teachersQuery = query(collection(db, "users"), where("role", "==", "teacher"));
    const teachersUnsub = onSnapshot(teachersQuery, (snapshot) => {
      setStats(prev => ({ ...prev, totalTeachers: snapshot.size }));
    });

    // Fetch students count
    const studentsQuery = query(collection(db, "users"), where("role", "==", "student"));
    const studentsUnsub = onSnapshot(studentsQuery, (snapshot) => {
      setStats(prev => ({ ...prev, totalStudents: snapshot.size }));
    });

    // Fetch courses count
    const coursesUnsub = onSnapshot(collection(db, "courses"), (snapshot) => {
      setStats(prev => ({ 
        ...prev, 
        totalCourses: snapshot.size,
        totalSections: snapshot.size // For now, each course is a section
      }));
    });

    return () => {
      teachersUnsub();
      studentsUnsub();
      coursesUnsub();
    };
  }, []);

  const handleSignOut = () => {
    logout();
    setTimeout(() => {
      navigate("/");
    }, 100);
  };

  const handleMenuClick = (item) => {
    setActiveMenu(item.name);
    navigate(item.path);
  };

  // Only show overview content when on main admin path
  const isOverviewPage = location.pathname === "/admin";

  return (
    <div className="min-h-screen flex bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-60 bg-white shadow-md flex flex-col">
        <div className="px-6 py-8">
          <div className="text-2xl font-bold border-b border-gray-200 pb-4">
            Admin Dashboard
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Welcome, {userData?.name}
          </div>
          <button
            onClick={handleSignOut}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Sign Out
          </button>
        </div>
        <nav className="flex flex-col flex-grow">
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleMenuClick(item)}
              className={`text-left px-6 py-3 border-l-4 ${
                activeMenu === item.name
                  ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold"
                  : "border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-300"
              } focus:outline-none transition-colors duration-200`}
            >
              {item.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content - Only show for overview page */}
      {isOverviewPage && (
        <main className="flex-grow p-8 overflow-auto">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-500 text-white rounded-lg p-6 shadow flex flex-col justify-center transform hover:scale-105 transition-transform duration-200">
              <div className="text-sm font-semibold opacity-90">Total Teachers</div>
              <div className="text-3xl font-bold mt-2">{stats.totalTeachers}</div>
            </div>
            <div className="bg-green-500 text-white rounded-lg p-6 shadow flex flex-col justify-center transform hover:scale-105 transition-transform duration-200">
              <div className="text-sm font-semibold opacity-90">Total Students</div>
              <div className="text-3xl font-bold mt-2">{stats.totalStudents}</div>
            </div>
            <div className="bg-yellow-500 text-white rounded-lg p-6 shadow flex flex-col justify-center transform hover:scale-105 transition-transform duration-200">
              <div className="text-sm font-semibold opacity-90">Active Courses</div>
              <div className="text-3xl font-bold mt-2">{stats.totalCourses}</div>
            </div>
            <div className="bg-purple-500 text-white rounded-lg p-6 shadow flex flex-col justify-center transform hover:scale-105 transition-transform duration-200">
              <div className="text-sm font-semibold opacity-90">Sections</div>
              <div className="text-3xl font-bold mt-2">{stats.totalSections}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate("/admin/teachers")}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <h4 className="font-medium text-blue-600">Manage Teachers</h4>
                <p className="text-sm text-gray-500">Add, edit, or remove teachers</p>
              </button>
              <button
                onClick={() => navigate("/admin/students")}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <h4 className="font-medium text-green-600">Manage Students</h4>
                <p className="text-sm text-gray-500">Add, edit, or remove students</p>
              </button>
              <button
                onClick={() => navigate("/admin/courses")}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <h4 className="font-medium text-purple-600">Manage Courses</h4>
                <p className="text-sm text-gray-500">Add, edit, or remove courses</p>
              </button>
            </div>
          </div>

          {/* Attendance Trends Chart Placeholder */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Attendance Trends</h2>
            <div className="flex justify-center items-center h-64 border-2 border-dashed border-gray-300 rounded">
              <span className="text-gray-400 italic">Chart Placeholder</span>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
