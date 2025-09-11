import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const sidebarItems = [
  { name: "Courses", path: "/teacher/courses" },
  { name: "Attendance", path: "/teacher/attendance" },
  { name: "Reports", path: "/teacher/reports" },
  { name: "Settings", path: "/teacher/settings" }
];

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState("Courses");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch courses for this teacher
  useEffect(() => {
    const fetchCourses = async () => {
      if (!userData?.email) return;
      
      try {
        setLoading(true);
        // Query courses where teacher email is in teacherEmails array or matches teacherEmail field
        const coursesRef = collection(db, "courses");
        const q = query(coursesRef, where("teacherEmail", "==", userData.email));
        const querySnapshot = await getDocs(q);
        
        const coursesData = [];
        querySnapshot.forEach((doc) => {
          coursesData.push({ id: doc.id, ...doc.data() });
        });
        
        setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [userData]);

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

  const handleCourseClick = (courseId) => {
    navigate(`/teacher/courses/${courseId}`);
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">My Courses</h2>
          <button
            onClick={() => navigate("/teacher/courses/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Create New Course
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600 text-lg">Loading your courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No courses found</p>
            <p className="text-gray-400 mb-6">Create your first course to get started</p>
            <button
              onClick={() => navigate("/teacher/courses/new")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Course
            </button>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-200"
              >
                <div onClick={() => handleCourseClick(course.id)} className="cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold">{course.courseCode}</h3>
                    <span className="text-sm text-gray-500">{course.semester}</span>
                  </div>
                  <p className="text-gray-700 mb-3">{course.courseName}</p>
                  <div className="text-sm text-gray-600">
                    <p>Section: {course.section}</p>
                    <p>University: {course.university}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/teacher/courses/${course.id}/rollcall`);
                    }}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                  >
                    📋 Take Roll Call
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
