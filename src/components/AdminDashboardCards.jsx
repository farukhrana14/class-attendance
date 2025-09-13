import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

export default function AdminDashboardCards({ stats }) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "teacher"),
          where("statusApproval", "==", "pending")
        );
        const querySnapshot = await getDocs(q);
        setPendingCount(querySnapshot.size);
      } catch (err) {
        setPendingCount(0);
      }
    };
    fetchPendingCount();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Link
        to="/admin/teacher/approve"
        className="relative border-2 border-yellow-500 text-yellow-700 rounded-lg p-6 shadow flex flex-col justify-center transform hover:scale-105 transition-transform duration-200 hover:bg-yellow-50"
      >
        <div className="text-sm font-semibold opacity-90">Approval Pending</div>
        <div className="text-3xl font-bold mt-2">{pendingCount}</div>
        {pendingCount > 0 && (
          <span className="absolute top-3 right-3 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
            {pendingCount}
          </span>
        )}
      </Link>
      <div className="bg-blue-500 text-white rounded-lg p-6 shadow flex flex-col justify-center transform hover:scale-105 transition-transform duration-200">
        <div className="text-sm font-semibold opacity-90">Total Teachers</div>
        <div className="text-3xl font-bold mt-2">
          {stats?.totalTeachers ?? 0}
        </div>
      </div>
      <div className="bg-green-500 text-white rounded-lg p-6 shadow flex flex-col justify-center transform hover:scale-105 transition-transform duration-200">
        <div className="text-sm font-semibold opacity-90">Total Students</div>
        <div className="text-3xl font-bold mt-2">
          {stats?.totalStudents ?? 0}
        </div>
      </div>
      <div className="bg-purple-500 text-white rounded-lg p-6 shadow flex flex-col justify-center transform hover:scale-105 transition-transform duration-200">
        <div className="text-sm font-semibold opacity-90">Active Courses</div>
        <div className="text-3xl font-bold mt-2">
          {stats?.totalCourses ?? 0}
        </div>
      </div>
    </div>
  );
}
