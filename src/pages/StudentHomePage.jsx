import React from "react";
import { FaUserCircle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Dummy data for demonstration
const studentInfo = {
  name: "John Doe",
  studentId: "2025001",
  email: "john.doe@example.com",
  phone: "+880123456789",
  photoURL: "", // leave empty to use icon
};

const university = "State University";
const semester = "Fall 2025";

const courses = [
  {
    code: "CS101",
    name: "Introduction to Computer Science",
    section: "A",
    instructor: "Dr. Alice Smith",
    schedule: "Mon & Wed 10:00-11:30 AM",
  },
  {
    code: "MATH202",
    name: "Advanced Mathematics",
    section: "B",
    instructor: "Dr. Bob Lee",
    schedule: "Tue & Thu 2:00-3:30 PM",
  },
  {
    code: "PHY150",
    name: "Physics Basics",
    section: "C",
    instructor: "Dr. Carol White",
    schedule: "Fri 9:00-11:00 AM",
  },
];

export default function StudentHomePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    // Navigate to home page instead of login to avoid forcing re-login
    setTimeout(() => {
      navigate("/");
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col md:flex-row gap-8 font-sans">
      {/* Header with Sign Out button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleSignOut}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
      
      {/* Left: Courses */}
      <div className="flex-1">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{university}</h2>
          <p className="text-gray-600 text-lg">{semester}</p>
        </div>
        <div className="space-y-6">
          {courses.map((course, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-6">
              <div className="text-xl font-semibold text-blue-700 mb-1">{course.code}</div>
              <div className="text-lg text-gray-800 mb-1">{course.name}</div>
              <div className="text-gray-600 mb-1">Section: {course.section}</div>
              <div className="text-gray-600 mb-1">Instructor: {course.instructor}</div>
              <div className="text-gray-600">Schedule: {course.schedule}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Right: Student Info */}
      <div className="w-full md:w-80 flex-shrink-0">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          {studentInfo.photoURL ? (
            <img
              src={studentInfo.photoURL}
              alt="Profile"
              className="w-24 h-24 rounded-full mb-4 object-cover"
            />
          ) : (
            <FaUserCircle className="w-24 h-24 text-gray-400 mb-4" />
          )}
          <div className="text-xl font-bold text-gray-800 mb-1">{studentInfo.name}</div>
          <div className="text-gray-600 mb-1">ID: {studentInfo.studentId}</div>
          <div className="text-gray-600 mb-1">{studentInfo.email}</div>
          <div className="text-gray-600">{studentInfo.phone}</div>
        </div>
      </div>
    </div>
  );
}
