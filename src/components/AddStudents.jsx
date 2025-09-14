import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  collection,
  doc,
  setDoc,
  arrayUnion,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

export default function AddStudents() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState("");
  // Removed semester state; will use semester from selected course
  const [students, setStudents] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [errorModal, setErrorModal] = useState("");
  const [courses, setCourses] = useState([]);

  // Fetch teacher's active courses
  useEffect(() => {
    if (!user?.email) return;

    const fetchCourses = async () => {
      try {
        // Fetch user document from users collection
        const userDocSnap = await getDocs(query(
          collection(db, "users"),
          where("email", "==", user.email),
          where("role", "==", "teacher"),
          where("status", "==", "active")
        ));
        let courseIds = [];
        let university = "";
        if (!userDocSnap.empty) {
          const userData = userDocSnap.docs[0].data();
          courseIds = userData.enrolledCourses || [];
          university = userData.university || "";
        }
        // Fetch course objects from courses collection using IDs
        let courseObjs = [];
        if (courseIds.length > 0) {
          const chunkSize = 10;
          for (let i = 0; i < courseIds.length; i += chunkSize) {
            const chunk = courseIds.slice(i, i + chunkSize);
            const q = query(collection(db, "courses"), where("id", "in", chunk));
            const snapshot = await getDocs(q);
            snapshot.forEach((doc) => {
              courseObjs.push({ id: doc.id, ...doc.data() });
            });
          }
        }
        setCourses(courseObjs);
      } catch (err) {
        console.error("Error fetching courses from user doc:", err);
      }
    };


    fetchCourses();
  }, [user]);

  // --- Original handleFileUpload (commented out for comparison) ---
  /*
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const parsed = XLSX.utils.sheet_to_json(worksheet);
      setStudents(parsed);
    };
    reader.readAsArrayBuffer(file);
  };
  */

  // --- handleFileUpload from CourseCreation.jsx ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          setStudents(data);
        } catch (error) {
          console.error('Error parsing file:', error);
          alert('Error parsing file. Please make sure it\'s a valid Excel/CSV file.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleSave = async () => {
    if (!selectedCourse) {
      setErrorModal("Please select a course before uploading.");
      return;
    }
    // No need to check for semester; will use from course object

    setIsChecking(true);
    try {
      // Check if course already has students
      const q = query(
        collection(db, "users"),
        where("enrolledCourses.courseId", "==", selectedCourse)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setErrorModal(
          "This course already has students. Bulk upload is disabled. Please add students individually."
        );
        setIsChecking(false);
        return;
      }

      // Save students if no roster exists yet
      const selectedCourseObj = courses.find(c => c.id === selectedCourse);
      const savePromises = students.map(async (student) => {
        const email = (student.Email || student.email || "").trim().toLowerCase();
        if (!email) return null;

        const userDocRef = doc(db, "users", email);
        await setDoc(
          userDocRef,
          {
            name: student.Name || student.name || "Unnamed Student",
            email,
            role: "student",
            status: "active",
            enrolledCourses: arrayUnion({
              courseId: selectedCourse,
              semester: selectedCourseObj?.semester || "",
              year: selectedCourseObj?.year || new Date().getFullYear(),
            }),
          },
          { merge: true }
        );
      });

      await Promise.all(savePromises.filter(Boolean));
      alert("✅ Students added successfully!");
      setStudents([]);
    } catch (err) {
      console.error("Error saving students:", err);
      setErrorModal("Something went wrong while saving students.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Add Students</h1>

        {/* Course Dropdown */}
        <label
          htmlFor="course-select"
          className="block text-lg font-medium text-gray-800 mb-2"
        >
          Select a Course
        </label>
        <select
          id="course-select"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full p-3 border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-600 mb-6"
        >
          <option value="">-- Select a course --</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.courseCode} - {course.title} ({course.semester} {course.year})
            </option>
          ))}
        </select>

        {/* Semester Dropdown removed; using semester from selected course */}

        {/* File Upload */}
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          /* onChange={handleFileUpload} */
          className="mb-4"
        />

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isChecking}
          className={`px-6 py-3 rounded-lg text-white font-medium ${
            isChecking
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isChecking ? "Checking..." : "Save Students"}
        </button>

        {/* Error Modal */}
        {errorModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl border-2 border-red-400 animate-fadeIn w-96">
              <div className="flex items-center justify-center mb-4">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-xl font-bold text-red-600 mb-2 text-center">
                ❌ Upload Blocked
              </h2>
              <p className="text-gray-700 text-center">{errorModal}</p>
              <button
                onClick={() => setErrorModal("")}
                className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
