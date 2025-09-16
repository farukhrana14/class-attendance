// React & Router
import React, { useState, useEffect } from "react";
import { Routes, Route, Outlet, useNavigate } from "react-router-dom";

// Auth Context
import { useAuth } from "../context/AuthContext";

// Firestore
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// Hooks
import { useUserDoc } from "../hooks/useUserDoc";
import { useTeacherCourses } from "../hooks/useTeacherCourses";

// Modals
import ConfirmModal from "../components/modals/ConfirmModal";
import SuccessModal from "../components/modals/SuccessModal";
import LoadingModal from "../components/modals/LoadingModal";

// Components
import TeacherSidebar from "../components/TeacherSidebar";
import sidebarItems from "../constants/teacherNav";
import TeacherCoursesList from "../components/TeacherCoursesList";
import CourseDetails from "../components/CourseDetails";
import RollCall from "../components/RollCall";
import CourseAttendanceReport from "../components/CourseAttendanceReport";
import CourseCreation from "../components/CourseCreation";
import AddStudents from "../components/AddStudents";
import RollCallLauncher from "./RollCallLauncher";

// Redirect to first course's roll call
function AttendanceRedirect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => {
    async function goToFirstCourseRollCall() {
      if (!user) return;
      const q = query(
        collection(db, "courses"),
        where("teacherId", "==", user.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const firstCourse = snap.docs[0];
        navigate(`/teacher/courses/${firstCourse.id}/rollcall`, {
          replace: true,
        });
      } else {
        navigate("/teacher/courses", { replace: true });
      }
    }
    goToFirstCourseRollCall();
  }, [user, navigate]);
  return <p style={{ padding: 16 }}>Redirecting to attendance…</p>;
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // 🔹 Hooks (declare ONCE)
  const { userData, loading: userLoading } = useUserDoc(user?.email);
  const { courses, loading: coursesLoading } = useTeacherCourses(
    userData,
    userLoading
  );

  // 🔹 Local UI state (declare BEFORE effects that use them)
  const [ready, setReady] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    course: null,
  });
  const [successModal, setSuccessModal] = useState({
    open: false,
    message: "",
  });
  const [deleting, setDeleting] = useState(false);

  // 🔹 Compute "ready" from hook load flags
  useEffect(() => {
    setReady(!userLoading && !coursesLoading);
  }, [userLoading, coursesLoading]);

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
      <TeacherSidebar
        userData={userData}
        userLoading={userLoading}
        items={sidebarItems}
        onSignOut={() => {
          logout();
          navigate("/");
        }}
      />
      {/* Main Content */}
      <main className="flex-1 p-4 pt-14 md:pt-0">
        <Outlet
          context={{
            courses,
            coursesLoading,
            userLoading,
            ready,
            showEmpty,
            handleDeleteCourse,
          }}
        />
      </main>

      {/* Confirmation Modal */}
      <ConfirmModal
        show={confirmModal.open}
        title="Confirm Deletion"
        message="Are you sure you want to delete this course? This action cannot be undone."
        onCancel={() => setConfirmModal({ open: false, course: null })}
        onConfirm={confirmDelete}
        cancelLabel="Cancel"
        confirmLabel="Delete"
      />

      <SuccessModal
        show={successModal.open}
        message={successModal.message}
        onClose={() => setSuccessModal({ open: false, message: "" })}
        title="Success"
        buttonLabel="OK"
      />

      <LoadingModal show={deleting} message="Deleting course..." />
    </div>
  );
}
