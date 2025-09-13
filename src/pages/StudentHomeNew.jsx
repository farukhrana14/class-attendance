import React, { useState } from "react";

const sampleStudent = {
  name: "John Doe",
  studentId: "S12345678",
  email: "john.doe@example.edu",
  university: "XYZ University",
  semester: "Fall 2024",
  section: "A",
  avatarUrl: "", // placeholder - you can replace with real image URL
};

const enrolledCourses = [
  {
    id: 1,
    code: "CSE101",
    title: "Introduction to Computer Science",
    instructor: "Prof. Smith",
    section: "A",
    semester: "Fall 2024",
  },
  {
    id: 2,
    code: "MATH201",
    title: "Calculus II",
    instructor: "Dr. Johnson",
    section: "B",
    semester: "Fall 2024",
  },
];

export default function StudentHome() {
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [checkinCourse, setCheckinCourse] = useState(null);
  const [gpsPermission, setGpsPermission] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

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

  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setGpsPermission(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setGpsPermission(true),
      () => setGpsPermission(false)
    );
  };

  const submitCheckin = () => {
    if (!gpsPermission) {
      alert("Please allow location access to check in.");
      return;
    }
    // Simulate attendance save...
    setConfirmation(
      `Attendance marked successfully for ${checkinCourse.code} on ${new Date().toLocaleDateString()}`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between bg-white p-4 shadow sticky top-0 z-10">
        <div className="text-xl font-bold text-blue-600">ClassAttend</div>
        <button
          aria-label="Profile"
          onClick={() => alert("Navigate to profile page")}
          className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
        >
          {sampleStudent.name.charAt(0)}
        </button>
      </header>

      {/* Profile Info Card */}
      <section className="bg-white p-4 m-4 rounded-lg shadow space-y-2">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600">
            {sampleStudent.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{sampleStudent.name}</h2>
            <p className="text-gray-600 text-sm">{sampleStudent.studentId}</p>
            <p className="text-gray-600 text-sm">{sampleStudent.email}</p>
            <p className="text-gray-600 text-sm">{sampleStudent.university}</p>
            <p className="text-gray-600 text-sm">
              Semester: {sampleStudent.semester}, Section: {sampleStudent.section}
            </p>
          </div>
        </div>
      </section>

      {/* Enrolled Courses Grid */}
      <section className="flex-grow p-4 space-y-4 overflow-auto">
        <h3 className="text-lg font-semibold mb-2">Enrolled Courses</h3>
        <div className="grid grid-cols-1 gap-4">
          {enrolledCourses.map((course) => (
            <button
              key={course.id}
              onClick={() => openCheckin(course)}
              className="bg-white p-4 rounded-lg shadow text-left hover:shadow-md transition"
              aria-label={`Check in for ${course.code} - ${course.title}`}
            >
              <div className="flex justify-between font-semibold text-blue-600 mb-1">
                <span>{course.code}</span>
                <span>{course.semester}</span>
              </div>
              <div className="text-gray-800 font-medium mb-1">{course.title}</div>
              <div className="text-gray-600 text-sm">Instructor: {course.instructor}</div>
              <div className="text-gray-600 text-sm">Section: {course.section}</div>
            </button>
          ))}
        </div>
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
          aria-label="Courses"
          onClick={() => alert("Navigate to Courses")}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 12v9m-4-9v9m8-9v9m-4-9v9M2 7h20" />
          </svg>
          Courses
        </button>
        <button
          className="p-3 flex flex-col items-center text-gray-400 cursor-not-allowed"
          aria-label="Attendance History (Disabled)"
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
            <path d="M8 7v6l4 2" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          Attendance
        </button>
        <button
          className="p-3 flex flex-col items-center hover:text-blue-600"
          aria-label="Profile"
          onClick={() => alert("Navigate to Profile")}
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

      {/* Check-in Modal */}
      {isCheckinOpen && checkinCourse && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <h2 id="modal-title" className="text-xl font-semibold mb-4">
              Check-in for {checkinCourse.code} - {checkinCourse.title}
            </h2>

            <div className="space-y-2 mb-4">
              <p>
                <strong>Course Code:</strong> {checkinCourse.code}
              </p>
              <p>
                <strong>Course Title:</strong> {checkinCourse.title}
              </p>
              <p>
                <strong>Teacher's Name:</strong> {checkinCourse.instructor}
              </p>
              <p>
                <strong>Student Name:</strong> {sampleStudent.name}
              </p>
              <p>
                <strong>Student ID:</strong> {sampleStudent.studentId}
              </p>
              <p>
                <strong>Section & Semester:</strong> {checkinCourse.section} - {checkinCourse.semester}
              </p>
              <p>
                <strong>Date:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>

            <div
              onClick={requestLocation}
              className="flex items-center space-x-2 mb-4 cursor-pointer text-blue-600"
              role="button"
              tabIndex={0}
              aria-label="Request location access"
              onKeyPress={(e) => {
                if (e.key === "Enter") requestLocation();
              }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2v2m6.364 1.636l-1.414 1.414M20 12h-2m-1.636 6.364l-1.414-1.414M12 20v-2m-6.364-1.636l1.414-1.414M4 12h2m1.636-6.364l1.414 1.414" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>We need your location to confirm you are in class.</span>
            </div>

            {gpsPermission === false && (
              <p className="text-red-600 mb-4">Location permission denied.</p>
            )}

            <button
              onClick={submitCheckin}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition"
            >
              Submit
            </button>

            {confirmation && (
              <div className="mt-4 flex items-center space-x-2 text-green-600 font-semibold">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{confirmation}</span>
              </div>
            )}

            <button
              onClick={closeCheckin}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}