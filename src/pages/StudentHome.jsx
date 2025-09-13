import React, { useState, useEffect } from "react";
import { collection, getDocs, getDoc, setDoc, doc, query, where, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// Remove sampleStudent, use real userData from AuthContext



export default function StudentHome() {
  const { user, userData, loading, logout } = useAuth();

  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [checkinCourse, setCheckinCourse] = useState(null);
  const [gpsPermission, setGpsPermission] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  // Track checked-in courses for today
  const [checkedInToday, setCheckedInToday] = useState({}); // { [courseId]: true }

  // Fetch enrolled courses from Firestore
  // Always fetch checked-in status on mount and after check-in
  const fetchCoursesAndAttendance = async () => {
    if (!user || !user.email) return;
    setCoursesLoading(true);
    try {
      const coursesSnap = await getDocs(collection(db, "courses"));
      const courses = [];
      const checkedIn = {};
      const today = new Date().toISOString().slice(0, 10);
      for (const docSnap of coursesSnap.docs) {
        const courseData = { id: docSnap.id, ...docSnap.data() };
        // Check if student is in students subcollection
        const studentsSnap = await getDocs(collection(db, "courses", docSnap.id, "students"));
        const isEnrolled = studentsSnap.docs.some(
          (s) => (s.data().email || "").toLowerCase() === user.email.toLowerCase()
        );
        if (isEnrolled) {
          courses.push({
            id: courseData.id,
            code: courseData.courseCode || courseData.code || "",
            title: courseData.courseName || courseData.title || "",
            instructor: courseData.teacherName || courseData.instructor || "",
            section: courseData.section || "",
            semester: courseData.semester || "",
          });
          // Check attendance for today
          const attendanceId = `${today}_${user.email}`;
          const attendanceRef = doc(db, "courses", docSnap.id, "attendance", attendanceId);
          const attendanceSnap = await getDoc(attendanceRef);
          if (attendanceSnap.exists()) {
            checkedIn[docSnap.id] = true;
          }
        }
      }
      setEnrolledCourses(courses);
      setCheckedInToday(checkedIn);
    } catch (err) {
      setEnrolledCourses([]);
      setCheckedInToday({});
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesAndAttendance();
    // eslint-disable-next-line
  }, [user]);

  // Loading state
  if (loading || coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  // Not signed in or not a student
  if (!user || !userData || userData.role !== "student") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Not Authorized</h2>
          <p className="text-gray-600 mb-6">You are not signed in as a student. Please contact your instructor if you believe this is a mistake.</p>
        </div>
      </div>
    );
  }

  // Use real userData for profile
  const student = {
    name: userData.name || user.displayName || user.email,
    studentId: userData.studentId || "",
    email: user.email,
    university: userData.university || "",
    semester: userData.semester || "",
    section: userData.section || "",
    avatarUrl: ""
  };

  const openCheckin = (course) => {
    setCheckinCourse(course);
    setGpsPermission(null);
    setConfirmation(null);
    setIsCheckinOpen(true);
  };

  const closeCheckin = () => {
    setIsCheckinOpen(false);
    setCheckinCourse(null);
    setGpsPermission(null);
    setConfirmation(null);
  };

  // Request location and store coordinates
  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setGpsPermission(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGpsPermission({
        allowed: true,
        coords: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }
      }),
      () => setGpsPermission({ allowed: false })
    );
  };

  // Real check-in logic
  const submitCheckin = async () => {
    if (!gpsPermission || !gpsPermission.allowed) {
      alert("Please allow location access to check in.");
      return;
    }
    if (!user || !user.email || !checkinCourse) {
      alert("Missing user or course info.");
      return;
    }
    setSubmitting(true);
    setConfirmation(null);
    try {
      // Attendance doc: courses/{courseId}/attendance/{YYYY-MM-DD}_{studentEmail}
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
      const attendanceId = `${dateStr}_${user.email}`;
      const attendanceRef = doc(db, "courses", checkinCourse.id, "attendance", attendanceId);
      const attendanceSnap = await getDoc(attendanceRef);
      if (attendanceSnap.exists()) {
        setConfirmation(`Already checked in for ${checkinCourse.code} today.`);
        setSubmitting(false);
        // Refresh checked-in status from server
        fetchCoursesAndAttendance();
        return;
      }
      // Save attendance
      await setDoc(attendanceRef, {
        studentEmail: user.email,
        studentId: userData.studentId || "",
        name: userData.name || user.displayName || user.email,
        checkedInAt: Timestamp.now(),
        location: gpsPermission.coords,
        courseId: checkinCourse.id,
        courseCode: checkinCourse.code,
        courseTitle: checkinCourse.title,
        section: checkinCourse.section,
        semester: checkinCourse.semester
      });
      setConfirmation(`Attendance marked successfully for ${checkinCourse.code} on ${dateStr}`);
      // Refresh checked-in status from server
      fetchCoursesAndAttendance();
    } catch (err) {
      setConfirmation("Failed to mark attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between bg-white p-4 shadow sticky top-0 z-10">
        <div className="text-xl font-bold text-blue-600">ClassAttend</div>
        <button
          aria-label="Profile"
          onClick={() => window.location.href = "/student-profile"}
          className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
        >
          {student.name.charAt(0)}
        </button>
      </header>

      {/* Profile Info Card */}
      <section className="bg-white p-4 m-4 rounded-lg shadow space-y-2">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600">
            {student.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{student.name}</h2>
            <p className="text-gray-600 text-sm">{student.studentId}</p>
            <p className="text-gray-600 text-sm">{student.email}</p>
            <p className="text-gray-600 text-sm">{student.university}</p>
            <p className="text-gray-600 text-sm">
              Semester: {student.semester}, Section: {student.section}
            </p>
          </div>
        </div>
      </section>

      {/* Enrolled Courses Grid */}
      <section className="flex-grow p-4 space-y-4 overflow-auto">
        <h3 className="text-lg font-semibold mb-2">Enrolled Courses</h3>
        {coursesLoading ? (
          <div className="text-gray-500 text-center">Loading courses...</div>
        ) : enrolledCourses.length === 0 ? (
          <div className="text-gray-500 text-center">No enrolled courses found.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {enrolledCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white p-4 rounded-lg shadow text-left hover:shadow-md transition flex flex-col gap-2"
              >
                <div className="flex justify-between font-semibold text-blue-600 mb-1">
                  <span>{course.code}</span>
                  <span>{course.semester}</span>
                </div>
                <div className="text-gray-800 font-medium mb-1">{course.title}</div>
                <div className="text-gray-600 text-sm">Instructor: {course.instructor}</div>
                <div className="text-gray-600 text-sm">Section: {course.section}</div>
                <button
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => openCheckin(course)}
                  aria-label={`Check in for ${course.code} - ${course.title}`}
                  disabled={!!checkedInToday[course.id]}
                >
                  {checkedInToday[course.id] ? "Checked In" : "Check In"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom Navigation */}
      <nav className="bg-white sticky bottom-0 border-t border-gray-200 flex justify-around text-gray-600">
        <button
          className="p-3 flex flex-col items-center text-blue-600"
          aria-current="page"
          aria-label="Home"
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M3 9.75L12 3l9 6.75v9.75a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 19.5V9.75z" />
            <path d="M9 22V12h6v10" />
          </svg>
          Home
        </button>
        <button
          className="p-3 flex flex-col items-center hover:text-blue-600"
          aria-label="Signout"
          onClick={logout}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4" />
          </svg>
          Signout
        </button>
        <button
          className="p-3 flex flex-col items-center text-gray-400 cursor-not-allowed"
          aria-label="Settings (Disabled)"
          disabled
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.75V6m0 12v1.25m7.07-10.32l-.88.88m-10.32 10.32l-.88.88m12.02 0l-.88-.88m-10.32-10.32l-.88-.88M21 12h-1.25M4.25 12H3m16.07 4.07l-.88-.88m-10.32-10.32l-.88-.88" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Settings
        </button>
        <button
          className="p-3 flex flex-col items-center hover:text-blue-600"
          aria-label="Profile"
          onClick={() => window.location.href = "/student-profile"}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M5.121 17.804A9 9 0 1110 21c0-3-1-5-1-5" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profile
        </button>
      </nav>
      {/* Check-In Modal */}
      {isCheckinOpen && checkinCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 relative animate-fadeIn">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={closeCheckin}
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold mb-2 text-blue-600">Check In</h2>
            <div className="mb-2">
              <div className="font-semibold">{checkinCourse.code} - {checkinCourse.title}</div>
              <div className="text-gray-600 text-sm">Section: {checkinCourse.section}</div>
              <div className="text-gray-600 text-sm">Semester: {checkinCourse.semester}</div>
            </div>
            <div className="mb-4">
              <div className="text-gray-700 text-sm mb-1">Student: {student.name}</div>
              <div className="text-gray-700 text-sm mb-1">ID: {student.studentId}</div>
              <div className="text-gray-700 text-sm mb-1">Email: {student.email}</div>
            </div>
            {submitting ? (
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-2"></div>
                <div className="text-blue-600 font-semibold">Marking attendance...</div>
              </div>
            ) : confirmation ? (
              <div className="mb-4 text-green-600 font-semibold text-center">{confirmation}</div>
            ) : (
              <>
                <div className="mb-4">
                  {!gpsPermission ? (
                    <button
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={requestLocation}
                    >
                      Allow Location & Continue
                    </button>
                  ) : gpsPermission.allowed ? (
                    <button
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={submitCheckin}
                    >
                      Submit Check-In
                    </button>
                  ) : (
                    <div className="text-red-600 text-center">Location permission denied.</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


