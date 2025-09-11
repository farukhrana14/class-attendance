import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function AdminCourseManagement() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  useEffect(() => {
    // Fetch courses
    const coursesUnsub = onSnapshot(collection(db, "courses"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCourses(list);
    });

    // Fetch teachers for assignment dropdown
    const teachersQuery = query(collection(db, "users"), where("role", "==", "teacher"));
    const teachersUnsub = onSnapshot(teachersQuery, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTeachers(list);
    });

    return () => {
      coursesUnsub();
      teachersUnsub();
    };
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState({
    courseName: "",
    courseCode: "",
    section: "",
    instructor: "",
    schedule: "",
    location: "",
    description: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const addCourse = async () => {
    if (!form.courseName || !form.courseCode) return;

    const courseId = `${form.courseCode}_${form.section || "001"}`;
    const newCourse = {
      courseName: form.courseName,
      courseCode: form.courseCode,
      section: form.section || "001",
      instructor: form.instructor,
      schedule: form.schedule,
      location: form.location,
      description: form.description,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "courses", courseId), newCourse);
      console.log("Course added to Firestore:", newCourse);
    } catch (error) {
      console.error("Error adding course:", error);
    }

    setForm({ 
      courseName: "", 
      courseCode: "", 
      section: "", 
      instructor: "", 
      schedule: "", 
      location: "", 
      description: "" 
    });
    setIsModalOpen(false);
  };

  const deleteCourse = async (id) => {
    if (userData?.role !== "admin") {
      alert("Only admins can delete courses.");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this course? This will also delete all associated attendance records.");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "courses", id));
      console.log("Course deleted from Firestore:", id);
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  const handleEdit = (course) => {
    setIsEditMode(true);
    setForm({
      courseName: course.courseName || "",
      courseCode: course.courseCode || "",
      section: course.section || "",
      instructor: course.instructor || "",
      schedule: course.schedule || "",
      location: course.location || "",
      description: course.description || ""
    });
    setIsModalOpen(true);
  };

  const updateCourse = async () => {
    if (!form.courseName || !form.courseCode) return;

    const courseId = `${form.courseCode}_${form.section || "001"}`;
    const updatedCourse = {
      courseName: form.courseName,
      courseCode: form.courseCode,
      section: form.section || "001",
      instructor: form.instructor,
      schedule: form.schedule,
      location: form.location,
      description: form.description,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "courses", courseId), updatedCourse, { merge: true });
      console.log("Course updated in Firestore:", updatedCourse);
      setIsModalOpen(false);
      setIsEditMode(false);
      setForm({ 
        courseName: "", 
        courseCode: "", 
        section: "", 
        instructor: "", 
        schedule: "", 
        location: "", 
        description: "" 
      });
    } catch (error) {
      console.error("Error updating course:", error);
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
          Admin Course Management
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
          Add Course
        </button>
      )}

      <div className="overflow-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200 table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Course Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Section
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Instructor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Location
              </th>
              {userData?.role === "admin" && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No courses available.
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{course.courseName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{course.courseCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{course.section}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{course.instructor || "Unassigned"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{course.schedule || "TBD"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{course.location || "TBD"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                    {userData?.role === "admin" && (
                      <>
                        <button
                          onClick={() => handleEdit(course)}
                          className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCourse(course.id)}
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

      {/* Course Modal (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded p-6 w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {isEditMode ? "Edit Course" : "Add New Course"}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block mb-2">
                Course Name *
                <input
                  type="text"
                  name="courseName"
                  value={form.courseName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Introduction to Computer Science"
                />
              </label>

              <label className="block mb-2">
                Course Code *
                <input
                  type="text"
                  name="courseCode"
                  value={form.courseCode}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="CS101"
                />
              </label>

              <label className="block mb-2">
                Section
                <input
                  type="text"
                  name="section"
                  value={form.section}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="001"
                />
              </label>

              <label className="block mb-2">
                Instructor
                <select
                  name="instructor"
                  value={form.instructor}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Instructor</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.name}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block mb-2">
                Schedule
                <input
                  type="text"
                  name="schedule"
                  value={form.schedule}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="MWF 10:00-11:00 AM"
                />
              </label>

              <label className="block mb-2">
                Location
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Room 101"
                />
              </label>
            </div>

            <label className="block mb-4 mt-4">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Course description..."
              />
            </label>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditMode(false);
                  setForm({ 
                    courseName: "", 
                    courseCode: "", 
                    section: "", 
                    instructor: "", 
                    schedule: "", 
                    location: "", 
                    description: "" 
                  });
                }}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={isEditMode ? updateCourse : addCourse}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {isEditMode ? "Save Changes" : "Add Course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
