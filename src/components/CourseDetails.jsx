import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSignOut = () => {
    logout();
    setTimeout(() => {
      window.location.replace("/");
    }, 100);
  };

  useEffect(() => {
    const fetchCourseAndStudents = async () => {
      try {
        // Fetch course details
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (!courseDoc.exists()) {
          throw new Error("Course not found");
        }

        const courseData = { id: courseDoc.id, ...courseDoc.data() };
        setCourse(courseData);

        // Fetch students in the course
        const studentsQuery = query(
          collection(db, "courses", courseId, "students")
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsData = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudents(studentsData);
      } catch (err) {
        console.error("Error fetching course details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndStudents();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading course details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Navigation */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white shadow rounded-lg px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Course Management
            </h2>
            <div className="flex space-x-3 md:hidden">
              <button
                onClick={() => navigate("/teacher")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Teacher Dashboard
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Course Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {course.courseCode}: {course.courseName}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {course.semester} • {course.university}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate("/teacher/courses/edit/" + courseId)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit Course
                </button>
                <button
                  onClick={() =>
                    navigate(`/teacher/courses/${courseId}/rollcall`)
                  }
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Take Roll Call
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm font-medium text-gray-500">
              Total Students
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {students.length}
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm font-medium text-gray-500">
              Classes Held
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">0</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm font-medium text-gray-500">
              Average Attendance
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">-</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm font-medium text-gray-500">Last Class</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">-</div>
          </div>
        </div>
      </div>
    </div>
  );
}
