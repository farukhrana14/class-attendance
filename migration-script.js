// Migration Script for Multi-Course Enrollment System
// Run this in browser console to migrate existing data

const migrateToNewEnrollmentSystem = async () => {
  console.log("🔄 Starting migration to new enrollment system...");
  
  try {
    // 1. Migrate existing course/student relationships to enrollments collection
    const coursesSnap = await getDocs(collection(db, "courses"));
    const enrollmentsToCreate = [];
    
    for (const courseDoc of coursesSnap.docs) {
      const courseData = courseDoc.data();
      const studentsRef = collection(db, "courses", courseDoc.id, "students");
      const studentsSnap = await getDocs(studentsRef);
      
      for (const studentDoc of studentsSnap.docs) {
        const studentData = studentDoc.data();
        
        // Create enrollment record
        const enrollment = {
          studentEmail: studentData.email,
          studentName: studentData.name,
          courseId: courseDoc.id,
          courseCode: courseData.courseCode || courseData.code,
          courseName: courseData.courseName || courseData.title,
          teacherEmail: courseData.teacherEmail,
          teacherName: courseData.teacherName,
          university: courseData.university || "Unknown",
          section: courseData.section || "Not specified",
          semester: courseData.semester || "Not specified",
          year: courseData.year || new Date().getFullYear().toString(),
          status: "active",
          enrolledAt: studentData.enrolledAt || new Date().toISOString(),
          migratedAt: new Date().toISOString()
        };
        
        enrollmentsToCreate.push(enrollment);
      }
    }
    
    // Create enrollment records
    console.log(`📝 Creating ${enrollmentsToCreate.length} enrollment records...`);
    for (const enrollment of enrollmentsToCreate) {
      await addDoc(collection(db, "enrollments"), enrollment);
    }
    
    // 2. Migrate existing pendingStudents to pendingEnrollments
    const pendingStudentsSnap = await getDocs(collection(db, "pendingStudents"));
    const pendingEnrollmentsToCreate = [];
    
    for (const pendingDoc of pendingStudentsSnap.docs) {
      const pendingData = pendingDoc.data();
      
      const pendingEnrollment = {
        studentEmail: pendingData.email,
        studentName: pendingData.name,
        courseCode: pendingData.courseCode,
        university: pendingData.university,
        section: pendingData.section,
        semester: pendingData.semester,
        year: pendingData.year,
        status: pendingData.status || "pending",
        requestedAt: pendingData.createdAt || serverTimestamp(),
        isNewStudent: true, // Assume existing pending students are new
        hasActiveEnrollments: false, // Will be updated later
        migratedAt: new Date().toISOString()
      };
      
      pendingEnrollmentsToCreate.push(pendingEnrollment);
    }
    
    // Create pending enrollment records
    console.log(`📝 Creating ${pendingEnrollmentsToCreate.length} pending enrollment records...`);
    for (const pendingEnrollment of pendingEnrollmentsToCreate) {
      await addDoc(collection(db, "pendingEnrollments"), pendingEnrollment);
    }
    
    console.log("✅ Migration completed successfully!");
    console.log(`- Created ${enrollmentsToCreate.length} enrollment records`);
    console.log(`- Created ${pendingEnrollmentsToCreate.length} pending enrollment records`);
    console.log("📋 Next steps:");
    console.log("1. Test the new multi-course system");
    console.log("2. When confident, you can remove old collections (pendingStudents, course/students subcollections)");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
};

// Uncomment the line below to run the migration
// migrateToNewEnrollmentSystem();
