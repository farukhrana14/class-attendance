import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Time window logic is commented out for now.
// To be implemented: allow check-in only during a configurable time window per class session.
// Example:
// const CHECKIN_START = "08:00";
// const CHECKIN_END = "08:30";
// function isWithinTimeWindow() {
//   const now = new Date();
//   const [startHour, startMin] = CHECKIN_START.split(":").map(Number);
//   const [endHour, endMin] = CHECKIN_END.split(":").map(Number);
//   const start = new Date(now);
//   start.setHours(startHour, startMin, 0, 0);
//   const end = new Date(now);
//   end.setHours(endHour, endMin, 59, 999);
//   return now >= start && now <= end;
// }

export default function Checkin() {
  const auth = useAuth();
  const user = auth.user;
  const userData = auth.userData || {};
  const login = auth.login;
  const logout = auth.logout;
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [availableSections, setAvailableSections] = useState([]);
  const [gpsPermission, setGpsPermission] = useState(null);
  const [location, setLocation] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Fetch available courses when component mounts
  useEffect(() => {
    const fetchCourses = async () => {
      if (user) {
        setLoadingCourses(true);
        try {
          const coursesSnap = await getDocs(collection(db, "courses"));
          const courses = coursesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Also fetch sections from pending students for this user
          const pendingRef = collection(db, "pendingStudents");
          const pendingQuery = query(pendingRef, where("email", "==", user.email));
          const pendingSnap = await getDocs(pendingQuery);
          
          let userPendingData = null;
          if (!pendingSnap.empty) {
            userPendingData = pendingSnap.docs[0].data();
          }

          setAvailableCourses(courses);
          
          // If only one course, auto-select it
          if (courses.length === 1) {
            setSelectedCourse(courses[0].id);
            // Get sections for the auto-selected course
            const courseSections = [...new Set(courses.map(c => c.section).filter(Boolean))];
            
            // Add user's pending section if it exists and not already in the list
            if (userPendingData && userPendingData.section && !courseSections.includes(userPendingData.section)) {
              courseSections.push(userPendingData.section);
            }
            
            setAvailableSections(courseSections);
          }
        } catch (err) {
          console.error("Error fetching courses:", err);
          setError("Failed to load courses. Please try again.");
        } finally {
          setLoadingCourses(false);
        }
      }
    };

    fetchCourses();
  }, [user]);

  // Update available sections when course is selected
  useEffect(() => {
    const updateSections = async () => {
      if (selectedCourse) {
        const coursesWithSameName = availableCourses.filter(course => 
          course.id === selectedCourse || 
          course.courseCode === availableCourses.find(c => c.id === selectedCourse)?.courseCode
        );
        const courseSections = [...new Set(coursesWithSameName.map(c => c.section).filter(Boolean))];
        
        // Get user's pending section data
        try {
          const pendingRef = collection(db, "pendingStudents");
          const pendingQuery = query(pendingRef, where("email", "==", user.email));
          const pendingSnap = await getDocs(pendingQuery);
          
          if (!pendingSnap.empty) {
            const userPendingData = pendingSnap.docs[0].data();
            // Add pending section if it exists and not already in the list
            if (userPendingData.section && !courseSections.includes(userPendingData.section)) {
              courseSections.push(userPendingData.section);
            }
          }
        } catch (err) {
          console.error("Error fetching pending data:", err);
        }
        
        setAvailableSections(courseSections);
        
        // If only one section, auto-select it
        if (courseSections.length === 1) {
          setSelectedSection(courseSections[0]);
        } else {
          setSelectedSection("");
        }
      }
    };

    updateSections();
  }, [selectedCourse, availableCourses, user]);

  const requestGpsPermission = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsPermission(true);
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => {
          setGpsPermission(false);
          setError("GPS permission denied. Please enable location access to mark attendance.");
        }
      );
    } else {
      setError("Geolocation not supported by your browser.");
    }
  };

  const handleCheckin = async () => {
    setLoading(true);
    setError("");
    setStatus("");
    
    try {
      if (!user) {
        setError("You must be signed in as a student.");
        setLoading(false);
        return;
      }
      
      // Allow check-in for users without userData (new users) or users with student role
      if (userData && userData.role && userData.role !== "student") {
        setError("You must be signed in as a student.");
        setLoading(false);
        return;
      }
      if (!selectedCourse) {
        setError("Please select a course.");
        setLoading(false);
        return;
      }
      // Only require section if sections are available
      if (availableSections.length > 0 && !selectedSection) {
        setError("Please select a section.");
        setLoading(false);
        return;
      }
      if (!gpsPermission || !location) {
        setError("GPS permission is required. Please enable location access.");
        setLoading(false);
        return;
      }

      // Find the matching course
      let matchingCourse = availableCourses.find(course => course.id === selectedCourse);
      
      // If no section is selected (because none available), use the course without section matching
      if (!selectedSection || availableSections.length === 0) {
        // Just use the selected course
      } else {
        // Try to find course with matching section
        const courseWithSection = availableCourses.find(course => 
          course.id === selectedCourse && course.section === selectedSection
        );
        if (courseWithSection) {
          matchingCourse = courseWithSection;
        }
      }

      if (!matchingCourse) {
        setError("No matching course found. Please contact your teacher.");
        setLoading(false);
        return;
      }

      // Check if student is enrolled in this course
      const studentsRef = collection(db, "courses", matchingCourse.id, "students");
      const studentQuery = query(studentsRef, where("email", "==", user.email));
      const studentSnap = await getDocs(studentQuery);

      if (studentSnap.empty) {
        setError("You are not enrolled in this course. Please contact your teacher.");
        setLoading(false);
        return;
      }

      // Generate attendance document ID using MVP schema
      const today = new Date().toISOString().split('T')[0];
      const dateId = today.replace(/-/g, ''); // Convert YYYY-MM-DD to YYYYMMDD
      const safeEmail = btoa(user.email).replace(/[^a-zA-Z0-9]/g, '');
      const attendanceDocId = `${matchingCourse.id}_${dateId}_${safeEmail}`;

      // Save attendance record
      const attendanceDocRef = doc(db, "attendance", attendanceDocId);
      await setDoc(attendanceDocRef, {
        studentEmail: user.email,
        studentName: userData?.name || user.displayName || user.email,
        studentId: studentSnap.docs[0].data().studentId || "",
        section: selectedSection || "Not specified",
        courseId: matchingCourse.id,
        courseCode: matchingCourse.courseCode || "",
        courseName: matchingCourse.courseName || matchingCourse.title || "",
        university: matchingCourse.university || "",
        date: today,
        dateId: dateId,
        status: "present",
        mode: "self-checkin",
        teacherEmail: matchingCourse.teacherEmail || "",
        teacherName: matchingCourse.teacherName || "",
        timestamp: serverTimestamp(),
        location: location
      });

      setStatus("Check-in successful! Your attendance has been recorded.");
      
      // Redirect to student dashboard after successful check-in
      setTimeout(() => {
        navigate("/student");
      }, 2000);
      
    } catch (err) {
      console.error("Check-in error:", err);
      setError("Check-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 font-sans">
      {/* Sign Out Button - positioned at top right when user is signed in */}
      {user && (
        <div className="absolute top-4 right-4">
          <button
            onClick={() => {
              logout();
              setTimeout(() => {
                navigate("/");
              }, 100);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800 text-center">Student Check-in</h1>
        
        {/* Status and Error Messages */}
        {status && <div className="bg-green-100 text-green-800 p-4 rounded mb-4 text-center">{status}</div>}
        {error && <div className="bg-red-100 text-red-800 p-4 rounded mb-4 text-center">{error}</div>}

        {/* Not signed in: show Google sign-in button */}
        {!user && (
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please sign in to check your attendance</p>
            <button
              onClick={login}
              className="flex items-center justify-center w-full bg-white border border-gray-300 rounded shadow px-6 py-3 mb-4 hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg
                className="w-6 h-6 mr-3"
                viewBox="0 0 533.5 544.3"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.5-34-4.3-50.3H272v95.3h146.9c-6.4 34.9-25.9 64.4-55.4 84.3v69h89.4c52.4-48.3 82.6-119.4 82.6-198.3z" />
                <path fill="#34A853" d="M272 544.3c74 0 135.9-24.4 181.2-66.2l-89.4-69c-24.8 16.5-56.6 26.3-91.8 26.3-70.6 0-130.4-47.7-151.9-111.5H30.4v69.8A271 271 0 0 0 272 544.3z" />
                <path fill="#FBBC04" d="M120.1 325.9a163.1 163.1 0 0 1-9.1-53.9 163.2 163.2 0 0 1 9.1-53.9v-69.8H30.4a271 271 0 0 0 0 247.4l89.7-69.8z" />
                <path fill="#EA4335" d="M272 107.7c39.9 0 75.7 13.7 103.9 40.6l77.8-77.8C404.2 24 343.5 0 272 0 167.9 0 79.7 57.6 30.4 143.9l89.7 69.8c21.5-63.8 81.3-111.5 151.9-111.5z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        )}

        {/* Signed in as admin/teacher: show logout button */}
        {user && userData && userData.role && userData.role !== "student" && (
          <div className="text-center">
            <div className="mb-4 text-yellow-700 bg-yellow-100 p-3 rounded">
              You are signed in as <b>{userData.role}</b>. Please log out and sign in as a student to check in.
            </div>
            <button
              onClick={logout}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-lg text-lg font-bold shadow hover:bg-red-700 transition-colors"
            >
              Log Out
            </button>
          </div>
        )}

        {/* Signed in as student or new user: show check-in form */}
        {user && (!userData || !userData.role || userData.role === "student") && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-gray-600">Welcome, <span className="font-semibold">{userData?.name || user.displayName || user.email}</span></p>
            </div>

            {/* Course Selection */}
            {loadingCourses ? (
              <div className="text-center text-gray-500">Loading courses...</div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  disabled={availableCourses.length === 1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  required
                >
                  <option value="">Choose a course...</option>
                  {availableCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.courseCode} - {course.courseName || course.title}
                    </option>
                  ))}
                </select>
                {availableCourses.length === 1 && (
                  <p className="text-xs text-gray-500 mt-1">Only one course available (auto-selected)</p>
                )}
              </div>
            )}

            {/* Section Selection */}
            {selectedCourse && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Section {availableSections.length === 0 && <span className="text-gray-500 text-xs">(Optional)</span>}
                </label>
                {availableSections.length > 0 ? (
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    disabled={availableSections.length === 1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required={availableSections.length > 0}
                  >
                    <option value="">Choose a section...</option>
                    {availableSections.map(section => (
                      <option key={section} value={section}>
                        Section {section}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    No sections available for this course
                  </div>
                )}
                {availableSections.length === 1 && (
                  <p className="text-xs text-gray-500 mt-1">Only one section available (auto-selected)</p>
                )}
                {availableSections.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">Section information will be added when teacher sets up course sections</p>
                )}
              </div>
            )}

            {/* GPS Permission */}
            {selectedCourse && (availableSections.length === 0 || selectedSection) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Verification
                </label>
                {gpsPermission === null ? (
                  <button
                    onClick={requestGpsPermission}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Enable GPS Access
                  </button>
                ) : gpsPermission ? (
                  <div className="bg-green-100 text-green-800 p-3 rounded-lg text-center">
                    <p className="font-medium">✓ Location Verified</p>
                  </div>
                ) : (
                  <div className="bg-red-100 text-red-800 p-3 rounded-lg text-center">
                    <p className="font-medium">GPS access denied</p>
                    <button
                      onClick={requestGpsPermission}
                      className="mt-2 text-sm underline hover:no-underline"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Submit Attendance Button */}
            {selectedCourse && (availableSections.length === 0 || selectedSection) && gpsPermission && (
              <button
                onClick={handleCheckin}
                disabled={loading}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-bold shadow hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit My Attendance"}
              </button>
            )}

            {/* Back to Dashboard */}
            <div className="text-center pt-4">
              <button
                onClick={() => navigate("/student")}
                className="text-gray-600 hover:text-gray-800 text-sm underline"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
