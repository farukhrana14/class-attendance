import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, addDoc, doc, setDoc, query, where } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";

const sampleAttendance = [
  { date: "2024-06-01", time: "08:00 AM", status: "Present" },
  { date: "2024-06-02", time: "08:05 AM", status: "Late" },
  { date: "2024-06-03", time: "Absent", status: "Absent" },
];

export default function StudentHome() {
  const { user, userData, login, logout } = useAuth();
  const navigate = useNavigate();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [gpsPermission, setGpsPermission] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [university, setUniversity] = useState("");
  const [section, setSection] = useState("");
  const [checkingRoster, setCheckingRoster] = useState(false);
  const [rosterMatch, setRosterMatch] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);
  const [studentCourses, setStudentCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [checkingAttendance, setCheckingAttendance] = useState(true);

  // Fetch today's attendance status
  useEffect(() => {
    const checkTodayAttendance = async () => {
      if (userData && userData.role === 'student') {
        setCheckingAttendance(true);
        try {
          const today = new Date().toISOString().split('T')[0];
          const attendanceRef = collection(db, "attendance");
          const q = query(
            attendanceRef,
            where("studentEmail", "==", userData.email),
            where("date", "==", today)
          );
          const attendanceSnap = await getDocs(q);
          if (!attendanceSnap.empty) {
            setTodayAttendance(attendanceSnap.docs[0].data());
          } else {
            setTodayAttendance(null);
          }
        } catch (error) {
          console.error("Error checking attendance:", error);
        } finally {
          setCheckingAttendance(false);
        }
      }
    };

    checkTodayAttendance();
  }, [userData]);

  // Fetch student's courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (userData && userData.role === 'student') {
        setLoadingCourses(true);
        try {
          const coursesSnap = await getDocs(collection(db, "courses"));
          const courses = [];
          
          for (const courseDoc of coursesSnap.docs) {
            const studentsRef = collection(db, "courses", courseDoc.id, "students");
            const q = query(studentsRef, where("email", "==", userData.email));
            const studentSnap = await getDocs(q);
            
            if (!studentSnap.empty) {
              courses.push({
                id: courseDoc.id,
                ...courseDoc.data()
              });
            }
          }
          
          setStudentCourses(courses);
        } catch (error) {
          console.error("Error fetching courses:", error);
        } finally {
          setLoadingCourses(false);
        }
      }
    };

    fetchCourses();
  }, [userData]);
  
  // Prefer name from userData, fallback to user.displayName, fallback to user.email
  const displayName = userData?.name || user?.displayName || user?.email || "Guest";
  const studentEmail = user?.email || "";
  const isStudent = userData?.role === "student";

  // Handle roster check and logout for unregistered users
  useEffect(() => {
    const checkIfInRoster = async () => {
      if (user && !userData) {
        setCheckingRoster(true);
        try {
          // Search all courses' students subcollections for this email
          const coursesSnap = await getDocs(collection(db, "courses"));
          let found = false;
          for (const courseDoc of coursesSnap.docs) {
            const studentsRef = collection(db, "courses", courseDoc.id, "students");
            const q = query(studentsRef, where("email", "==", user.email));
            const studentsSnap = await getDocs(q);
            if (!studentsSnap.empty) {
              found = true;
              break;
            }
          }
          setRosterMatch(found);
          
          // If not found in any roster, show registration form instead of logging out
          if (!found) {
            setShowRegistration(true); // Show registration form for unrostered students
          } else {
            setShowRegistration(true); // Also show for rostered students who need to complete profile
          }
        } catch (error) {
          console.error("Error checking roster:", error);
        } finally {
          setCheckingRoster(false);
        }
      }
    };
    checkIfInRoster();
  }, [user, userData, logout]);

  
  // Registration form submit - Save to pendingStudents collection per MVP
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      // Save to pendingStudents collection as per MVP schema
      await addDoc(collection(db, "pendingStudents"), {
        name: studentName || user.displayName || user.email,
        email: user.email,
        courseCode: courseCode,
        university: university,
        section: section,
        status: "pending", // default status
        createdAt: serverTimestamp()
      });
      setRegistrationSuccess(true);
      // Redirect to check-in page after successful registration
      setTimeout(() => {
        navigate("/checkin");
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed. Please try again.");
    }
  };

  const requestGpsPermission = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setGpsPermission(true);
          
          // If GPS is already allowed, this is a sign-in attempt
          if (gpsPermission === true) {
            try {
              const now = new Date();
              const today = now.toISOString().split('T')[0];
              
              // Create attendance record
              await addDoc(collection(db, "attendance"), {
                studentEmail: userData.email,
                studentName: userData.name,
                date: today,
                timestamp: now.toISOString(),
                location: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                }
              });

              // Refresh attendance status
              setCheckingAttendance(true);
              const attendanceRef = collection(db, "attendance");
              const q = query(
                attendanceRef,
                where("studentEmail", "==", userData.email),
                where("date", "==", today)
              );
              const attendanceSnap = await getDocs(q);
              if (!attendanceSnap.empty) {
                setTodayAttendance(attendanceSnap.docs[0].data());
              }
              setCheckingAttendance(false);
            } catch (error) {
              console.error("Error marking attendance:", error);
              alert("Failed to mark attendance. Please try again.");
            }
          }
        },
        () => {
          setGpsPermission(false);
          alert("GPS permission denied. Please enable location access to mark attendance.");
        }
      );
    } else {
      alert("Geolocation not supported by your browser.");
    }
  };

  // If not authenticated and not marked as not registered, show sign in/up button
  if (!user && !notRegistered) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 font-sans">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800">Welcome, Guest</h1>
        <button
          onClick={login}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-bold shadow hover:bg-blue-700 transition-colors"
        >
          Sign In / Sign Up with Google
        </button>
      </div>
    );
  }

  // Show not registered message if user was checked and not found in roster
  if (notRegistered) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 font-sans">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800">Not Registered</h1>
        <p className="text-gray-600 mb-4">Your email is not registered as a student. Please contact your teacher or admin.</p>
        <a href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Go to Home
        </a>
      </div>
    );
  }

  // If authenticated but not in users collection, and email is in a roster, show registration form
  if (showRegistration && !userData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 font-sans">
        {/* Header with Sign Out button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => {
              logout();
              setTimeout(() => {
                navigate("/");
              }, 100);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
        
        <h1 className="text-2xl font-semibold mb-4 text-gray-800">Student Registration</h1>
        <p className="text-gray-600 mb-4 text-center">Please provide your course information to complete registration.</p>
        {registrationSuccess ? (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center mb-4">
            Registration request submitted! Your registration is pending approval by your teacher or admin.
          </div>
        ) : (
          <form onSubmit={handleRegister} className="bg-white rounded shadow p-6 w-full max-w-md flex flex-col gap-4 mb-4">
            <label className="text-sm font-medium text-gray-700">
              Full Name
              <input
                type="text"
                className="mt-1 block w-full rounded border-gray-300 px-3 py-2"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder={user.displayName || user.email}
                required
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Email
              <input
                type="email"
                className="mt-1 block w-full rounded border-gray-300 bg-gray-100 px-3 py-2"
                value={user.email}
                disabled
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Course Code
              <input
                type="text"
                className="mt-1 block w-full rounded border-gray-300 px-3 py-2"
                value={courseCode}
                onChange={e => setCourseCode(e.target.value)}
                placeholder="e.g., CS101"
                required
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              University
              <input
                type="text"
                className="mt-1 block w-full rounded border-gray-300 px-3 py-2"
                value={university}
                onChange={e => setUniversity(e.target.value)}
                placeholder="e.g., State University"
                required
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Section
              <input
                type="text"
                className="mt-1 block w-full rounded border-gray-300 px-3 py-2"
                value={section}
                onChange={e => setSection(e.target.value)}
                placeholder="e.g., A, B, C"
                required
              />
            </label>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-bold shadow hover:bg-blue-700 transition-colors mt-2"
            >
              Submit Registration Request
            </button>
          </form>
        )}
        
        {/* Go to Home button */}
        <button 
          onClick={() => {
            navigate("/");
          }}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors text-center inline-block"
        >
          Go to Home
        </button>
      </div>
    );
  }

  // If user is registered and is a student, show the attendance screen
  if (userData && userData.role === 'student') {
    return (
      <div className="min-h-screen bg-gray-50 p-6 font-sans">
        {/* Header with Sign Out button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => {
              logout();
              setTimeout(() => {
                navigate("/");
              }, 100);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
        
        <div className="max-w-2xl mx-auto">
          {/* Welcome Message */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl font-semibold text-gray-800 mb-2">
              Welcome, {userData.name}! 👋
            </h1>
            <p className="text-lg text-gray-600">
              Good to see you today!
            </p>
          </div>

          {/* Course Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Courses</h2>
            <div className="space-y-4">
              {loadingCourses ? (
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="text-lg font-medium text-gray-800">Loading your courses...</h3>
                </div>
              ) : studentCourses.length > 0 ? (
                studentCourses.map(course => (
                  <div key={course.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h3 className="text-lg font-medium text-gray-800">{course.courseName}</h3>
                    <p className="text-gray-600">Teacher: {course.teacherName}</p>
                    <p className="text-gray-600">Schedule: {course.schedule || 'Not specified'}</p>
                  </div>
                ))
              ) : (
                <div className="text-gray-600 text-center py-4">
                  No courses found. Please contact your teacher.
                </div>
              )}
            </div>
          </div>

          {/* Today's Attendance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Attendance</h2>
            {checkingAttendance ? (
              <div className="text-gray-600 text-center">
                Checking attendance status...
              </div>
            ) : todayAttendance ? (
              <div className="bg-green-100 text-green-800 p-4 rounded-lg">
                <p className="font-semibold mb-1">✓ Present</p>
                <p className="text-sm">
                  Signed in at {(() => {
                    const timestamp = todayAttendance.timestamp;
                    if (!timestamp) return "Unknown time";
                    
                    // Handle Firestore Timestamp objects
                    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                      return timestamp.toDate().toLocaleTimeString();
                    }
                    
                    // Handle ISO strings or regular dates
                    const date = new Date(timestamp);
                    return isNaN(date.getTime()) ? "Unknown time" : date.toLocaleTimeString();
                  })()}
                </p>
                {todayAttendance.location && (
                  <p className="text-sm mt-1">
                    Location verified ✓
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg">
                  <p className="text-center font-medium">Please verify your location to mark attendance</p>
                </div>
                {gpsPermission === null ? (
                  <button
                    onClick={requestGpsPermission}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Allow GPS Access to Sign In
                  </button>
                ) : gpsPermission ? (
                  <button
                    onClick={requestGpsPermission}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Sign In for Today's Class
                  </button>
                ) : (
                  <div className="bg-red-100 text-red-800 p-4 rounded-lg text-center">
                    <p className="font-medium">GPS access denied</p>
                    <p className="text-sm mt-1">Please enable location access in your browser settings</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }



  // Show loading while checking roster
  if (user && !userData && checkingRoster) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 font-sans">
        <div className="text-lg text-gray-600">Checking registration status...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans max-w-md mx-auto">
      {/* Greeting */}
      <h1 className="text-2xl font-semibold mb-1 text-gray-800">
        {isSignedIn ? `Welcome, ${displayName}` : "Welcome, Guest"}
      </h1>
      {isSignedIn && (
        <p className="text-gray-500 text-sm mb-4">{studentEmail}</p>
      )}

      {/* Sign In / Sign Out Buttons */}
      <div className="flex space-x-4 mb-6">
        {!isSignedIn && (
          <button
            onClick={() => setIsSignedIn(true)}
            className="flex-grow bg-green-600 text-white py-3 rounded hover:bg-green-700 transition-colors"
          >
            Sign In
          </button>
        )}
        {isSignedIn && (
          <button
            onClick={() => setIsSignedIn(false)}
            className="flex-grow bg-red-600 text-white py-3 rounded hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        )}
      </div>

      {/* GPS Permission Prompt */}
      <div className="mb-6">
        {gpsPermission === null && isSignedIn && (
          <button
            onClick={requestGpsPermission}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition-colors"
          >
            Allow GPS Access
          </button>
        )}
        {gpsPermission === true && (
          <p className="text-green-600 font-semibold">GPS Access Granted</p>
        )}
        {gpsPermission === false && (
          <p className="text-red-600 font-semibold">GPS Access Denied</p>
        )}
      </div>

      {/* Attendance History Table - only for students */}
      {isSignedIn && isStudent && (
        <section className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-4">My Attendance History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {sampleAttendance.map(({ date, time, status }, idx) => (
                  <tr key={idx} className="odd:bg-gray-50">
                    <td className="px-4 py-2">{date}</td>
                    <td className="px-4 py-2">{time}</td>
                    <td
                      className={`px-4 py-2 font-semibold ${
                        status === "Present"
                          ? "text-green-600"
                          : status === "Late"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {status}
                    </td>
                  </tr>
                ))}
                {sampleAttendance.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center p-4 text-gray-500">
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {/* If not a student, show a message */}
      {isSignedIn && !isStudent && (
        <div className="bg-yellow-100 text-yellow-800 rounded p-4 mt-4 text-center font-semibold">
          You are not registered as a student. Please contact your administrator if this is incorrect.
        </div>
      )}
    </div>
  );
}
