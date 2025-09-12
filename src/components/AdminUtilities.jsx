import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function AdminUtilities() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');

  const cleanupDuplicateEnrollments = async () => {
    setIsProcessing(true);
    setResult('Starting cleanup...');

    try {
      // Get all enrollments
      const enrollmentsRef = collection(db, "enrollments");
      const enrollmentsSnap = await getDocs(enrollmentsRef);
      
      // Group enrollments by student email and course code
      const enrollmentMap = new Map();
      const duplicates = [];
      
      enrollmentsSnap.docs.forEach(docSnapshot => {
        const data = docSnapshot.data();
        const key = `${data.studentEmail}_${data.courseCode}`;
        
        if (enrollmentMap.has(key)) {
          // This is a duplicate - mark for deletion
          duplicates.push({
            id: docSnapshot.id,
            studentEmail: data.studentEmail,
            courseCode: data.courseCode,
            enrolledAt: data.enrolledAt
          });
        } else {
          // First occurrence - keep this one
          enrollmentMap.set(key, {
            id: docSnapshot.id,
            ...data
          });
        }
      });
      
      setResult(prev => prev + `\nFound ${duplicates.length} duplicate enrollment records`);
      
      if (duplicates.length > 0) {
        // Delete duplicates
        for (const duplicate of duplicates) {
          await deleteDoc(doc(db, "enrollments", duplicate.id));
          setResult(prev => prev + `\n✅ Deleted duplicate: ${duplicate.studentEmail} - ${duplicate.courseCode}`);
        }
        
        setResult(prev => prev + `\n🎉 Cleanup complete! Removed ${duplicates.length} duplicates`);
      } else {
        setResult(prev => prev + `\n✅ No duplicate enrollments found`);
      }
      
    } catch (error) {
      console.error("Error during cleanup:", error);
      setResult(prev => prev + `\n❌ Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-red-800 mb-4">🔧 Admin Utilities</h3>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={cleanupDuplicateEnrollments}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg text-white font-medium ${
              isProcessing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Clean Up Duplicate Enrollments'}
          </button>
          <p className="text-sm text-red-600 mt-1">
            This will remove duplicate enrollment records for the same student-course combination
          </p>
        </div>

        {result && (
          <div className="bg-white p-3 rounded border">
            <h4 className="font-medium text-gray-800 mb-2">Results:</h4>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
