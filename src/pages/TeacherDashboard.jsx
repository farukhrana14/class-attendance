import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
// Temporarily disabled until student signup is enabled
// import PendingStudentsManagement from "../components/PendingStudentsManagement";
// import PendingEnrollmentsManagement from "../components/PendingEnrollmentsManagement";
import CourseDetails from "../components/CourseDetails";
import RosterManagement from "../components/RosterManagement";
import RollCall from "../components/RollCall";
import CourseAttendanceReport from "../components/CourseAttendanceReport";

// Enhanced sidebar items with icons
const sidebarItems = [
  { name: "Dashboard", path: "/teacher", icon: "📊" },
  { name: "Courses", path: "/teacher/courses", icon: "📚" },
  { name: "Create Course", path: "/teacher/create-course", icon: "➕" },
  { name: "Manage Students", path: "/teacher/add-students", icon: "👥" },
  // Temporarily disabled until studentside signup is enabled
  // { name: "Pending Students", path: "/teacher/pending-students", icon: "🔄" },
  // { name: "Pending Enrollments", path: "/teacher/pending-enrollments", icon: "📝" },
  { name: "Register Attendance", path: "/teacher/attendance", icon: "📅" },
  { name: "Reports", path: "/teacher/reports", icon: "📈" },
  { name: "Settings", path: "/teacher/settings", icon: "⚙️" }
];

// Route components
const CoursesList = ({ courses, loading, navigate }) => (
  <div className="p-4">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">My Courses</h2>
      <button
        onClick={() => navigate("/teacher/create-course")}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
      >
        Create New Course
      </button>
    </div>

    {loading ? (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600 text-lg">Loading your courses...</p>
      </div>
    ) : courses.length === 0 ? (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">No courses found</p>
        <p className="text-gray-400 mb-6">Create your first course to get started</p>
        <button
          onClick={() => navigate("/teacher/create-course")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Your First Course
        </button>
      </div>
    ) : (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-lg shadow p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-200"
          >
            <div onClick={() => navigate(`/teacher/courses/${course.id}`)} className="cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold">{course.courseCode}</h3>
                <span className="text-sm text-gray-500">{course.semester} {course.year}</span>
              </div>
              <p className="text-gray-700 mb-3">{course.courseName}</p>
              <div className="text-sm text-gray-600">
                <p>Section: {course.section || 'Not specified'}</p>
                <p>University: {course.university || 'Not specified'}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/teacher/courses/${course.id}/rollcall`);
                }}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
              >
                📋 Take Roll Call
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Temporarily disabled until student signup is enabled
// const PendingStudents = () => <div><PendingStudentsManagement /></div>;
// const PendingEnrollments = () => <div><PendingEnrollmentsManagement /></div>;

// Attendance page component that displays course selection for roll call
const RegisterAttendance = ({ courses }) => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Register Attendance</h1>
        <p className="mt-2 text-sm text-gray-600">Select a course to take roll call</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Select Course</h2>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => navigate(`/teacher/courses/${course.id}/rollcall`)}
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors duration-200 border-2 border-transparent hover:border-green-500"
            >
              <h3 className="text-lg font-bold text-gray-900">{course.courseCode}</h3>
              <p className="text-gray-700 mb-2">{course.courseName}</p>
              <div className="text-sm text-gray-600">
                <p>Section: {course.section || 'Not specified'}</p>
                <p>University: {course.university || 'Not specified'}</p>
                <p className="mt-2 text-green-600 font-medium">Click to take attendance →</p>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No courses found</p>
            <p className="text-gray-400 mb-6">Create a course first before taking attendance</p>
            <button
              onClick={() => navigate("/teacher/create-course")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Course
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
// Reports component that displays course selection for viewing reports
const Reports = ({ courses }) => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Attendance Reports</h1>
        <p className="mt-2 text-sm text-gray-600">Select a course to view attendance reports</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Select Course</h2>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => navigate(`/teacher/courses/${course.id}/reports`)}
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors duration-200 border-2 border-transparent hover:border-purple-500"
            >
              <h3 className="text-lg font-bold text-gray-900">{course.courseCode}</h3>
              <p className="text-gray-700 mb-2">{course.courseName}</p>
              <div className="text-sm text-gray-600">
                <p>Section: {course.section || 'Not specified'}</p>
                <p>University: {course.university || 'Not specified'}</p>
                <p className="mt-2 text-purple-600 font-medium">View attendance reports →</p>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No courses found</p>
            <p className="text-gray-400 mb-6">Create a course first to view attendance reports</p>
            <button
              onClick={() => navigate("/teacher/create-course")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Course
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
const Settings = () => <div className="p-4">Settings Page</div>;

const AddStudents = ({ courses }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const handleCourseSelect = () => {
    if (selectedCourseId) {
      navigate(`/teacher/courses/roster/${selectedCourseId}`);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Add Students to Course</h1>
        <p className="mt-2 text-sm text-gray-600">Select a course to add students to</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Select Course</h2>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => navigate(`/teacher/courses/roster/${course.id}`)}
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors duration-200 border-2 border-transparent hover:border-blue-500"
            >
              <h3 className="text-lg font-bold text-gray-900">{course.courseCode}</h3>
              <p className="text-gray-700 mb-2">{course.courseName}</p>
              <div className="text-sm text-gray-600">
                <p>Section: {course.section || 'Not specified'}</p>
                <p>University: {course.university || 'Not specified'}</p>
                <p className="mt-2 text-blue-600 font-medium">Click to add students →</p>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No courses found</p>
            <p className="text-gray-400 mb-6">Create a course first before adding students</p>
            <button
              onClick={() => navigate("/teacher/create-course")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Course
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
const CreateCourse = ({ onCourseCreated }) => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  const [formData, setFormData] = useState({
    courseCode: '',
    courseName: '',
    section: '',
    semester: '',
    year: new Date().getFullYear(),
    university: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!userData?.email) {
        throw new Error('Please log in to create a course.');
      }

      const courseRef = await addDoc(collection(db, 'courses'), {
        ...formData,
        teacherEmail: userData.email,
        teacherName: userData.name || 'Unknown Teacher',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      });

      // Refresh the courses list
      if (onCourseCreated) {
        await onCourseCreated();
      }

      navigate('/teacher/courses');
    } catch (error) {
      console.error('Error saving course:', error);
      alert(`Error saving course: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const semesters = [
    'Spring 2024',
    'Summer 2024', 
    'Fall 2024',
    'Spring 2025',
    'Summer 2025',
    'Fall 2025'
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create New Course</h1>
        <p className="mt-2 text-sm text-gray-600">Fill in the course details below</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Course Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700">
                Course Code *
              </label>
              <input
                type="text"
                id="courseCode"
                name="courseCode"
                required
                value={formData.courseCode}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
                placeholder="e.g., CSC101"
              />
            </div>

            <div>
              <label htmlFor="courseName" className="block text-sm font-medium text-gray-700">
                Course Name *
              </label>
              <input
                type="text"
                id="courseName"
                name="courseName"
                required
                value={formData.courseName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
                placeholder="e.g., Introduction to Computer Science"
              />
            </div>

            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700">
                Section
              </label>
              <input
                type="text"
                id="section"
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
                placeholder="e.g., 001, A, Morning"
              />
            </div>

            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                Semester *
              </label>
              <select
                id="semester"
                name="semester"
                required
                value={formData.semester}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
              >
                <option value="">Select a semester</option>
                {semesters.map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                Year *
              </label>
              <input
                type="number"
                id="year"
                name="year"
                required
                value={formData.year}
                onChange={handleInputChange}
                min="2024"
                max="2030"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
              />
            </div>

            <div>
              <label htmlFor="university" className="block text-sm font-medium text-gray-700">
                University *
              </label>
              <input
                type="text"
                id="university"
                name="university"
                required
                value={formData.university}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
                placeholder="e.g., State University"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/teacher/courses')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

const EditCourse = ({ onCourseUpdated }) => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { courseId } = useParams();
  
  const [formData, setFormData] = useState({
    courseCode: '',
    courseName: '',
    section: '',
    semester: '',
    year: new Date().getFullYear(),
    university: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Available semesters
  const semesters = [
    'Fall 2024',
    'Spring 2025',
    'Summer 2025',
    'Fall 2025'
  ];

  // Load existing course data
  useEffect(() => {
    const loadCourse = async () => {
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (!courseDoc.exists()) {
          throw new Error('Course not found');
        }

        const courseData = courseDoc.data();
        
        // Check if the current user is the teacher of this course
        if (courseData.teacherEmail !== userData?.email) {
          throw new Error('You are not authorized to edit this course');
        }

        setFormData({
          courseCode: courseData.courseCode || '',
          courseName: courseData.courseName || '',
          section: courseData.section || '',
          semester: courseData.semester || '',
          year: courseData.year || new Date().getFullYear(),
          university: courseData.university || ''
        });
      } catch (error) {
        console.error('Error loading course:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (courseId && userData?.email) {
      loadCourse();
    }
  }, [courseId, userData?.email]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!userData?.email) {
        throw new Error('Please log in to update the course.');
      }

      await updateDoc(doc(db, 'courses', courseId), {
        ...formData,
        updatedAt: serverTimestamp()
      });

      // Refresh the courses list if callback provided
      if (onCourseUpdated) {
        await onCourseUpdated();
      }

      navigate('/teacher/courses');
    } catch (error) {
      console.error('Error updating course:', error);
      setError('Failed to update course. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600 text-lg">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/teacher/courses')}
                  className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                >
                  Back to Courses
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Course</h1>
        <p className="mt-2 text-sm text-gray-600">Update the course details below</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Course Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700">
                Course Code *
              </label>
              <input
                type="text"
                id="courseCode"
                name="courseCode"
                required
                value={formData.courseCode}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
                placeholder="e.g., CSC101"
              />
            </div>

            <div>
              <label htmlFor="courseName" className="block text-sm font-medium text-gray-700">
                Course Name *
              </label>
              <input
                type="text"
                id="courseName"
                name="courseName"
                required
                value={formData.courseName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
                placeholder="e.g., Introduction to Computer Science"
              />
            </div>

            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700">
                Section
              </label>
              <input
                type="text"
                id="section"
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
                placeholder="e.g., 001, A, Morning"
              />
            </div>

            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                Semester *
              </label>
              <select
                id="semester"
                name="semester"
                required
                value={formData.semester}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
              >
                <option value="">Select a semester</option>
                {semesters.map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                Year *
              </label>
              <input
                type="number"
                id="year"
                name="year"
                required
                value={formData.year}
                onChange={handleInputChange}
                min="2024"
                max="2030"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
              />
            </div>

            <div>
              <label htmlFor="university" className="block text-sm font-medium text-gray-700">
                University *
              </label>
              <input
                type="text"
                id="university"
                name="university"
                required
                value={formData.university}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
                placeholder="e.g., State University"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/teacher/courses')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Updating...' : 'Update Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingStudentsCount, setPendingStudentsCount] = useState(0);
  const [pendingEnrollmentsCount, setPendingEnrollmentsCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch courses for this teacher
  const fetchCourses = async () => {
    if (!userData?.email) return;
    
    try {
      setLoading(true);
      const coursesRef = collection(db, "courses");
      const q = query(coursesRef, where("teacherEmail", "==", userData.email));
      const querySnapshot = await getDocs(q);
      
      const coursesData = [];
      querySnapshot.forEach((doc) => {
        coursesData.push({ id: doc.id, ...doc.data() });
      });
      
      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [userData]);

  // Temporarily disabled until student signup is enabled
  /*
  // Fetch pending students count with real-time updates
  useEffect(() => {
    if (!userData?.email || courses.length === 0) {
      setPendingStudentsCount(0);
      return;
    }

    const teacherCourseCodes = courses.map(course => course.courseCode);
    
    if (teacherCourseCodes.length === 0) {
      setPendingStudentsCount(0);
      return;
    }

    const pendingRef = collection(db, "pendingStudents");
    const q = query(
      pendingRef,
      where("courseCode", "in", teacherCourseCodes),
      where("status", "==", "pending")
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setPendingStudentsCount(querySnapshot.size);
    }, (error) => {
      console.error("Error fetching pending students count:", error);
    });

    return () => unsubscribe();
  }, [userData, courses]);

  // Fetch pending enrollments count with real-time updates
  useEffect(() => {
    if (!userData?.email || courses.length === 0) {
      setPendingEnrollmentsCount(0);
      return;
    }

    const teacherCourseCodes = courses.map(course => course.courseCode);
    
    if (teacherCourseCodes.length === 0) {
      setPendingEnrollmentsCount(0);
      return;
    }

    const pendingRef = collection(db, "pendingEnrollments");
    const q = query(
      pendingRef,
      where("courseCode", "in", teacherCourseCodes),
      where("status", "==", "pending")
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setPendingEnrollmentsCount(querySnapshot.size);
    }, (error) => {
      console.error("Error fetching pending enrollments count:", error);
    });

    return () => unsubscribe();
  }, [userData, courses]);
  */
  
  // Set counts to 0 until student signup is enabled
  useEffect(() => {
    setPendingStudentsCount(0);
    setPendingEnrollmentsCount(0);
  }, []);

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Dashboard content - summary stats and recent activity
  const DashboardContent = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {userData?.name}</h2>
        <p className="text-gray-600">Here's what's happening in your courses</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-blue-600 text-lg font-semibold mb-2">Total Courses</div>
          <div className="text-3xl font-bold">{courses.length}</div>
        </div>
        
        {/* Pending Enrollments card removed until student signup is enabled */}
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-green-600 text-lg font-semibold mb-2">Today's Attendance</div>
          <div className="text-3xl font-bold">--</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold">Recent Courses</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {courses.length > 0 ? (
            courses.slice(0, 3).map(course => (
              <div key={course.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">{course.courseCode}</div>
                    <div className="text-sm text-gray-600">{course.courseName}</div>
                  </div>
                  <button 
                    onClick={() => navigate(`/teacher/courses/${course.id}`)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">No courses yet</div>
          )}
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button 
            onClick={() => navigate("/teacher/courses")}
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            View all courses
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between bg-white px-4 py-3 shadow-md w-full">
        <div className="text-xl font-bold">Teacher Dashboard</div>
        <button
          onClick={toggleMobileMenu}
          className="text-gray-700 focus:outline-none"
          aria-label="Toggle Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" 
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`bg-white shadow w-full md:w-64 md:flex flex-col md:sticky md:top-0 md:h-screen ${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800 hidden md:block">Teacher Dashboard</h1>
          <div className="mt-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl">
                {userData?.name?.charAt(0) || 'T'}
              </div>
              <div className="ml-3">
                <div className="font-medium">{userData?.name}</div>
                <div className="text-sm text-gray-600">{userData?.email}</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="mt-4 w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
        
        <nav className="py-4 flex-1 overflow-y-auto">
          <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main
          </div>
          {sidebarItems.map((item) => (
            <NavLink
              end={item.path === "/teacher"}
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-gray-700 ${
                  isActive 
                    ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600" 
                    : "hover:bg-gray-50"
                }`
              }
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
              {item.name === "Pending Students" && pendingStudentsCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                  {pendingStudentsCount}
                </span>
              )}
              {item.name === "Pending Enrollments" && pendingEnrollmentsCount > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                  {pendingEnrollmentsCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <Routes>
          <Route path="/" element={<DashboardContent />} />
          <Route path="/courses" element={<CoursesList courses={courses} loading={loading} navigate={navigate} />} />
          <Route path="/courses/roster/:courseId" element={<RosterManagement />} />
          <Route path="/courses/:courseId" element={<CourseDetails />} />
          <Route path="/courses/:courseId/*" element={<CourseDetails />} />
          <Route path="/courses/edit/:courseId" element={<EditCourse onCourseUpdated={fetchCourses} />} />
          <Route path="/create-course" element={<CreateCourse onCourseCreated={fetchCourses} />} />
          <Route path="/add-students" element={<AddStudents courses={courses} />} />
          {/* Routes temporarily disabled until student signup is enabled */}
          {/* <Route path="/pending-students" element={<PendingStudents />} /> */}
          {/* <Route path="/pending-enrollments" element={<PendingEnrollments />} /> */}
          <Route path="/attendance" element={<RegisterAttendance courses={courses} />} />
          <Route path="/courses/:courseId/rollcall" element={<RollCall />} />
          <Route path="/reports" element={<Reports courses={courses} />} />
          <Route path="/courses/:courseId/reports" element={<CourseAttendanceReport />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}