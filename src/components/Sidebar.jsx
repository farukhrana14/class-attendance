import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { icon: "📊", label: "Dashboard", path: "/teacher" },
    {
      icon: "📚",
      label: "Courses",
      path: "/teacher/courses",
      subItems: [
        { label: "All Courses", path: "/teacher/courses" },
        { label: "Create Course", path: "/teacher/courses/new" },
      ],
    },
    { icon: "📅", label: "Attendance", path: "/teacher/attendance" },

    { icon: "📝", label: "Reports", path: "courses/:courseId/reports" },
    { icon: "⚙️", label: "Settings", path: "/teacher/settings" },
  ];

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <Link
          to="/"
          className="flex items-center text-blue-600 font-bold text-xl"
        >
          <span className="text-2xl mr-2">📚</span>
          ClassFlow
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        {menuItems.map((item, index) => (
          <div key={index} className="mb-2">
            <Link
              to={item.path}
              className={`flex items-center px-4 py-2 rounded-lg text-sm ${
                isActive(item.path)
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
            {item.subItems && (
              <div className="ml-8 mt-1 space-y-1">
                {item.subItems.map((subItem, subIndex) => (
                  <Link
                    key={subIndex}
                    to={subItem.path}
                    className={`block px-4 py-2 rounded-lg text-sm ${
                      isActive(subItem.path)
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {subItem.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
