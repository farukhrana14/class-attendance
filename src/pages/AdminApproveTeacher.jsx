import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import AdminLayout from "../layouts/AdminLayout";
import AdminMainArea from "../layouts/AdminMainArea";

export default function AdminApproveTeacher() {
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingTeachers = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "teacher"),
          where("statusApproval", "==", "pending")
        );
        const querySnapshot = await getDocs(q);
        const teachers = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setPendingTeachers(teachers);
      } catch (err) {
        setError("Failed to fetch pending teachers.");
      } finally {
        setLoading(false);
      }
    };
    fetchPendingTeachers();
  }, []);

  const handleApprove = async (teacherId) => {
    try {
      await updateDoc(doc(db, "users", teacherId), {
        statusApproval: "approved"
      });
      setPendingTeachers(prev => prev.filter(t => t.id !== teacherId));
    } catch (err) {
      alert("Failed to approve teacher.");
    }
  };

  // Placeholder stats; replace with real data fetching as needed
  const stats = {
    totalTeachers: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalSections: 0,
  };
  return (
    <AdminLayout>
      <AdminMainArea stats={stats}>
        <div className="p-8 max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Pending Teacher Approvals</h1>
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : pendingTeachers.length === 0 ? (
            <div className="text-green-600">No pending teachers for approval.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b">Name</th>
                    <th className="py-2 px-4 border-b">Email</th>
                    <th className="py-2 px-4 border-b">University</th>
                    <th className="py-2 px-4 border-b">Mobile</th>
                    <th className="py-2 px-4 border-b">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTeachers.map(teacher => (
                    <tr key={teacher.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{teacher.name}</td>
                      <td className="py-2 px-4">{teacher.email}</td>
                      <td className="py-2 px-4">{teacher.university}</td>
                      <td className="py-2 px-4">{teacher.mobile}</td>
                      <td className="py-2 px-4">
                        <button
                          className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition"
                          onClick={() => handleApprove(teacher.id)}
                        >
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminMainArea>
    </AdminLayout>
  );
}
