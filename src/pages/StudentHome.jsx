import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import StudentEnrollments from '../components/StudentEnrollments';
import AddCourseModal from '../components/AddCourseModal';
import AttendanceHistory from '../components/AttendanceHistory';

const StudentHome = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const [authStatus, setAuthStatus] = useState('checking');
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  // Check user authorization status
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!user || authLoading) return;

      try {
        // Check if user exists in users collection
        if (!userData) {
          console.log('User not found in users collection');
          setAuthStatus('unauthorized');
          return;
        }

        // Check if user has any active enrollments
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('studentEmail', '==', user.email),
          where('status', '==', 'active')
        );

        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        
        if (enrollmentsSnapshot.empty) {
          console.log('User found but no active enrollments');
          setAuthStatus('no-courses');
        } else {
          console.log('User found with active enrollments');
          setAuthStatus('authorized');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setAuthStatus('unauthorized');
      }
    };

    checkAuthStatus();
  }, [user, userData, authLoading]);

  // Set up real-time listener for enrollments when authorized
  useEffect(() => {
    if (authStatus !== 'authorized' || !user) return;

    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('studentEmail', '==', user.email)
    );

    const unsubscribe = onSnapshot(enrollmentsQuery, (snapshot) => {
      const enrollmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const uniqueEnrollments = enrollmentsData.filter((enrollment, index, self) => 
        index === self.findIndex(e => 
          e.courseId === enrollment.courseId && 
          e.section === enrollment.section &&
          e.semester === enrollment.semester &&
          e.year === enrollment.year
        )
      );
      
      setEnrollments(uniqueEnrollments);
      setLoadingEnrollments(false);
    });

    return () => unsubscribe();
  }, [authStatus, user]);

  const handleAddCourseSuccess = () => {
    setShowAddCourseModal(false);
  };

  // Show loading while checking authentication
  if (authLoading || authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Show not authorized message
  if (authStatus === 'unauthorized') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Not Authorized
          </h2>
          
          <p className="text-gray-600 mb-6">
            You are not currently registered in our system. If you believe this is a mistake, 
            please contact your teacher or instructor to be added to the course roster.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Only students who have been added by their instructors 
              can access the attendance system.
            </p>
          </div>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Show course selection interface
  if (authStatus === 'no-courses') {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome! 👋
              </h2>
              <p className="text-gray-600">
                You're registered in our system but not enrolled in any courses yet. 
                Please contact your instructor to be enrolled in courses.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show full student dashboard for authorized users with courses
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome, {userData?.name || user.displayName}! 👋
              </h1>
              <p className="text-gray-600">Good to see you today!</p>
            </div>
            <button
              onClick={() => setShowAddCourseModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <span className="mr-2">+</span>
              Add Course
            </button>
          </div>
        </div>

        {/* Student Enrollments */}
        <StudentEnrollments 
          enrollments={enrollments}
          loading={loadingEnrollments}
        />

        {/* Attendance History */}
        <AttendanceHistory />

        {/* Add Course Modal */}
        {showAddCourseModal && (
          <AddCourseModal
            onClose={() => setShowAddCourseModal(false)}
            onSuccess={handleAddCourseSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default StudentHome;