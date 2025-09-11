import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const sidebarItems = [
  { name: "Teachers", path: "/admin/teachers" },
  { name: "Students", path: "/admin/students" },
  { name: "Courses", path: "/admin/courses" },
  { name: "Sections", path: "/admin/sections" },
  { name: "Settings", path: "/admin/settings" },
];

const overviewCards = [
  { title: "Total Teachers", value: 24, bgColor: "bg-blue-500" },
  { title: "Total Students", value: 320, bgColor: "bg-green-500" },
  { title: "Active Courses", value: 18, bgColor: "bg-yellow-500" },
  { title: "Sections", value: 35, bgColor: "bg-purple-500" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState("Teachers");

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

      {/* Main Content */}
      <main className="flex-grow p-8 overflow-auto">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {overviewCards.map(({ title, value, bgColor }) => (
            <div
              key={title}
              className={`text-white rounded-lg p-6 shadow ${bgColor} flex flex-col justify-center transform hover:scale-105 transition-transform duration-200`}
            >
              <div className="text-sm font-semibold opacity-90">{title}</div>
              <div className="text-3xl font-bold mt-2">{value}</div>
            </div>
          ))}
        </div>

        {/* Attendance Trends Chart Placeholder */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Attendance Trends</h2>
          <div className="flex justify-center items-center h-64 border-2 border-dashed border-gray-300 rounded">
            <span className="text-gray-400 italic">Chart Placeholder</span>
          </div>
        </section>
      </main>
    </div>
  );
}
