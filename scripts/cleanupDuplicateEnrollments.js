import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";

// Firebase config (same as your main app)
const firebaseConfig = {
  apiKey: "AIzaSyAVY4OMGo4LQZaE3SKaEzJ2CRy7_W6OKiU",
  authDomain: "classattend-f65c6.firebaseapp.com",
  projectId: "classattend-f65c6",
  storageBucket: "classattend-f65c6.firebasestorage.app",
  messagingSenderId: "1043831377934",
  appId: "1:1043831377934:web:2fa0f8f5c41c38f6b81f4b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupDuplicateEnrollments() {
  console.log("🧹 Starting duplicate enrollment cleanup...");
  
  try {
    // Get all enrollments
    const enrollmentsRef = collection(db, "enrollments");
    const enrollmentsSnap = await getDocs(enrollmentsRef);
    
    // Group enrollments by student email and course code
    const enrollmentMap = new Map();
    const duplicates = [];
    
    enrollmentsSnap.docs.forEach(doc => {
      const data = doc.data();
      const key = `${data.studentEmail}_${data.courseCode}`;
      
      if (enrollmentMap.has(key)) {
        // This is a duplicate - mark for deletion
        duplicates.push({
          id: doc.id,
          studentEmail: data.studentEmail,
          courseCode: data.courseCode,
          enrolledAt: data.enrolledAt
        });
      } else {
        // First occurrence - keep this one
        enrollmentMap.set(key, {
          id: doc.id,
          ...data
        });
      }
    });
    
    console.log(`Found ${duplicates.length} duplicate enrollment records`);
    
    if (duplicates.length > 0) {
      console.log("Duplicates to be deleted:");
      duplicates.forEach(dup => {
        console.log(`- ${dup.studentEmail} in ${dup.courseCode} (ID: ${dup.id})`);
      });
      
      // Delete duplicates
      for (const duplicate of duplicates) {
        await deleteDoc(doc(db, "enrollments", duplicate.id));
        console.log(`✅ Deleted duplicate enrollment: ${duplicate.studentEmail} - ${duplicate.courseCode}`);
      }
      
      console.log(`🎉 Cleanup complete! Removed ${duplicates.length} duplicate enrollments`);
    } else {
      console.log("✅ No duplicate enrollments found");
    }
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  }
}

// Run the cleanup
cleanupDuplicateEnrollments();
