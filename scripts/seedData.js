// Browser-based Database Seeding
// Run this in your browser console when your app is loaded

const seedTestData = async () => {
  // Check if Firebase is available
  if (!window.db) {
    console.error("❌ Firebase not available. Make sure you're on a page with Firebase loaded.");
    return;
  }

  const { db } = window;
  const { collection, doc, setDoc, writeBatch, getDocs } = window;

  console.log("🌱 Starting test data creation...");

  try {
    // 1. Create Admin User
    await setDoc(doc(db, "users", "admin@university.edu"), {
      name: "System Administrator",
      email: "admin@university.edu", 
      role: "admin",
      createdAt: new Date()
    });

    // 2. Create Teachers
    const teachers = [
      {
        email: "alice.smith@university.edu",
        name: "Dr. Alice Smith", 
        role: "teacher",
        courses: ["CS101", "CS102"]
      },
      {
        email: "bob.johnson@university.edu",
        name: "Prof. Bob Johnson",
        role: "teacher", 
        courses: ["MATH201"]
      },
      {
        email: "carol.white@university.edu", 
        name: "Dr. Carol White",
        role: "teacher",
        courses: ["PHYS150"]
      }
    ];

    for (const teacher of teachers) {
      await setDoc(doc(db, "users", teacher.email), {
        ...teacher,
        createdAt: new Date()
      });
    }

    // 3. Create Students
    const students = [
      { email: "john.doe@student.edu", name: "John Doe", studentId: "ST001" },
      { email: "jane.smith@student.edu", name: "Jane Smith", studentId: "ST002" },
      { email: "mike.wilson@student.edu", name: "Mike Wilson", studentId: "ST003" },
      { email: "sarah.davis@student.edu", name: "Sarah Davis", studentId: "ST004" },
      { email: "alex.johnson@student.edu", name: "Alex Johnson", studentId: "ST005" },
      { email: "emily.brown@student.edu", name: "Emily Brown", studentId: "ST006" },
      { email: "chris.taylor@student.edu", name: "Chris Taylor", studentId: "ST007" },
      { email: "lisa.anderson@student.edu", name: "Lisa Anderson", studentId: "ST008" }
    ];

    for (const student of students) {
      await setDoc(doc(db, "users", student.email), {
        ...student,
        role: "student",
        enrolledCourses: [],
        createdAt: new Date()
      });
    }

    // 4. Create Courses
    const courses = [
      {
        id: "cs101-fall2024",
        courseCode: "CS101",
        courseName: "Introduction to Computer Science",
        university: "State University",
        section: "A",
        semester: "Fall 2024", 
        schedule: "MWF 9:00-10:00 AM",
        location: "Room 101",
        instructor: "Dr. Alice Smith",
        teacherName: "Dr. Alice Smith",
        teacherEmail: "alice.smith@university.edu",
        description: "Basic programming concepts",
        status: "active",
        rosterUploaded: true
      },
      {
        id: "cs102-fall2024",
        courseCode: "CS102", 
        courseName: "Data Structures",
        university: "State University",
        section: "B",
        semester: "Fall 2024",
        schedule: "TTh 11:00-12:30 PM", 
        location: "Room 102",
        instructor: "Dr. Alice Smith",
        teacherName: "Dr. Alice Smith",
        teacherEmail: "alice.smith@university.edu",
        description: "Advanced programming with data structures",
        status: "active",
        rosterUploaded: true
      },
      {
        id: "math201-fall2024",
        courseCode: "MATH201",
        courseName: "Calculus I", 
        university: "State University",
        section: "A",
        semester: "Fall 2024",
        schedule: "MWF 10:00-11:00 AM",
        location: "Room 201",
        instructor: "Prof. Bob Johnson",
        teacherName: "Prof. Bob Johnson",
        teacherEmail: "bob.johnson@university.edu",
        description: "Differential and integral calculus",
        status: "active",
        rosterUploaded: true
      },
      {
        id: "phys150-fall2024", 
        courseCode: "PHYS150",
        courseName: "Physics I",
        university: "State University",
        section: "C",
        semester: "Fall 2024",
        schedule: "TTh 9:00-10:30 AM",
        location: "Room 301", 
        instructor: "Dr. Carol White",
        teacherName: "Dr. Carol White",
        teacherEmail: "carol.white@university.edu",
        description: "Mechanics and thermodynamics",
        status: "active",
        rosterUploaded: true
      }
    ];

    for (const course of courses) {
      await setDoc(doc(db, "courses", course.id), {
        ...course,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // 5. Create Course Enrollments
    const enrollments = {
      "cs101-fall2024": ["john.doe@student.edu", "jane.smith@student.edu", "alex.johnson@student.edu", "lisa.anderson@student.edu"],
      "cs102-fall2024": ["jane.smith@student.edu", "sarah.davis@student.edu", "emily.brown@student.edu"],
      "math201-fall2024": ["john.doe@student.edu", "mike.wilson@student.edu", "alex.johnson@student.edu", "chris.taylor@student.edu"],
      "phys150-fall2024": ["mike.wilson@student.edu", "sarah.davis@student.edu", "emily.brown@student.edu", "chris.taylor@student.edu"]
    };

    for (const [courseId, studentEmails] of Object.entries(enrollments)) {
      const course = courses.find(c => c.id === courseId);
      for (const studentEmail of studentEmails) {
        const student = students.find(s => s.email === studentEmail);
        if (student && course) {
          await setDoc(doc(db, "courses", courseId, "students", studentEmail), {
            name: student.name,
            email: studentEmail,
            studentId: student.studentId,
            section: course.section,
            courseId: courseId,
            addedAt: new Date(),
            status: "enrolled"
          });
        }
      }
    }

    // 6. Create Sample Attendance Records (last 7 days)
    const getRandomStatus = () => {
      const rand = Math.random();
      if (rand < 0.7) return "present";
      if (rand < 0.9) return "late"; 
      return "absent";
    };

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const dateString = date.toISOString().split('T')[0];
      const dateId = dateString.replace(/-/g, '');

      for (const [courseId, studentEmails] of Object.entries(enrollments)) {
        const course = courses.find(c => c.id === courseId);
        
        for (const studentEmail of studentEmails) {
          const student = students.find(s => s.email === studentEmail);
          
          if (student && course) {
            const safeEmail = btoa(studentEmail).replace(/[^a-zA-Z0-9]/g, '');
            const attendanceDocId = `${courseId}_${dateId}_${safeEmail}`;
            
            await setDoc(doc(db, "attendance", attendanceDocId), {
              studentEmail: studentEmail,
              studentName: student.name,
              studentId: student.studentId,
              section: course.section,
              courseId: courseId,
              courseCode: course.courseCode,
              courseName: course.courseName,
              university: course.university,
              date: dateString,
              dateId: dateId,
              status: getRandomStatus(),
              mode: Math.random() > 0.5 ? "rollcall" : "checkin",
              teacherEmail: course.teacherEmail,
              teacherName: course.teacherName,
              timestamp: new Date(date.getTime() + Math.random() * 8 * 60 * 60 * 1000), // Random time during school hours
              location: {
                latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
                longitude: -74.0060 + (Math.random() - 0.5) * 0.01
              }
            });
          }
        }
      }
    }

    // 7. Create Pending Students
    await setDoc(doc(db, "pendingStudents", "pending1"), {
      name: "New Student",
      email: "newstudent@student.edu", 
      courseCode: "CS101",
      university: "State University",
      section: "A",
      status: "pending",
      submittedAt: new Date()
    });

    console.log("✅ Test data created successfully!");
    console.log("📊 Created:");
    console.log(`   - 1 admin, ${teachers.length} teachers, ${students.length} students`);
    console.log(`   - ${courses.length} courses`);
    console.log(`   - ${Object.values(enrollments).flat().length} enrollments`);
    console.log("   - ~30-40 attendance records");
    console.log("   - 1 pending student request");
    
    console.log("\n🎯 Test Accounts:");
    console.log("Admin: admin@university.edu");
    console.log("Teachers: alice.smith@university.edu, bob.johnson@university.edu, carol.white@university.edu");
    console.log("Students: john.doe@student.edu, jane.smith@student.edu, etc.");

  } catch (error) {
    console.error("❌ Error creating test data:", error);
  }
};

// Auto-run if Firebase is available
if (typeof window !== 'undefined' && window.db) {
  console.log("🔥 Firebase detected! Run seedTestData() to populate database with test data.");
} else {
  console.log("⚠️ Firebase not detected. Load this script on a page with Firebase initialized.");
}

// Make function globally available
if (typeof window !== 'undefined') {
  window.seedTestData = seedTestData;
}
