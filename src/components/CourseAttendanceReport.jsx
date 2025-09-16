import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  startAt,
  endAt,
  documentId,
} from "firebase/firestore";
import * as XLSX from "xlsx";

//components import
import AttendanceTable from "./AttendanceTable";
import ReportHeader from "./attendance/ReportHeader";
import { printAttendance } from "../utils/attendancePrint";
//Utils
import { exportAttendanceToExcel } from "../utils/attendanceExportExcel";

//hooks import
import useCourseAttendance from "../hooks/useCourseAttendance";

export default function CourseAttendanceReport() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const dateISO = searchParams.get("date") || undefined;
  const att = useCourseAttendance(courseId, { dateISO });
  const [course, setCourse] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [dates, setDates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Message modal state
  const [showMessage, setShowMessage] = useState(false);
  const [messageContent, setMessageContent] = useState({
    type: "",
    title: "",
    message: "",
    onConfirm: null,
  });

  const showMessageModal = (type, title, message, onConfirm = null) => {
    setMessageContent({ type, title, message, onConfirm });
    setShowMessage(true);
  };

  const closeMessageModal = () => {
    setShowMessage(false);
    setMessageContent({ type: "", title: "", message: "", onConfirm: null });
  };

  const handleConfirm = () => {
    if (messageContent.onConfirm) messageContent.onConfirm();
    closeMessageModal();
  };

  // Helpers
  const toKey = (s) => (s || "").trim().toLowerCase();
  const normalizeDate = (val) => {
    if (!val) return "";
    const d = typeof val?.toDate === "function" ? val.toDate() : new Date(val);
    return d instanceof Date && !isNaN(d)
      ? d.toISOString().split("T")[0]
      : String(val);
  };
  const toDateId = (iso) => (iso || "").replaceAll("-", ""); // "2025-09-16" -> "20250916"

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!courseId) {
          setError("No course selected. Open a course, then view its report.");
          setLoading(false);
          return;
        }

        setLoading(true);

        // --- Course doc ---
        const courseSnap = await getDoc(doc(db, "courses", courseId));
        if (!courseSnap.exists()) {
          setError("Course not found");
          return;
        }
        const courseData = { id: courseSnap.id, ...courseSnap.data() };
        setCourse(courseData);

        // --- Attendance fetch ---
        const ref = collection(db, "attendance");
        const dateISO = searchParams.get("date"); // optional ?date=YYYY-MM-DD
        let snap;

        if (dateISO) {
          // By document ID prefix: courseId_YYYYMMDD_
          const prefix = `${courseId}_${toDateId(dateISO)}_`;
          const q = query(
            ref,
            orderBy(documentId()),
            startAt(prefix),
            endAt(prefix + "\uf8ff")
          );
          snap = await getDocs(q);
        } else {
          // All docs for this course
          const q = query(ref, where("courseId", "==", courseId));
          snap = await getDocs(q);
        }

        // --- Flatten + derive students and dates ---
        const records = [];
        const uniqueDates = new Set();
        const studentMap = new Map(); // key=email lowercased -> {email, name, studentId?}

        snap.forEach((d) => {
          const x = d.data();
          const dateStr = normalizeDate(x.date);
          if (dateStr) uniqueDates.add(dateStr);

          // one record per doc
          const email = x.studentEmail || x.studentId || x.email || "";
          if (!email) return;

          const rec = {
            id: d.id,
            date: dateStr,
            studentId: email, // keep label "studentId" in state
            status: x.status || "N/A",
            studentName: x.studentName || "",
            mode: x.mode || "",
            timestamp: x.timestamp || null,
          };
          records.push(rec);

          const key = toKey(email);
          if (!studentMap.has(key)) {
            studentMap.set(key, {
              id: key,
              email: email,
              name: x.studentName || email,
              studentId: x.studentId || "",
              section: x.section || "",
            });
          } else {
            const cur = studentMap.get(key);
            if (!cur.name && x.studentName) cur.name = x.studentName;
          }
        });

        // Sort records by date desc, then by email asc
        records.sort((a, b) => {
          if (a.date !== b.date) return new Date(b.date) - new Date(a.date);
          return toKey(a.studentId).localeCompare(toKey(b.studentId));
        });

        // Sort dates asc for columns
        const sortedDates = Array.from(uniqueDates).sort(
          (a, b) => new Date(a) - new Date(b)
        );

        // Sort students by name (fallback email)
        const studentList = Array.from(studentMap.values()).sort((a, b) =>
          (a.name || a.email).localeCompare(b.name || b.email)
        );

        setAttendanceRecords(records);
        setDates(sortedDates);
        setStudents(studentList);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load attendance data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, searchParams]);

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get status color class
  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "present":
        return "bg-green-100 text-green-800";
      case "late":
        return "bg-yellow-100 text-yellow-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "sick":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  // Export to Excel and Print (new)
  const handleExport = () =>
    exportAttendanceToExcel({
      course,
      students,
      dates,
      records: attendanceRecords,
    });

  const handlePrint = () =>
    printAttendance({
      course,
      teacherName: userData?.name,
      students,
      dates,
      records: attendanceRecords,
    });

  // prefer hook data if present; keep old state as fallback for now
  const handleBack = () => {
    // keep your existing target
    navigate(`/teacher/courses/${courseId}/reports`);
  };

  // ---------- RENDER ----------
  // Build once for table lookups
  const recordMap = useMemo(() => {
    const m = new Map();
    for (const r of attendanceRecords || []) {
      const email = (r.studentId || "").toLowerCase();
      if (email && r.date) m.set(`${email}__${r.date}`, r.status || "N/A");
    }
    return m;
  }, [attendanceRecords]);

  const effCourse = att.course || course;
  const effStudents = att.students?.length ? att.students : students;
  const effDates = att.dates?.length ? att.dates : dates;
  const effRecordMap = att.recordMap || recordMap;
  const effLoading = loading || att.loading;
  const effError = error || att.error;

  if (effLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading attendance records...</p>
      </div>
    );
  }

  if (effError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-lg text-red-600 mb-4">{effError}</p>
        <button
          onClick={() => navigate("/teacher/courses")}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <ReportHeader
          course={effCourse}
          teacherName={effCourse?.teacherName || userData?.name}
          onExport={handleExport} // <-- uses utils
          onPrint={handlePrint} // <-- uses utils
          onBack={handleBack}
        />

        {/* Attendance Table */}

        <div className="bg-white rounded-lg shadow-md p-6 overflow-hidden">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Attendance Records
          </h2>

          <AttendanceTable
            students={effStudents}
            dates={effDates}
            recordMap={effRecordMap}
          />
        </div>
      </div>

      {/* Message Modal */}
      {showMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div
              className={`p-4 border-b ${
                messageContent.type === "success"
                  ? "border-green-200 bg-green-50"
                  : messageContent.type === "error"
                  ? "border-red-200 bg-red-50"
                  : messageContent.type === "warning"
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`text-2xl mr-3 ${
                    messageContent.type === "success"
                      ? "text-green-600"
                      : messageContent.type === "error"
                      ? "text-red-600"
                      : messageContent.type === "warning"
                      ? "text-yellow-600"
                      : "text-gray-600"
                  }`}
                >
                  {messageContent.type === "success"
                    ? "✅"
                    : messageContent.type === "error"
                    ? "❌"
                    : messageContent.type === "warning"
                    ? "⚠️"
                    : "ℹ️"}
                </div>
                <h3
                  className={`text-lg font-semibold ${
                    messageContent.type === "success"
                      ? "text-green-900"
                      : messageContent.type === "error"
                      ? "text-red-900"
                      : messageContent.type === "warning"
                      ? "text-yellow-900"
                      : "text-gray-900"
                  }`}
                >
                  {messageContent.title}
                </h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 whitespace-pre-line">
                {messageContent.message}
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              {messageContent.onConfirm && (
                <button
                  onClick={closeMessageModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={
                  messageContent.onConfirm ? handleConfirm : closeMessageModal
                }
                className={`px-4 py-2 rounded-md font-medium ${
                  messageContent.type === "success"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : messageContent.type === "error"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : messageContent.type === "warning"
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                    : "bg-gray-600 hover:bg-gray-700 text-white"
                }`}
              >
                {messageContent.onConfirm ? "Confirm" : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
