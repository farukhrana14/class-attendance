import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import {useAuth} from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";


export default function AdminTeacherManagement() {
  const { userData, logout } = useAuth(); // will contain role: "admin" | "teacher" | "student"
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
    useEffect(() => {
  const q = query(collection(db, "users"), where("role", "==", "teacher"));
  const unsub = onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setTeachers(list);
  });
  return () => unsub();
}, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    courses: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const addTeacher = async () => {
  if (!form.name || !form.email) return;

  const newTeacher = {
    name: form.name,
    email: form.email,
    courses: form.courses
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c),
    role: "teacher",
  };

  try {
    // Save to Firestore using email as document ID
    await setDoc(doc(db, "users", form.email), newTeacher);
    console.log("Teacher added to Firestore:", newTeacher);

    // Still update local state for now
    setTeachers((prev) => [
      ...prev,
      { id: Date.now(), ...newTeacher },
    ]);
  } catch (error) {
    console.error("Error adding teacher:", error);
  }

  setForm({ name: "", email: "", courses: "" });
  setIsModalOpen(false);
};

  const deleteTeacher = async (id) => {
    if (userData?.role !== "admin") {
      alert("Only admins can delete teachers.");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this teacher?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "users", id));
      console.log("Teacher deleted from Firestore:", id);
      // No need to manually update state, onSnapshot will refresh the list
    } catch (error) {
      console.error("Error deleting teacher:", error);
    }
  };

  const handleEdit = (teacher) => {
    setIsEditMode(true);
    setForm({
      name: teacher.name,
      email: teacher.email,
      courses: teacher.courses.join(", ")
    });
    setIsModalOpen(true);
  };

  const updateTeacher = async () => {
    if (!form.name || !form.email) return;

    const updatedTeacher = {
      name: form.name,
      email: form.email,
      courses: form.courses
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c),
      role: "teacher",
    };

    try {
      await setDoc(doc(db, "users", form.email), updatedTeacher, { merge: true });
      console.log("Teacher updated in Firestore:", updatedTeacher);
      setIsModalOpen(false);
      setIsEditMode(false);
      setForm({ name: "", email: "", courses: "" });
    } catch (error) {
      console.error("Error updating teacher:", error);
    }
  };


  const handleSignOut = () => {
    logout();
    setTimeout(() => {
      navigate("/");
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">
          Admin Teacher Management
        </h2>
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
    Add Teacher
  </button>
)}


      <div className="overflow-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200 table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Courses
              </th>
              {userData?.role === "admin" && (
  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
    Actions
  </th>
)}

            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No teachers available.
                </td>
              </tr>
            ) : (
              teachers.map(({ id, name, email, courses = [] }) => (
                <tr key={id}>
                  <td className="px-6 py-4 whitespace-nowrap">{name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {courses.join(", ")}
                  </td>
                 <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
  {userData?.role === "admin" && (
    <>
      <button
        onClick={() => handleEdit({ id, name, email, courses })}
        className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition-colors"
      >
        Edit
      </button>
      <button
        onClick={() => deleteTeacher(id)}
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

      {/* Teacher Modal (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded p-6 w-full max-w-md shadow-lg">
            <h3 className="text-xl font-semibold mb-4">
              {isEditMode ? "Edit Teacher" : "Add New Teacher"}
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

            <label className="block mb-4">
              Courses 
              <small>(comma separated)</small>
              <input
                type="text"
                name="courses"
                value={form.courses}
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
                  setForm({ name: "", email: "", courses: "" });
                }}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={isEditMode ? updateTeacher : addTeacher}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {isEditMode ? "Save Changes" : "Add Teacher"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}