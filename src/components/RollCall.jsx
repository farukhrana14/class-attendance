import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  setDoc, 
  serverTimestamp,
  query,
  where
} from "firebase/firestore";
  // const [allAttendance, setAllAttendance] = useState([]);

// Presentational: CourseHeader
function CourseHeader({ course, today, courseId, navigate }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {course.courseCode} - {course.courseName}
          </h1>
          <p className="text-gray-600 mt-1">
            {course.university} • Section {course.section} • {course.semester}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Roll Call for {new Date(today).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => navigate(`/teacher/courses/${courseId}`)}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Course
        </button>
      </div>
    </div>
  );
}

// Presentational: RosterList
function RosterList({ students, attendance, handleAttendanceChange }) {
  if (students.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">No students in roster</p>
        <p className="text-sm text-gray-400 mt-2">
          Add students to the course roster to take attendance
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {students.map((student) => (
        <div
          key={student.email}
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{student.name}</h3>
            <p className="text-sm text-gray-600">{student.email}</p>
            {student.studentId && (
              <p className="text-sm text-gray-500">ID: {student.studentId}</p>
            )}
          </div>
          <div className="flex space-x-2">
            {["present", "late", "absent"].map((status) => (
              <button
                key={status}
                onClick={() => handleAttendanceChange(student.email, status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  attendance[student.email] === status
                    ? status === "present"
                      ? "bg-green-600 text-white"
                      : status === "late"
                      ? "bg-yellow-600 text-white"
                      : "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Presentational: AttendanceSummary
function AttendanceSummary({ students, attendance }) {
  if (students.length === 0) return null;
  return (
    <div className="mt-8 grid grid-cols-3 gap-4">
      <div className="bg-green-50 p-4 rounded-lg text-center">
        <p className="text-2xl font-bold text-green-600">
          {Object.values(attendance).filter(status => status === "present").length}
        </p>
        <p className="text-sm text-green-700">Present</p>
      </div>
      <div className="bg-yellow-50 p-4 rounded-lg text-center">
        <p className="text-2xl font-bold text-yellow-600">
          {Object.values(attendance).filter(status => status === "late").length}
        </p>
        <p className="text-sm text-yellow-700">Late</p>
      </div>
      <div className="bg-red-50 p-4 rounded-lg text-center">
        <p className="text-2xl font-bold text-red-600">
          {students.length - Object.keys(attendance).length + 
           Object.values(attendance).filter(status => status === "absent").length}
        </p>
        <p className="text-sm text-red-700">Absent</p>
      </div>
    </div>
  );
}

// Presentational: MessageModal
function MessageModal({ show, messageContent, closeMessageModal, handleConfirm }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className={`p-4 border-b ${
          messageContent.type === 'success' ? 'border-green-200 bg-green-50' :
          messageContent.type === 'error' ? 'border-red-200 bg-red-50' :
          messageContent.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
          'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center">
            <div className={`text-2xl mr-3 ${
              messageContent.type === 'success' ? 'text-green-600' :
              messageContent.type === 'error' ? 'text-red-600' :
              messageContent.type === 'warning' ? 'text-yellow-600' :
              'text-gray-600'
            }`}>
              {messageContent.type === 'success' ? '✅' :
               messageContent.type === 'error' ? '❌' :
               messageContent.type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <h3 className={`text-lg font-semibold ${
              messageContent.type === 'success' ? 'text-green-900' :
              messageContent.type === 'error' ? 'text-red-900' :
              messageContent.type === 'warning' ? 'text-yellow-900' :
              'text-gray-900'
            }`}>
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
            onClick={messageContent.onConfirm ? handleConfirm : closeMessageModal}
            className={`px-4 py-2 rounded-md font-medium ${
              messageContent.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
              messageContent.type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
              messageContent.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
              'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {messageContent.onConfirm ? 'Confirm' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RollCall() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastSavedDate, setLastSavedDate] = useState(null);
  const [lastSavedAttendance, setLastSavedAttendance] = useState({});
  const [attendanceModified, setAttendanceModified] = useState(false);
  
  // Message modal state
  const [showMessage, setShowMessage] = useState(false);
  const [messageContent, setMessageContent] = useState({ type: "", title: "", message: "", onConfirm: null });

  const today = new Date().toISOString().split('T')[0];
  const dateId = today.replace(/-/g, ''); // Convert YYYY-MM-DD to YYYYMMDD

  const handleSignOut = () => {
    logout();
    setTimeout(() => {
      navigate("/");
    }, 100);
  };
  
  // Show message modal
  const showMessageModal = (type, title, message, onConfirm = null) => {
    setMessageContent({ type, title, message, onConfirm });
    setShowMessage(true);
  };

  // Close message modal
  const closeMessageModal = () => {
    setShowMessage(false);
    setMessageContent({ type: "", title: "", message: "", onConfirm: null });
  };

  // Handle confirmation
  const handleConfirm = () => {
    if (messageContent.onConfirm) {
      messageContent.onConfirm();
    }
    closeMessageModal();
  };

  // Fetch course details and roster
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Get course details
        // const courseDoc = await getDoc(doc(db, "courses", courseId));
        // console.log("Course document:", courseId, courseDoc);
        // console.log("Signed-in user data:", userData);        
        // if (!courseDoc.exists()) {
        //   setError("Course not found");
        // console.log("Course data Error:", courseId);
        //   return;
        // }
        
        // const courseData = { id: courseDoc.id, ...courseDoc.data() };
        // setCourse(courseData);
// Get course details by matching the `id` field instead of doc ID
const courseRef = doc(db, "courses", courseId);
const courseDoc = await getDoc(courseRef);

console.log("CourseId param:", courseId);
console.log("Signed-in user data:", userData);

if (!courseDoc.exists()) {
  setError("Course not found");
  console.log("Course data Error:", courseId);
  return;
}

const data = courseDoc.data();

if (data.status !== "active") {
  setError("Course not active");
  console.log("Course inactive:", courseId);
  return;
}

const courseData = { id: courseDoc.id, ...data };
setCourse(courseData);

console.log("Course document:", courseDoc.id, courseData);




// Fetch students enrolled in this course
// Fetch all students
const rosterRef = collection(db, "users");
const q = query(
  rosterRef,
  where("role", "==", "student"),
  where("status", "==", "active")
);

const rosterSnap = await getDocs(q);

const studentsList = [];
rosterSnap.forEach((doc) => {
  const data = doc.data();
  const isEnrolled = (data.enrolledCourses || []).some(
    (c) => c.courseId === courseId
  );
  if (isEnrolled) {
    studentsList.push({ id: doc.id, ...data });
  }
});

setStudents(studentsList);
console.log("Students in roster:", studentsList);


        // Check for existing attendance today
        const existingAttendance = {};
        const attendancePromises = studentsList.map(async (student) => {
          // Generate a safe document ID by encoding the email
          const safeEmail = btoa(student.email).replace(/[^a-zA-Z0-9]/g, '');
          const attendanceDocId = `${courseId}_${dateId}_${safeEmail}`;
          const attendanceDoc = await getDoc(doc(db, "attendance", attendanceDocId));
          if (attendanceDoc.exists()) {
            existingAttendance[student.email] = attendanceDoc.data().status;
          }
        });
        
        await Promise.all(attendancePromises);
        setAttendance(existingAttendance);
        
        // If attendance exists for today, mark as saved
        if (Object.keys(existingAttendance).length > 0) {
          setLastSavedDate(today);
          setLastSavedAttendance({...existingAttendance});
          setAttendanceModified(false);
        }
        
      } catch (err) {
        console.error("Error fetching course data:", err);
        setError("Failed to load course data");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  // Handle attendance status change
  const handleAttendanceChange = (studentEmail, status) => {
    setAttendance(prev => {
      const newAttendance = {
        ...prev,
        [studentEmail]: status
      };
      
      // Check if attendance has been modified from last saved state
      const isModified = JSON.stringify(newAttendance) !== JSON.stringify(lastSavedAttendance);
      setAttendanceModified(isModified);
      
      return newAttendance;
    });
  };

  // Save attendance to Firestore
  const saveAttendance = async () => {
    try {
      setSaving(true);
      
      console.log("Starting attendance save...");
      console.log("Course:", course);
      console.log("Students:", students);
      console.log("Attendance data:", attendance);
      
      // Save each student's attendance
      const savePromises = students.map(async (student) => {
        const status = attendance[student.email] || "absent";
        
        // Create attendance document following MVP schema
        // Generate a safe document ID by encoding the email
        const safeEmail = btoa(student.email).replace(/[^a-zA-Z0-9]/g, '');
        const attendanceDocId = `${courseId}_${dateId}_${safeEmail}`;
        
        console.log(`Saving attendance for ${student.name}:`, {
          docId: attendanceDocId,
          status: status,
          email: student.email
        });
        
        const attendanceDocRef = doc(db, "attendance", attendanceDocId);
        
        const attendanceData = {
          studentEmail: student.email,
          studentName: student.name,
          studentId: student.studentId || "",
          section: student.section || "",
          courseId: courseId,
          courseCode: course.courseCode || "",
          courseName: course.courseName || course.title || "",
          university: course.university || "",
          date: today,
          dateId: dateId,
          status: status,
          mode: "rollcall",
          email: userData.email,
          teacherName: userData.name,
          timestamp: serverTimestamp()
        };
        
        console.log("Attendance data to save:", attendanceData);
        
        await setDoc(attendanceDocRef, attendanceData);
        console.log(`Successfully saved attendance for ${student.name}`);
      });

      await Promise.all(savePromises);
      
      console.log("All attendance records saved successfully!");
      
      // Update saved state tracking
      setLastSavedDate(today);
      setLastSavedAttendance({...attendance});
      setAttendanceModified(false);
      
      // Show success message in modal
      showMessageModal(
        "success", 
        "Attendance Saved", 
        "Attendance records have been successfully saved."
      );
      
    } catch (err) {
      console.error("Detailed error saving attendance:", err);
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);
      console.error("Error code:", err.code);
      
      // Show error message in modal
      showMessageModal(
        "error", 
        "Save Error", 
        `Failed to save attendance. Error: ${err.message}`
      );
    } finally {
      setSaving(false);
    }
  };

  // Determine if Save button should be shown
  const shouldShowSaveButton = () => {
    // Show if no previous save for today
    if (lastSavedDate !== today) return true;
    
    // Show if attendance has been modified since last save
    if (attendanceModified) return true;
    
    // Hide if saved today and no modifications
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading course data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-lg text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate("/teacher")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Header with Sign Out and Back to Course buttons (mobile only) */}
      <div className="absolute top-4 right-4 flex space-x-2 md:hidden">
        <button
          onClick={handleSignOut}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
        {course && (
          <button
            onClick={() => navigate(`/teacher/courses/${courseId}`)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors md:hidden"
          >
            Back to Course
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Course Header */}
        {course && <CourseHeader course={course} today={today} courseId={courseId} navigate={navigate} />}

        {/* Attendance Summary Row (moved above container) */}
        <AttendanceSummary students={students} attendance={attendance} />

        {/* Student's Attendance */}
        <div className="bg-white rounded-lg shadow-md p-6 relative flex flex-col mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Student's Attendance ({students.length} students)
            </h2>
            {shouldShowSaveButton() && (
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
              >
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            )}
            {!shouldShowSaveButton() && (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium">
                ✅ Attendance saved for {new Date(today).toLocaleDateString()}
              </div>
            )}
          </div>

          <RosterList students={students} attendance={attendance} handleAttendanceChange={handleAttendanceChange} />

          {/* Bottom Save Attendance button, aligned with top button */}
          <div className="flex justify-end mt-8">
            {shouldShowSaveButton() && (
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
              >
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            )}
          </div>
        </div>
      </div>

      <MessageModal show={showMessage} messageContent={messageContent} closeMessageModal={closeMessageModal} handleConfirm={handleConfirm} />
    </div>
  );
}
