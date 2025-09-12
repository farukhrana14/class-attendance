import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";

export default function PendingStudentsManagement() {
  const { userData } = useAuth();
  const [pendingStudents, setPendingStudents] = useState([]);
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingStudents, setProcessingStudents] = useState(new Set());

  // Fetch teacher's courses
  useEffect(() => {
    const fetchTeacherCourses = async () => {
      if (!userData?.email) return;
      
      try {
        const coursesRef = collection(db, "courses");
        const q = query(coursesRef, where("teacherEmail", "==", userData.email));
        const querySnapshot = await getDocs(q);
        
        const courses = [];
        querySnapshot.forEach((doc) => {
          courses.push({ id: doc.id, ...doc.data() });
        });
        
        setTeacherCourses(courses);
      } catch (error) {
        console.error("Error fetching teacher courses:", error);
      }
    };

    fetchTeacherCourses();
  }, [userData]);

  // Fetch pending students for teacher's courses with real-time updates
  useEffect(() => {
    if (teacherCourses.length === 0) {
      setLoading(false);
      return;
    }

    // Get course codes that this teacher manages
    const teacherCourseCodes = teacherCourses.map(course => course.courseCode);
    
    if (teacherCourseCodes.length === 0) {
      setPendingStudents([]);
      setLoading(false);
      return;
    }

    // Set up real-time listener for pending students
    const pendingRef = collection(db, "pendingStudents");
    const q = query(
      pendingRef,
      where("courseCode", "in", teacherCourseCodes),
      where("status", "==", "pending")
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const pending = [];
      querySnapshot.forEach((doc) => {
        pending.push({ id: doc.id, ...doc.data() });
      });
      
      setPendingStudents(pending);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching pending students:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teacherCourses]);

  // Approve student - move to users collection and add to course roster
  const approveStudent = async (student) => {
    if (processingStudents.has(student.id)) return;
    
    setProcessingStudents(prev => new Set([...prev, student.id]));
    
    try {
      // Find the matching course
      const matchingCourse = teacherCourses.find(
        course => course.courseCode === student.courseCode
      );
      
      if (!matchingCourse) {
        alert("Course not found. Cannot approve student.");
        return;
      }

      // 1. Create user document
      await setDoc(doc(db, "users", student.email), {
        name: student.name,
        email: student.email,
        role: "student",
        university: student.university,
        section: student.section,
        semester: student.semester,
        year: student.year,
        approvedAt: new Date().toISOString(),
        approvedBy: userData.email
      });

      // 2. Add student to course roster
      await setDoc(doc(db, "courses", matchingCourse.id, "students", student.email), {
        name: student.name,
        email: student.email,
        studentId: student.studentId || "", // Handle if studentId exists
        enrolledAt: new Date().toISOString(),
        status: "active"
      });

      // 3. Update pending student status
      await updateDoc(doc(db, "pendingStudents", student.id), {
        status: "approved",
        approvedAt: new Date().toISOString(),
        approvedBy: userData.email,
        courseId: matchingCourse.id
      });

      console.log(`✅ Student ${student.name} approved for course ${student.courseCode}`);
      
    } catch (error) {
      console.error("Error approving student:", error);
      alert("Failed to approve student. Please try again.");
    } finally {
      setProcessingStudents(prev => {
        const newSet = new Set(prev);
        newSet.delete(student.id);
        return newSet;
      });
    }
  };

  // Decline student - update status to declined
  const declineStudent = async (student) => {
    if (processingStudents.has(student.id)) return;
    
    const reason = window.prompt("Please provide a reason for declining (optional):");
    if (reason === null) return; // User cancelled
    
    setProcessingStudents(prev => new Set([...prev, student.id]));
    
    try {
      await updateDoc(doc(db, "pendingStudents", student.id), {
        status: "declined",
        declinedAt: new Date().toISOString(),
        declinedBy: userData.email,
        declineReason: reason || "No reason provided"
      });

      console.log(`❌ Student ${student.name} declined for course ${student.courseCode}`);
      
    } catch (error) {
      console.error("Error declining student:", error);
      alert("Failed to decline student. Please try again.");
    } finally {
      setProcessingStudents(prev => {
        const newSet = new Set(prev);
        newSet.delete(student.id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Student Requests</h2>
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-600">Loading pending requests...</p>
        </div>
      </div>
    );
  }

  if (pendingStudents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">📋</span>
          Pending Student Requests
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No pending student requests</p>
          <p className="text-gray-400 mt-2">New registration requests will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">📋</span>
        Pending Student Requests ({pendingStudents.length})
      </h2>
      
      <div className="space-y-4">
        {pendingStudents.map((student) => (
          <div 
            key={student.id}
            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900 mr-3">
                    {student.name}
                  </h3>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Pending
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                  <p><strong>Email:</strong> {student.email}</p>
                  <p><strong>Course:</strong> {student.courseCode}</p>
                  <p><strong>University:</strong> {student.university}</p>
                  <p><strong>Section:</strong> {student.section}</p>
                  <p><strong>Semester:</strong> {student.semester}</p>
                  <p><strong>Year:</strong> {student.year}</p>
                </div>
                
                {student.createdAt && (
                  <p className="text-xs text-gray-500">
                    Requested: {new Date(student.createdAt.seconds * 1000 || student.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => approveStudent(student)}
                  disabled={processingStudents.has(student.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    processingStudents.has(student.id)
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {processingStudents.has(student.id) ? "Processing..." : "✓ Approve"}
                </button>
                
                <button
                  onClick={() => declineStudent(student)}
                  disabled={processingStudents.has(student.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    processingStudents.has(student.id)
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {processingStudents.has(student.id) ? "Processing..." : "✗ Decline"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
