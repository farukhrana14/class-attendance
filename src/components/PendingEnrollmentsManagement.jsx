import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  setDoc,
  addDoc,
  serverTimestamp 
} from "firebase/firestore";

export default function PendingEnrollmentsManagement() {
  const { userData } = useAuth();
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState(new Set());

  // Fetch teacher's courses and pending enrollments
  useEffect(() => {
    if (!userData || userData.role !== 'teacher') return;

    const setupRealtimeListeners = () => {
      // First, get teacher's courses
      const coursesRef = collection(db, "courses");
  const coursesQuery = query(coursesRef, where("email", "==", userData.email), where("role", "==", "teacher"));
      
      const unsubscribeCourses = onSnapshot(coursesQuery, (snapshot) => {
        const courses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTeacherCourses(courses);
        
        // Get course codes that this teacher manages
        const courseCodes = courses.map(course => course.courseCode);
        
        if (courseCodes.length > 0) {
          // Listen to pending enrollments for teacher's courses
          const pendingRef = collection(db, "pendingEnrollments");
          const pendingQuery = query(
            pendingRef, 
            where("courseCode", "in", courseCodes),
            where("status", "==", "pending")
          );
          
          const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
            const enrollments = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setPendingEnrollments(enrollments);
            setLoading(false);
          });

          return unsubscribePending;
        } else {
          setPendingEnrollments([]);
          setLoading(false);
        }
      });

      return () => {
        unsubscribeCourses();
      };
    };

    const unsubscribe = setupRealtimeListeners();
    return unsubscribe;
  }, [userData]);

  // Approve enrollment request
  const approveEnrollment = async (request) => {
    if (processingRequests.has(request.id)) return;
    
    setProcessingRequests(prev => new Set([...prev, request.id]));
    
    try {
      // Find the matching course
      const matchingCourse = teacherCourses.find(
        course => course.courseCode === request.courseCode
      );
      
      if (!matchingCourse) {
        alert("Course not found. Cannot approve enrollment.");
        return;
      }

      // 1. Create enrollment record
      await addDoc(collection(db, "enrollments"), {
        studentEmail: request.studentEmail,
        studentName: request.studentName,
        courseId: matchingCourse.id,
        courseCode: request.courseCode,
        courseName: matchingCourse.courseName || matchingCourse.title,
  email: matchingCourse.teacherEmail,
        teacherName: matchingCourse.teacherName,
        university: request.university,
        section: request.section,
        semester: request.semester,
        year: request.year,
        status: "active",
        enrolledAt: new Date().toISOString(),
        approvedBy: userData.email
      });

      // 2. Add student to course roster (for backward compatibility)
      await setDoc(doc(db, "courses", matchingCourse.id, "students", request.studentEmail), {
        name: request.studentName,
        email: request.studentEmail,
        studentId: "", // Can be updated later
        enrolledAt: new Date().toISOString(),
        status: "active"
      });

      // 3. Update pending enrollment status
      await updateDoc(doc(db, "pendingEnrollments", request.id), {
  status: "active",
        approvedAt: new Date().toISOString(),
        approvedBy: userData.email,
        courseId: matchingCourse.id
      });

      console.log("✅ Enrollment approved successfully");
      
    } catch (error) {
      console.error("❌ Error approving enrollment:", error);
      alert("Failed to approve enrollment. Please try again.");
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  // Decline enrollment request
  const declineEnrollment = async (request) => {
    if (processingRequests.has(request.id)) return;
    
    if (!confirm(`Are you sure you want to decline ${request.studentName}'s enrollment request for ${request.courseCode}?`)) {
      return;
    }
    
    setProcessingRequests(prev => new Set([...prev, request.id]));
    
    try {
      await updateDoc(doc(db, "pendingEnrollments", request.id), {
        status: "declined",
        declinedAt: new Date().toISOString(),
        declinedBy: userData.email
      });

      console.log("✅ Enrollment declined");
      
    } catch (error) {
      console.error("❌ Error declining enrollment:", error);
      alert("Failed to decline enrollment. Please try again.");
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Enrollment Requests</h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading requests...</span>
        </div>
      </div>
    );
  }

  if (pendingEnrollments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">📋</span>
          Pending Enrollment Requests
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No pending enrollment requests</p>
          <p className="text-gray-400 mt-2">New enrollment requests will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">📋</span>
        Pending Enrollment Requests ({pendingEnrollments.length})
      </h2>
      
      <div className="space-y-4">
        {pendingEnrollments.map((request) => (
          <div 
            key={request.id}
            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900 mr-3">
                    {request.studentName}
                  </h3>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Pending
                  </span>
                  {!request.isNewStudent && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded ml-2">
                      Returning Student
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                  <p><strong>Email:</strong> {request.studentEmail}</p>
                  <p><strong>Course:</strong> {request.courseCode}</p>
                  <p><strong>University:</strong> {request.university}</p>
                  <p><strong>Section:</strong> {request.section || 'Not specified'}</p>
                  <p><strong>Semester:</strong> {request.semester} {request.year}</p>
                  {request.hasActiveEnrollments && (
                    <p className="text-blue-600"><strong>Status:</strong> Has other active courses</p>
                  )}
                </div>
                
                {request.requestedAt && (
                  <p className="text-xs text-gray-500">
                    Requested: {new Date(request.requestedAt.seconds * 1000 || request.requestedAt).toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => approveEnrollment(request)}
                  disabled={processingRequests.has(request.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    processingRequests.has(request.id)
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {processingRequests.has(request.id) ? "Processing..." : "✓ Approve"}
                </button>
                
                <button
                  onClick={() => declineEnrollment(request)}
                  disabled={processingRequests.has(request.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    processingRequests.has(request.id)
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {processingRequests.has(request.id) ? "Processing..." : "✗ Decline"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
