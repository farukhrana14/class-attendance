import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import AdminDashboardCards from "../components/AdminDashboardCards";

export default function AdminMainArea({ topSection, children }) {
  const [stats, setStats] = useState({
    pendingCount: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalCourses: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Pending teachers
        const qPending = query(
          collection(db, "users"),
          where("role", "==", "teacher"),
          where("statusApproval", "==", "pending")
        );
        const pendingSnap = await getDocs(qPending);

        // All teachers
        const qTeachers = query(
          collection(db, "users"),
          where("role", "==", "teacher"),
          where("statusApproval", "==", "approved")
        );
        const teachersSnap = await getDocs(qTeachers);

        // All students
        const qStudents = query(
          collection(db, "users"),
          where("role", "==", "student")
        );
        const studentsSnap = await getDocs(qStudents);

        // All courses
        const coursesSnap = await getDocs(collection(db, "courses"));

        setStats({
          pendingCount: pendingSnap.size,
          totalTeachers: teachersSnap.size,
          totalStudents: studentsSnap.size,
          totalCourses: coursesSnap.size,
        });
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="admin-main-area">
      {/* Top cards always show stats */}
      <AdminDashboardCards stats={stats} />

      {/* Optional extra section (rarely used) */}
      {topSection && (
        <div className="mb-6 bg-white rounded-lg shadow p-6">{topSection}</div>
      )}

      {/* Page content below */}
      <div className="bg-white rounded-lg shadow p-6">{children}</div>
    </div>
  );
}
