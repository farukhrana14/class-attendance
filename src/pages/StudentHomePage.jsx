import React, { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function StudentHomePage() {
  const { user, userData, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch courses for the student
  useEffect(() => {
    const fetchCourses = async () => {
      if (!userData?.studentId) {
        setLoading(false);
        return;
      }

      try {
        // Get courses where student is enrolled
        const coursesRef = collection(db, "courses");
        const q = query(coursesRef, where("students", "array-contains", userData.studentId));
        const querySnapshot = await getDocs(q);
        
        const coursesData = [];
        querySnapshot.forEach((doc) => {
          coursesData.push({ id: doc.id, ...doc.data() });
        });
        
        setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
      setLoading(false);
    };

    fetchCourses();
  }, [userData]);

  const handleSignOut = () => {
    logout();
    // Navigate to home page instead of login to avoid forcing re-login
    setTimeout(() => {
      navigate("/");
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading your courses...</p>
      </div>
    );
  }

  // Get user information from Firebase Auth and Firestore
  const studentInfo = {
    name: userData?.name || user?.displayName || "Student",
    studentId: userData?.studentId || "Not assigned",
    email: user?.email || "No email",
    phone: userData?.phone || "Not provided",
    photoURL: user?.photoURL || "",
  };

  const university = userData?.university || "Your University";
  const semester = "Fall 2025"; // Could be made dynamic later

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
          {courses.length > 0 ? (
            courses.map((course, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-6">
                <div className="text-xl font-semibold text-blue-700 mb-1">{course.courseCode}</div>
                <div className="text-lg text-gray-800 mb-1">{course.courseName}</div>
                <div className="text-gray-600 mb-1">Section: {course.section}</div>
                <div className="text-gray-600 mb-1">Instructor: {course.instructor}</div>
                <div className="text-gray-600">Schedule: {course.schedule || "TBA"}</div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">No courses enrolled yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Contact your administrator to be added to courses.
              </p>
            </div>
          )}
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
