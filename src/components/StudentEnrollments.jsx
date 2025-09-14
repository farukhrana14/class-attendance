  import React, { useState, useEffect } from "react";
  import { useAuth } from "../context/AuthContext";
  import { db } from "../firebase";
  import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
  import CourseAttendance from "./CourseAttendance";

  export default function StudentEnrollments() {
    const { user, userData } = useAuth();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!user || !userData) return;

      const enrollmentsRef = collection(db, "enrollments");
      const q = query(
        enrollmentsRef, 
        where("studentEmail", "==", user.email)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const enrollmentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Deduplicate enrollments by courseCode
        const uniqueEnrollments = enrollmentsData.reduce((acc, current) => {
          const existingIndex = acc.findIndex(enrollment => 
            enrollment.courseCode === current.courseCode && 
            enrollment.studentEmail === current.studentEmail
          );
          
          if (existingIndex === -1) {
            acc.push(current);
          } else {
            // Keep the one with the latest enrollment date
            const existing = acc[existingIndex];
            const currentDate = new Date(current.enrolledAt || 0);
            const existingDate = new Date(existing.enrolledAt || 0);
            
            if (currentDate > existingDate) {
              acc[existingIndex] = current;
            }
          }
          
          return acc;
        }, []);
        
        setEnrollments(uniqueEnrollments);
        setLoading(false);
      });

      return () => unsubscribe();
    }, [user, userData]);

    if (loading) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
            <div className="space-y-4">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      );
    }

    const activeEnrollments = enrollments.filter(enrollment => enrollment.status === 'active');
    const pendingEnrollments = enrollments.filter(enrollment => enrollment.status === 'pending');
    const completedEnrollments = enrollments.filter(enrollment => enrollment.status === 'completed');

    return (
      <div className="space-y-6">
        {/* Active Courses */}
        {activeEnrollments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              📚 Current Courses ({activeEnrollments.length})
            </h2>
            <div className="space-y-6">
              {activeEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                  <EnrollmentCard enrollment={enrollment} />
                  <CourseAttendance enrollment={enrollment} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Enrollments */}
        {pendingEnrollments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              ⏳ Pending Enrollments ({pendingEnrollments.length})
            </h2>
            <div className="space-y-4">
              {pendingEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <EnrollmentCard enrollment={enrollment} />
                  <div className="mt-2 text-sm text-yellow-700">
                    Waiting for teacher approval...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Courses */}
        {completedEnrollments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              ✅ Completed Courses ({completedEnrollments.length})
            </h2>
            <div className="space-y-4">
              {completedEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <EnrollmentCard enrollment={enrollment} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Courses Message */}
        {enrollments.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600">
              You haven't enrolled in any courses. Click "Add Course" to get started!
            </p>
          </div>
        )}
      </div>
    );
  };

  const EnrollmentCard = ({ enrollment }) => {
    const getStatusBadge = (status) => {
      const badges = {
        active: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        completed: 'bg-blue-100 text-blue-800',
        dropped: 'bg-red-100 text-red-800'
      };

      return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    };

    return (
      <div className="mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {enrollment.courseCode}
            </h3>
            <p className="text-sm text-gray-600">{enrollment.courseName || 'Course Name'}</p>
          </div>
          {getStatusBadge(enrollment.status)}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Teacher:</span>
            <span className="ml-1 text-gray-600">{enrollment.teacherName || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Section:</span>
            <span className="ml-1 text-gray-600">{enrollment.section || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Semester:</span>
            <span className="ml-1 text-gray-600">{enrollment.semester} {enrollment.year}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">University:</span>
            <span className="ml-1 text-gray-600">{enrollment.university}</span>
          </div>
        </div>

        {enrollment.enrolledAt && (
          <div className="mt-2 text-xs text-gray-500">
            Enrolled: {new Date(enrollment.enrolledAt.seconds * 1000).toLocaleDateString()}
          </div>
        )}
      </div>
    );
  };
