// src/components/AddStudents.jsx
import React, { useState, useEffect, useRef } from "react";
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
import { useAuth } from "../context/AuthContext";

export default function AddStudents() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal states
  const [errorModal, setErrorModal] = useState("");
  const [securityModal, setSecurityModal] = useState("");
  const [previewModal, setPreviewModal] = useState(false);
  const [successModal, setSuccessModal] = useState("");

  // Ref for file input
  const fileInputRef = useRef(null);

  // --- Fetch teacher's active courses
  useEffect(() => {
    if (!user?.email) return;

    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const userDocSnap = await getDocs(
          query(
            collection(db, "users"),
            where("email", "==", user.email),
            where("role", "==", "teacher"),
            where("status", "==", "active")
          )
        );
        let courseIds = [];
        if (!userDocSnap.empty) {
          const userData = userDocSnap.docs[0].data();
          courseIds = userData.enrolledCourses || [];
        }

        let courseObjs = [];
        if (courseIds.length > 0) {
          const chunkSize = 10;
          for (let i = 0; i < courseIds.length; i += chunkSize) {
            const chunk = courseIds.slice(i, i + chunkSize);
            const q = query(
              collection(db, "courses"),
              where("__name__", "in", chunk),
              where("status", "==", "active") // ✅ only active courses
            );
            const snapshot = await getDocs(q);
            snapshot.forEach((docSnap) => {
              courseObjs.push({ id: docSnap.id, ...docSnap.data() });
            });
          }
        }
        setCourses(courseObjs);
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [user]);

  // --- File Upload Handler
  const handleFileUpload = (e) => {
    if (!selectedCourse) {
      setErrorModal("Please select a course before uploading.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setErrorModal("Only CSV files are supported.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const parsed = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Validate headers
        const requiredHeaders = ["studentid", "name", "email", "mobile", "section"];
        const headers = parsed[0].map((h) => String(h).toLowerCase().trim());
        if (headers.join(",") !== requiredHeaders.join(",")) {
          setErrorModal(
            "File must contain exactly these headers: studentId, name, email, Mobile, Section."
          );
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        // Parse rows
        const rows = parsed.slice(1).map((row, idx) => {
          return {
            studentId: row[0]?.toString().trim() || "",
            name: row[1]?.toString().trim() || "",
            email: row[2]?.toString().trim() || "",
            Mobile: row[3]?.toString().trim() || "",
            Section: row[4]?.toString().trim() || "",
            _row: idx + 2,
          };
        });

        // Validate rows
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (let r of rows) {
          if (!r.studentId) {
            setErrorModal(`Invalid studentId at row ${r._row}`);
            return;
          }
          if (!r.name) {
            setErrorModal(`Invalid name at row ${r._row}`);
            return;
          }
          if (!emailRegex.test(r.email)) {
            setErrorModal(`Invalid email at row ${r._row}`);
            return;
          }
          if (!/^\d{10,15}$/.test(r.Mobile)) {
            setErrorModal(`Invalid Mobile number at row ${r._row}`);
            return;
          }
          const badString = /<|>|script|drop|;--/i;
          if (
            badString.test(r.studentId) ||
            badString.test(r.name) ||
            badString.test(r.email) ||
            badString.test(r.Mobile) ||
            badString.test(r.Section)
          ) {
            setSecurityModal("Potentially unsafe content detected. Upload blocked.");
            return;
          }
        }

        setStudents(rows);
        setPreviewModal(true);

        // ✅ Clear file input after successful upload
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (error) {
        console.error("Error parsing file:", error);
        setErrorModal("Error parsing file. Please check your CSV format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- Save Students
  const handleSave = async () => {
    if (students.length === 0) {
      setErrorModal("Please upload a student file before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const selectedCourseObj = courses.find((c) => c.id === selectedCourse);
      const savePromises = students.map(async (student) => {
        const email = student.email.toLowerCase();
        const userDocRef = doc(db, "users", email);
        await setDoc(
          userDocRef,
          {
            name: student.name,
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
      await Promise.all(savePromises);

      // ✅ Close Preview Modal and show Success
      setPreviewModal(false);
      setSuccessModal("Students added successfully!");
      setStudents([]);
    } catch (err) {
      console.error("Error saving students:", err);
      setErrorModal("Something went wrong while saving students.");
    } finally {
      setIsSaving(false);
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
        {loadingCourses ? (
          <div className="animate-pulse h-12 bg-gray-200 rounded mb-6"></div>
        ) : (
          <select
            id="course-select"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full p-3 border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-600 mb-6"
          >
            <option value="">-- Select a course --</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.courseCode} - {course.courseName || course.title} (
                {course.semester} {course.year})
              </option>
            ))}
          </select>
        )}

        {/* File Upload & Save Buttons Horizontal */}
        <div className="flex items-center gap-4 mb-4">
          <label htmlFor="student-upload" className="relative cursor-pointer inline-flex items-center px-6 py-2 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Choose File
            <input
              id="student-upload"
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onClick={e => {
                if (!selectedCourse) {
                  setErrorModal("Please select a course before uploading.");
                  e.preventDefault();
                } else {
                  setErrorModal("");
                }
              }}
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg text-white font-medium bg-blue-500 hover:bg-blue-600 shadow-md transition-all duration-200"
          >
            Save Students
          </button>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-96">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-700">{errorModal}</p>
            <button
              onClick={() => setErrorModal("")}
              className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Security Modal */}
      {securityModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-black text-white p-6 rounded-xl shadow-2xl w-96">
            <h2 className="text-xl font-bold mb-2">Security Warning</h2>
            <p>{securityModal}</p>
            <button
              onClick={() => setSecurityModal("")}
              className="mt-4 w-full px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-11/12 md:w-3/4 lg:w-1/2">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Preview Students</h2>
            <div className="max-h-64 overflow-y-auto border rounded mb-4">
              <table className="min-w-full text-sm text-left text-gray-700">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2">Student ID</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Mobile</th>
                    <th className="px-4 py-2">Section</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2">{s.studentId}</td>
                      <td className="px-4 py-2">{s.name}</td>
                      <td className="px-4 py-2">{s.email}</td>
                      <td className="px-4 py-2">{s.Mobile}</td>
                      <td className="px-4 py-2">{s.Section}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setPreviewModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center min-w-[140px] ${isSaving ? 'cursor-not-allowed opacity-70' : ''}`}
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center justify-center">
                    <span className="inline-block w-6 h-6 mr-2 align-middle">
                      <span className="block w-full h-full border-4 border-blue-400 border-t-transparent border-b-transparent rounded-full animate-spin"></span>
                    </span>
                    Saving...
                  </span>
                ) : (
                  'Confirm & Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-96 text-center">
            <h2 className="text-xl font-bold text-green-600 mb-2">Success</h2>
            <p className="text-gray-700">{successModal}</p>
            <button
              onClick={() => setSuccessModal("")}
              className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
