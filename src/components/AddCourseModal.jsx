import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function AddCourseModal({ isOpen, onClose, onSuccess }) {
  const { user, userData } = useAuth();
  const [courseCode, setCourseCode] = useState("");
  const [section, setSection] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const [university, setUniversity] = useState(userData?.university || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableCourses, setAvailableCourses] = useState([]);

  // Get current semester and year as defaults
  useEffect(() => {
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const month = now.getMonth(); // 0-11

    let currentSemester = "";
    if (month >= 0 && month <= 4) currentSemester = "Spring";
    else if (month >= 5 && month <= 7) currentSemester = "Summer";
    else currentSemester = "Fall";

    setYear(currentYear);
    setSemester(currentSemester);
  }, []);

  // Fetch available courses for auto-complete
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesSnap = await getDocs(collection(db, "courses"));
        const courses = coursesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAvailableCourses(courses);
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };

    if (isOpen) {
      fetchCourses();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !userData) return;

    setLoading(true);
    setError("");

    try {
      // Create pending enrollment request
      await addDoc(collection(db, "pendingEnrollments"), {
        studentEmail: user.email,
        studentName: userData.name,
        courseCode: courseCode.trim(),
        university: university.trim(),
        section: section.trim(),
        semester: semester,
        year: year,
        status: "pending",
        requestedAt: serverTimestamp(),

        // Context for teachers
        isNewStudent: false, // User already exists
        hasActiveEnrollments: true, // Will be updated based on existing enrollments
      });

      onSuccess && onSuccess();
      onClose();

      // Reset form
      setCourseCode("");
      setSection("");
      setUniversity(userData?.university || "");
    } catch (err) {
      console.error("Error submitting course request:", err);
      setError("Failed to submit course request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Course</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Code *
            </label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., CS102, MATH201"
              required
              list="course-suggestions"
            />
            <datalist id="course-suggestions">
              {availableCourses.map((course) => (
                <option key={course.id} value={course.courseCode}>
                  {course.courseName}
                </option>
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              University *
            </label>
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., State University"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section
            </label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., A, B, C (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester *
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
                <option value="Winter">Winter</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year *
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Request Enrollment"}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="px-6 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <span className="font-medium">
                Note:
              </span>{" "}
              Your enrollment request will be sent to the course teacher for approval. You'll be notified once approved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
