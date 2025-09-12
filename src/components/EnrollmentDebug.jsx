import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function EnrollmentDebug() {
  const { user, userData } = useAuth();
  const [debugData, setDebugData] = useState({
    enrollments: [],
    pendingEnrollments: [],
    oldCoursesData: []
  });

  useEffect(() => {
    if (!user) return;

    const fetchDebugData = async () => {
      try {
        // Check enrollments collection
        const enrollmentsRef = collection(db, "enrollments");
        const enrollmentsQuery = query(enrollmentsRef, where("studentEmail", "==", user.email));
        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        const enrollments = enrollmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Check pending enrollments
        const pendingRef = collection(db, "pendingEnrollments");
        const pendingQuery = query(pendingRef, where("studentEmail", "==", user.email));
        const pendingSnap = await getDocs(pendingQuery);
        const pending = pendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Check old courses collection (in case there's old data)
        const coursesRef = collection(db, "courses");
        const coursesSnap = await getDocs(coursesRef);
        const oldCoursesWithStudent = [];
        
        for (const courseDoc of coursesSnap.docs) {
          const courseData = courseDoc.data();
          // Check if student email is in the course's studentEmails array
          if (courseData.studentEmails && courseData.studentEmails.includes(user.email)) {
            oldCoursesWithStudent.push({ id: courseDoc.id, ...courseData });
          }
        }

        setDebugData({
          enrollments,
          pendingEnrollments: pending,
          oldCoursesData: oldCoursesWithStudent
        });

      } catch (error) {
        console.error('Error fetching debug data:', error);
      }
    };

    fetchDebugData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-4">🔍 Enrollment Debug Data</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-yellow-800">Enrollments Collection:</h4>
          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
            {JSON.stringify(debugData.enrollments, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-medium text-yellow-800">Pending Enrollments Collection:</h4>
          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
            {JSON.stringify(debugData.pendingEnrollments, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-medium text-yellow-800">Old Courses Data (studentEmails array):</h4>
          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
            {JSON.stringify(debugData.oldCoursesData, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-medium text-yellow-800">User Info:</h4>
          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
            Email: {user.email}
            {'\n'}UserData: {JSON.stringify(userData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
