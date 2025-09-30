import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";
import AccessDeniedModal from "../components/modals/AccessDeniedModal";

function HeroBanner() {
  return (
    <div className="flex flex-col items-center mt-8 mb-6">
      <img
        src="/classAttendLogo.png"
        alt="ClassAttend Logo"
        className="w-32 h-32 md:w-48 md:h-48 object-contain"
      />
      <h1 className="text-3xl md:text-4xl font-bold mt-4 text-center">
        Welcome to ClassAttend
      </h1>
      <p className="text-lg text-gray-600 mt-2 text-center max-w-xs">
        The easiest way to manage class attendance for teachers and students.
      </p>
    </div>
  );
}

function ErrorAlert({ message, onDismiss }) {
  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-center">
      <p className="text-red-600 text-base font-semibold">{message}</p>
      {onDismiss && (
        <button
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

function UserCard({ userData, logout }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-8 text-center">
      <p className="text-xl font-semibold text-gray-800">
        Logged in as: {userData?.name}
      </p>
      <p className="text-gray-600">Role: {userData?.role || "Unknown"}</p>
      <button
        onClick={logout}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
      >
        Logout
      </button>
    </div>
  );
}

function DashboardLinks({ role }) {
  if (role === "student") {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Link
          to="/student"
          className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Student Dashboard
          </h2>
          <p className="text-gray-600">
            View your courses, attendance, and profile.
          </p>
        </Link>
      </div>
    );
  }
  if (role === "teacher") {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Link
          to="/teacher"
          className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Teacher Dashboard
          </h2>
          <p className="text-gray-600">
            Manage your courses, attendance, and reports.
          </p>
        </Link>
        <Link
          to="/teacher/create-course"
          className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Create a Course
          </h2>
          <p className="text-gray-600">
            Start a new course and enroll students.
          </p>
        </Link>
        <Link
          to="/teacher/add-students"
          className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Add Students
          </h2>
          <p className="text-gray-600">Enroll students in your courses.</p>
        </Link>
      </div>
    );
  }
  return null;
}

export default function Home() {
  const {
    user,
    userData,
    login,
    logout,
    checking,
    showAccessRestricted,
    setShowAccessRestricted,
  } = useAuth();

  // Debug: log userData to console
  console.log("Home.jsx userData:", userData);

  if (checking) return <p>Loading...</p>;

  // Modal state for access denied
  const showModal = showAccessRestricted;
  const isLoggedInButNotAuthorized = user && !userData && showAccessRestricted;

  // Handlers for modal actions
  const handleModalClose = () => setShowAccessRestricted(false);
  const handleModalAction = () => {
    if (isLoggedInButNotAuthorized) {
      logout();
    } else {
      setShowAccessRestricted(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <HeroBanner />
        <AccessDeniedModal
          open={showModal}
          message="Access restricted: Your account was not found as a student. Please contact your administrator."
          onClose={handleModalClose}
          actionLabel={isLoggedInButNotAuthorized ? "Logout" : "Dismiss"}
          onAction={handleModalAction}
        />
        {!user && (
          <div className="flex flex-col items-center">
            <button
              onClick={() => login("student")}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors text-lg mt-2"
            >
              Sign in with Google
            </button>
          </div>
        )}
        {user && userData && (
          <>
            <UserCard userData={userData} logout={logout} />
            <DashboardLinks role={userData?.role} />
          </>
        )}
      </div>
    </div>
  );
}
