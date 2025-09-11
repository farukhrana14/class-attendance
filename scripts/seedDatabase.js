// Database Seeding Script for Class Attendance System
// Run this script to populate Firestore with realistic test data

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';

// Firebase config - update with your actual config
const firebaseConfig = {
  // Add your Firebase config here or import from environment
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Seed Data Definitions
const SEED_DATA = {
  // Admin users
  admins: [
    {
      email: "admin@university.edu",
      name: "System Administrator",
      role: "admin"
    }
  ],

  // Teachers
  teachers: [
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
      courses: ["MATH201", "MATH202"]
    },
    {
      email: "carol.white@university.edu",
      name: "Dr. Carol White", 
      role: "teacher",
      courses: ["PHYS150", "PHYS250"]
    },
    {
      email: "david.brown@university.edu",
      name: "Prof. David Brown",
      role: "teacher", 
      courses: ["ENG101"]
    },
    {
      email: "emma.davis@university.edu",
      name: "Dr. Emma Davis",
      role: "teacher",
      courses: ["CHEM110"]
    }
  ],

  // Courses
  courses: [
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
      description: "Basic programming concepts using Python",
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
      id: "math202-fall2024",
      courseCode: "MATH202",
      courseName: "Calculus II", 
      university: "State University",
      section: "A",
      semester: "Fall 2024",
      schedule: "MWF 2:00-3:00 PM",
      location: "Room 202",
      instructor: "Prof. Bob Johnson", 
      teacherName: "Prof. Bob Johnson",
      teacherEmail: "bob.johnson@university.edu",
      description: "Advanced calculus techniques",
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
    },
    {
      id: "eng101-fall2024",
      courseCode: "ENG101",
      courseName: "English Composition",
      university: "State University",
      section: "D", 
      semester: "Fall 2024",
      schedule: "MWF 1:00-2:00 PM",
      location: "Room 401",
      instructor: "Prof. David Brown",
      teacherName: "Prof. David Brown",
      teacherEmail: "david.brown@university.edu",
      description: "Academic writing and composition",
      status: "active",
      rosterUploaded: true
    }
  ],

  // Students
  students: [
    {
      email: "john.doe@student.edu",
      name: "John Doe", 
      role: "student",
      studentId: "ST2024001",
      enrolledCourses: ["CS101", "MATH201", "ENG101"]
    },
    {
      email: "jane.smith@student.edu",
      name: "Jane Smith",
      role: "student", 
      studentId: "ST2024002",
      enrolledCourses: ["CS101", "CS102", "MATH201"]
    },
    {
      email: "mike.wilson@student.edu", 
      name: "Mike Wilson",
      role: "student",
      studentId: "ST2024003",
      enrolledCourses: ["MATH201", "PHYS150", "ENG101"]
    },
    {
      email: "sarah.davis@student.edu",
      name: "Sarah Davis",
      role: "student",
      studentId: "ST2024004", 
      enrolledCourses: ["CS102", "MATH202", "PHYS150"]
    },
    {
      email: "alex.johnson@student.edu",
      name: "Alex Johnson",
      role: "student",
      studentId: "ST2024005",
      enrolledCourses: ["CS101", "MATH201", "ENG101"] 
    },
    {
      email: "emily.brown@student.edu",
      name: "Emily Brown", 
      role: "student",
      studentId: "ST2024006",
      enrolledCourses: ["CS102", "MATH202", "PHYS150"]
    },
    {
      email: "chris.taylor@student.edu",
      name: "Chris Taylor",
      role: "student",
      studentId: "ST2024007", 
      enrolledCourses: ["MATH201", "PHYS150", "ENG101"]
    },
    {
      email: "lisa.anderson@student.edu",
      name: "Lisa Anderson",
      role: "student",
      studentId: "ST2024008",
      enrolledCourses: ["CS101", "CS102", "MATH201"]
    },
    {
      email: "david.martinez@student.edu",
      name: "David Martinez", 
      role: "student", 
      studentId: "ST2024009",
      enrolledCourses: ["MATH202", "PHYS150", "ENG101"]
    },
    {
      email: "anna.garcia@student.edu",
      name: "Anna Garcia",
      role: "student",
      studentId: "ST2024010",
      enrolledCourses: ["CS101", "MATH201", "ENG101"]
    }
  ]
};

// Course-Student Enrollment Mapping
const COURSE_ENROLLMENTS = {
  "cs101-fall2024": [
    "john.doe@student.edu",
    "jane.smith@student.edu", 
    "alex.johnson@student.edu",
    "lisa.anderson@student.edu",
    "anna.garcia@student.edu"
  ],
  "cs102-fall2024": [
    "jane.smith@student.edu",
    "sarah.davis@student.edu",
    "emily.brown@student.edu", 
    "lisa.anderson@student.edu"
  ],
  "math201-fall2024": [
    "john.doe@student.edu",
    "jane.smith@student.edu",
    "mike.wilson@student.edu",
    "alex.johnson@student.edu",
    "chris.taylor@student.edu",
    "lisa.anderson@student.edu",
    "anna.garcia@student.edu"
  ],
  "math202-fall2024": [
    "sarah.davis@student.edu", 
    "emily.brown@student.edu",
    "david.martinez@student.edu"
  ],
  "phys150-fall2024": [
    "mike.wilson@student.edu",
    "sarah.davis@student.edu",
    "emily.brown@student.edu",
    "chris.taylor@student.edu", 
    "david.martinez@student.edu"
  ],
  "eng101-fall2024": [
    "john.doe@student.edu",
    "mike.wilson@student.edu",
    "alex.johnson@student.edu",
    "chris.taylor@student.edu",
    "david.martinez@student.edu",
    "anna.garcia@student.edu"
  ]
};

// Utility Functions
const getRandomStatus = () => {
  const statuses = ["present", "late", "absent"];
  const weights = [0.7, 0.2, 0.1]; // 70% present, 20% late, 10% absent
  const random = Math.random();
  if (random < weights[0]) return statuses[0];
  if (random < weights[0] + weights[1]) return statuses[1];
  return statuses[2];
};

const getDateId = (date) => {
  return date.toISOString().split('T')[0].replace(/-/g, '');
};

const encodeSafeEmail = (email) => {
  return btoa(email).replace(/[^a-zA-Z0-9]/g, '');
};

// Main Seeding Functions
const clearDatabase = async () => {
  console.log("🗑️  Clearing existing data...");
  
  const collections = ['users', 'courses', 'attendance', 'pendingStudents'];
  
  for (const collectionName of collections) {
    const snapshot = await getDocs(collection(db, collectionName));
    const batch = writeBatch(db);
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    if (snapshot.docs.length > 0) {
      await batch.commit();
      console.log(`   Deleted ${snapshot.docs.length} documents from ${collectionName}`);
    }
  }
};

const seedUsers = async () => {
  console.log("👥 Creating users...");
  
  const allUsers = [...SEED_DATA.admins, ...SEED_DATA.teachers, ...SEED_DATA.students];
  
  for (const user of allUsers) {
    await setDoc(doc(db, "users", user.email), {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  console.log(`   Created ${allUsers.length} users (${SEED_DATA.admins.length} admins, ${SEED_DATA.teachers.length} teachers, ${SEED_DATA.students.length} students)`);
};

const seedCourses = async () => {
  console.log("📚 Creating courses...");
  
  for (const course of SEED_DATA.courses) {
    await setDoc(doc(db, "courses", course.id), {
      ...course,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  console.log(`   Created ${SEED_DATA.courses.length} courses`);
};

const seedCourseEnrollments = async () => {
  console.log("📝 Creating course enrollments...");
  
  let totalEnrollments = 0;
  
  for (const [courseId, studentEmails] of Object.entries(COURSE_ENROLLMENTS)) {
    for (const studentEmail of studentEmails) {
      const student = SEED_DATA.students.find(s => s.email === studentEmail);
      if (student) {
        await setDoc(doc(db, "courses", courseId, "students", studentEmail), {
          name: student.name,
          email: studentEmail,
          studentId: student.studentId,
          section: SEED_DATA.courses.find(c => c.id === courseId)?.section || "A",
          courseId: courseId,
          addedAt: new Date(),
          status: "enrolled"
        });
        totalEnrollments++;
      }
    }
  }
  
  console.log(`   Created ${totalEnrollments} course enrollments`);
};

const seedAttendanceData = async () => {
  console.log("📊 Creating attendance records...");
  
  let totalAttendance = 0;
  
  // Generate attendance for the last 14 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 14);
  
  for (const [courseId, studentEmails] of Object.entries(COURSE_ENROLLMENTS)) {
    const course = SEED_DATA.courses.find(c => c.id === courseId);
    if (!course) continue;
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Skip weekends for most courses
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      const dateString = date.toISOString().split('T')[0];
      const dateId = getDateId(date);
      
      for (const studentEmail of studentEmails) {
        const student = SEED_DATA.students.find(s => s.email === studentEmail);
        if (!student) continue;
        
        const safeEmail = encodeSafeEmail(studentEmail);
        const attendanceDocId = `${courseId}_${dateId}_${safeEmail}`;
        
        const attendanceData = {
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
          timestamp: new Date(date.getTime() + Math.random() * 86400000), // Random time during the day
          location: {
            latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
            longitude: -74.0060 + (Math.random() - 0.5) * 0.01
          }
        };
        
        await setDoc(doc(db, "attendance", attendanceDocId), attendanceData);
        totalAttendance++;
      }
    }
  }
  
  console.log(`   Created ${totalAttendance} attendance records`);
};

const seedPendingStudents = async () => {
  console.log("⏳ Creating pending student requests...");
  
  const pendingStudents = [
    {
      name: "New Student One",
      email: "newstudent1@student.edu",
      courseCode: "CS101",
      university: "State University",
      section: "A",
      status: "pending",
      submittedAt: new Date()
    },
    {
      name: "New Student Two", 
      email: "newstudent2@student.edu",
      courseCode: "MATH201",
      university: "State University", 
      section: "A",
      status: "pending",
      submittedAt: new Date()
    }
  ];
  
  for (const pending of pendingStudents) {
    await setDoc(doc(db, "pendingStudents", pending.email), pending);
  }
  
  console.log(`   Created ${pendingStudents.length} pending student requests`);
};

// Main execution function
export const seedDatabase = async (options = {}) => {
  const { 
    clearFirst = true, 
    includeAttendance = true,
    includePendingStudents = true 
  } = options;
  
  try {
    console.log("🌱 Starting database seeding...\n");
    
    if (clearFirst) {
      await clearDatabase();
      console.log("");
    }
    
    await seedUsers();
    await seedCourses(); 
    await seedCourseEnrollments();
    
    if (includeAttendance) {
      await seedAttendanceData();
    }
    
    if (includePendingStudents) {
      await seedPendingStudents();
    }
    
    console.log("\n✅ Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - ${SEED_DATA.admins.length + SEED_DATA.teachers.length + SEED_DATA.students.length} users created`);
    console.log(`   - ${SEED_DATA.courses.length} courses created`);
    console.log(`   - ${Object.values(COURSE_ENROLLMENTS).flat().length} enrollments created`);
    if (includeAttendance) {
      console.log(`   - ~${Object.values(COURSE_ENROLLMENTS).flat().length * 14} attendance records created`);
    }
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
};

// For direct execution
if (typeof window === 'undefined') {
  // Node.js environment
  seedDatabase().catch(console.error);
}
