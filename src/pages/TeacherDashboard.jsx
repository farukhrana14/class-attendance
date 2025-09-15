// src/pages/TeacherDashboard.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// Components
import CourseDetails from "../components/CourseDetails";
import RollCall from "../components/RollCall";
import CourseAttendanceReport from "../components/CourseAttendanceReport";
import CourseCreation from "../components/CourseCreation";
import AddStudents from "../components/AddStudents";

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

// Helpers
const getCourseName = (c) => c.courseName || c.title || "Untitled Course";
const getUniversity = (c) => c.university || c.universityName || "—";

// Skeleton loader for courses
function CoursesSkeleton() {
  const skeletons = [1, 2, 3];
  return (
    <div className="p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Courses</h2>
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {skeletons.map((n) => (
          <div
            key={n}
            className="bg-white rounded-lg shadow p-6 animate-pulse transition duration-500"
          >
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton loader for sidebar
function SidebarSkeleton() {
  return (
    <div className="mb-4 p-3 bg-blue-50 rounded-lg animate-pulse animate-fade-in">
      <div className="h-4 bg-blue-200 rounded w-2/3 mb-2"></div>
      <div className="h-3 bg-blue-200 rounded w-full"></div>
    </div>
  );
}

// CoursesList with fade + delayed empty state
function CoursesList({ courses, loading, ready, showEmpty, onDelete }) {
  const navigate = useNavigate();

  if (!ready || loading) {
    return <CoursesSkeleton />;
  }

  if (ready && !loading && courses.length === 0 && showEmpty) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg mb-4">No courses found</p>
          <p className="text-gray-400 mb-6">
            Create your first course to get started
          </p>
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
    <div className="p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Courses</h2>
        <button
          onClick={() => navigate("/teacher/create-course")}
          className="text-blue-600 hover:underline font-medium bg-transparent border-none p-0 m-0 cursor-pointer"
          style={{ boxShadow: "none" }}
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
              className="cursor-pointer flex-1"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold">
                  {course.courseCode || "No Code"}
                </h3>
                <span className="text-sm text-gray-500">
                  {course.semester || "—"} {course.year || ""}
                </span>
              </div>
              <p className="text-gray-700 mb-3">{getCourseName(course)}</p>
              <div className="text-sm text-gray-600">
                <p>University: {getUniversity(course)}</p>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // prevent bubbling into card click
                  onDelete(course);
                }}
                className="text-red-600 hover:underline font-medium bg-transparent border-none p-0 m-0 cursor-pointer"
                style={{ boxShadow: "none" }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [userData, setUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const [showEmpty, setShowEmpty] = useState(false);

  const [confirmModal, setConfirmModal] = useState({ open: false, course: null });
  const [successModal, setSuccessModal] = useState({ open: false, message: "" });
  const [deleting, setDeleting] = useState(false);

  // Subscribe to user doc
  useEffect(() => {
    if (!user?.email) {
      setUserData(null);
      setUserLoading(false);
      return;
    }
    setUserLoading(true);
    const userDocRef = doc(db, "users", user.email);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        setUserData(null);
      }
      setUserLoading(false);
    });
    return () => unsubscribe();
  }, [user?.email]);

  // Subscribe to courses after userData
  useEffect(() => {
    if (userLoading) return;

    if (!userData?.enrolledCourses || userData.enrolledCourses.length === 0) {
      setCourses([]);
      setCoursesLoading(false);
      setReady(true);
      return;
    }

    setCoursesLoading(true);
    const enrolled = userData.enrolledCourses;
    const coursesRef = collection(db, "courses");
    const q = query(
      coursesRef,
      where("__name__", "in", enrolled),
      where("status", "==", "active")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const coursesData = [];
        querySnapshot.forEach((docSnap) => {
          coursesData.push({ id: docSnap.id, ...docSnap.data() });
        });
        setCourses(coursesData);
        setCoursesLoading(false);
        setReady(true);
      },
      (error) => {
        console.error("Error subscribing to courses:", error);
        setCourses([]);
        setCoursesLoading(false);
        setReady(true);
      }
    );

    return () => unsubscribe();
  }, [userLoading, userData]);

  // Delay empty state
  useEffect(() => {
    let timer;
    if (ready && !coursesLoading && courses.length === 0) {
      timer = setTimeout(() => setShowEmpty(true), 325);
    } else {
      setShowEmpty(false);
    }
    return () => clearTimeout(timer);
  }, [ready, coursesLoading, courses]);

  const handleDeleteCourse = (course) => {
    setConfirmModal({ open: true, course });
  };

  const confirmDelete = async () => {
    if (!confirmModal.course) return;
    setDeleting(true);
    try {
      const courseRef = doc(db, "courses", confirmModal.course.id);
      await updateDoc(courseRef, { status: "deleted" });
      setConfirmModal({ open: false, course: null });
      setSuccessModal({ open: true, message: "Course deleted successfully!" });
    } catch (error) {
      console.error("Error deleting course:", error);
      setConfirmModal({ open: false, course: null });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6 hidden md:block">
        <h1 className="text-xl font-bold mb-2">Teacher Dashboard</h1>
        {userLoading ? (
          <SidebarSkeleton />
        ) : (
          userData && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-blue-900 animate-fade-in">
              <div className="font-semibold">{userData.name}</div>
              <div className="text-xs break-all">{userData.email}</div>
            </div>
          )
        )}
        <nav>
          {sidebarItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 mb-2 rounded-lg ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`
              }
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="mt-6 w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Routes>
          <Route
            index
            element={
              <CoursesList
                courses={courses}
                loading={coursesLoading || userLoading}
                ready={ready}
                showEmpty={showEmpty}
                onDelete={handleDeleteCourse}
              />
            }
          />
          <Route
            path="/courses"
            element={
              <CoursesList
                courses={courses}
                loading={coursesLoading || userLoading}
                ready={ready}
                showEmpty={showEmpty}
                onDelete={handleDeleteCourse}
              />
            }
          />
          <Route path="/courses/:courseId" element={<CourseDetails />} />
          <Route path="/courses/:courseId/rollcall" element={<RollCall />} />
          <Route
            path="/courses/:courseId/reports"
            element={<CourseAttendanceReport />}
          />
          <Route path="/create-course" element={<CourseCreation />} />
          <Route path="/add-students" element={<AddStudents />} />
        </Routes>
      </main>

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-lg font-bold text-red-600 mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this course? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmModal({ open: false, course: null })}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 text-center animate-fade-in">
            <div className="flex justify-center mb-4">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-green-600 mb-2">Success</h3>
            <p className="text-gray-700">{successModal.message}</p>
            <div className="mt-6">
              <button
                onClick={() => setSuccessModal({ open: false, message: "" })}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deleting Loader */}
      {deleting && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="flex flex-col items-center">
            <span className="relative flex h-16 w-16">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gradient-to-tr from-blue-400 via-purple-500 to-pink-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-16 w-16 bg-gradient-to-tr from-blue-400 via-purple-500 to-pink-500"></span>
              <span className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
              </span>
            </span>
            <div className="mt-6 text-lg font-semibold text-white drop-shadow-lg">
              Deleting course...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
