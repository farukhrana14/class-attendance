import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";

export default function AdminStudentManagement() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "student"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setStudents(list);
    return (
      <AdminLayout>
        <div className="p-6 font-sans">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Admin Student Management</h2>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
          {userData?.role === "admin" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Add Student
            </button>
          )}
          <div className="overflow-auto bg-white rounded shadow">
            <table className="min-w-full divide-y divide-gray-200 table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled Courses</th>
                  {userData?.role === "admin" && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No students available.</td>
                  </tr>
                ) : (
                  students.map(({ id, name, email, studentId, enrolledCourses = [] }) => (
                    <tr key={id}>
                      <td className="px-6 py-4 whitespace-nowrap">{name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{studentId || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{enrolledCourses.length > 0 ? enrolledCourses.join(", ") : "None"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                        {userData?.role === "admin" && (
                          <>
                            <button
                              onClick={() => handleEdit({ id, name, email, studentId, enrolledCourses })}
                              className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition-colors"
                            >Edit</button>
                            <button
                              onClick={() => deleteStudent(id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Student Modal (Add/Edit) */}
          {isModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <div className="bg-white rounded p-6 w-full max-w-md shadow-lg">
                <h3 className="text-xl font-semibold mb-4">{isEditMode ? "Edit Student" : "Add New Student"}</h3>
                <label className="block mb-2">Name
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full name"
                  />
                </label>
                <label className="block mb-2">Email
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                    readOnly={isEditMode}
                  />
                </label>
                <label className="block mb-2">Student ID
                  <input
                    type="text"
                    name="studentId"
                    value={form.studentId}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Student ID"
                  />
                </label>
                <label className="block mb-4">Enrolled Courses <small>(comma separated)</small>
                  <input
                    type="text"
                    name="enrolledCourses"
                    value={form.enrolledCourses}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="CS101, MATH202"
                  />
                </label>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsEditMode(false);
                      setForm({ name: "", email: "", studentId: "", enrolledCourses: "" });
                    }}
                    className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors"
                  >Cancel</button>
                  <button
                    onClick={isEditMode ? updateStudent : addStudent}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >{isEditMode ? "Save Changes" : "Add Student"}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    );
                  <td className="px-6 py-4 whitespace-nowrap">{email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{studentId || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {enrolledCourses.length > 0 ? enrolledCourses.join(", ") : "None"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                    {userData?.role === "admin" && (
                      <>
                        <button
                          onClick={() => handleEdit({ id, name, email, studentId, enrolledCourses })}
                          className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteStudent(id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Student Modal (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded p-6 w-full max-w-md shadow-lg">
            <h3 className="text-xl font-semibold mb-4">
              {isEditMode ? "Edit Student" : "Add New Student"}
            </h3>
            
            <label className="block mb-2">
              Name
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full name"
              />
            </label>

            <label className="block mb-2">
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
                readOnly={isEditMode}
              />
            </label>

            <label className="block mb-2">
              Student ID
              <input
                type="text"
                name="studentId"
                value={form.studentId}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Student ID (optional)"
              />
            </label>

            <label className="block mb-4">
              Enrolled Courses 
              <small>(comma separated)</small>
              <input
                type="text"
                name="enrolledCourses"
                value={form.enrolledCourses}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="CS101, MATH202"
              />
            </label>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditMode(false);
                  setForm({ name: "", email: "", studentId: "", enrolledCourses: "" });
                }}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={isEditMode ? updateStudent : addStudent}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {isEditMode ? "Save Changes" : "Add Student"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
