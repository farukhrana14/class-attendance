// src/pages/RollCallLauncher.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function RollCallLauncher() {

  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Debug: log user context
  console.log('[RollCallLauncher] user:', user);

  useEffect(() => {

    if (!user?.email) {
      console.log('[RollCallLauncher] No user email, skipping course query.');
      setCourses([]);
      setLoading(false);
      return;
    }

    // Query courses taught by this teacher
    const q = query(
      collection(db, "courses"),
      where("teacherId", "==", user.email),
      where("status", "==", "active")
    );


    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const result = [];
        snapshot.forEach((doc) => {
          result.push({ id: doc.id, ...doc.data() });
        });
        console.log('[RollCallLauncher] Courses loaded:', result);
        setCourses(result);
        setLoading(false);
      },
      (error) => {
        console.error("[RollCallLauncher] Error fetching teacher courses:", error);
        setCourses([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.email]);

  // Auto-forward if exactly one course
  useEffect(() => {
    console.log('[RollCallLauncher] loading:', loading, 'courses:', courses);
    if (!loading && courses.length === 1) {
      navigate(`/teacher/courses/${courses[0].id}/rollcall`);
    }
  }, [loading, courses, navigate]);

  if (loading) {
    return <div className="p-6">Loading courses…</div>;
  }

  if (courses.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No active courses assigned to you.</p>
      </div>
    );
  }

  if (courses.length === 1) {
    // While the effect handles redirect, we can show a short placeholder
    return (
      <div className="p-6 text-center">
        <p>Redirecting to RollCall for {courses[0].courseName}…</p>
      </div>
    );
  }

  // If multiple courses, show picker
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Select a Course for RollCall</h2>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            onClick={() => navigate(`/teacher/courses/${course.id}/rollcall`)}
            className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition"
          >
            <h3 className="font-bold text-lg mb-2">{course.courseName}</h3>
            <p className="text-sm text-gray-600">
              {course.courseCode} — {course.semester} {course.year}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
