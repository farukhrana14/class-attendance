import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const sidebarItems = [
  { name: "Courses", path: "/teacher/courses" },
  { name: "Attendance", path: "/teacher/attendance" },
  { name: "Reports", path: "/teacher/reports" },
  { name: "Settings", path: "/teacher/settings" }
];

// Sample data - replace with actual API calls later
const sampleCourses = [
  { 
    id: 1, 
    code: "CS101", 
    title: "Introduction to Computer Science", 
    semester: "Fall 2024", 
    attendance: 92,
    totalStudents: 45,
    nextClass: "Mon, 10:00 AM"
  },
  { 
    id: 2, 
    code: "MATH202", 
    title: "Advanced Mathematics", 
    semester: "Spring 2024", 
    attendance: 87,
    totalStudents: 38,
    nextClass: "Tue, 2:00 PM"
  },
  { 
    id: 3, 
    code: "PHYS150", 
    title: "Physics Basics", 
    semester: "Fall 2024", 
    attendance: 95,
    totalStudents: 42,
    nextClass: "Wed, 11:30 AM"
  },
];

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [activeMenu, setActiveMenu] = useState("Courses");

  const handleMenuClick = (item) => {
    setActiveMenu(item.name);
    navigate(item.path);
  };

  const handleCourseClick = (courseId) => {
    navigate(`/teacher/courses/${courseId}`);
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen flex bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-60 bg-white shadow-md flex flex-col">
        <div className="px-6 py-8">
          <div className="text-2xl font-bold border-b border-gray-200 pb-4">
            Teacher Dashboard
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Welcome, {userData?.name}
          </div>
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">My Courses</h2>
          <button
            onClick={() => navigate("/teacher/courses/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Create New Course
          </button>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {sampleCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => handleCourseClick(course.id)}
              className="bg-white rounded-lg shadow p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">{course.code}</h3>
                  <span className="text-sm text-gray-500">{course.semester}</span>
                </div>
                <p className="text-gray-700 mb-3">{course.title}</p>
                <div className="text-sm text-gray-600">
                  <p>Students: {course.totalStudents}</p>
                  <p>Next Class: {course.nextClass}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">
                    Attendance Rate
                  </span>
                  <span
                    className={`font-bold ${getAttendanceColor(course.attendance)}`}
                  >
                    {course.attendance}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
