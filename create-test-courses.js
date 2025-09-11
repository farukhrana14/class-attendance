// Test script to create sample courses in Firestore
// Run this in browser console on any page with Firebase initialized

const createTestCourses = async () => {
  const { db } = window; // Assuming Firebase is globally available
  const { collection, doc, setDoc } = window; // Firestore functions
  
  const courses = [
    {
      id: "cs101-fall2024",
      courseCode: "CS101",
      courseName: "Introduction to Computer Science", 
      university: "State University",
      section: "A",
      semester: "Fall 2024",
      teacherName: "Dr. Alice Smith",
      teacherEmail: "alice@university.edu",
      createdAt: new Date(),
      rosterUploaded: true
    },
    {
      id: "math202-spring2024", 
      courseCode: "MATH202",
      courseName: "Advanced Mathematics",
      university: "State University", 
      section: "B",
      semester: "Spring 2024",
      teacherName: "Dr. Bob Lee",
      teacherEmail: "bob@university.edu", 
      createdAt: new Date(),
      rosterUploaded: true
    },
    {
      id: "phys150-fall2024",
      courseCode: "PHYS150", 
      courseName: "Physics Basics",
      university: "State University",
      section: "C", 
      semester: "Fall 2024",
      teacherName: "Dr. Carol White",
      teacherEmail: "carol@university.edu",
      createdAt: new Date(), 
      rosterUploaded: true
    }
  ];
  
  // Create courses
  for (const course of courses) {
    await setDoc(doc(db, "courses", course.id), course);
    console.log(`Created course: ${course.courseCode}`);
    
    // Add sample students to each course
    const students = [
      { name: "John Doe", email: "john@student.edu", studentId: "2024001" },
      { name: "Jane Smith", email: "jane@student.edu", studentId: "2024002" },
      { name: "Mike Johnson", email: "mike@student.edu", studentId: "2024003" }
    ];
    
    for (const student of students) {
      await setDoc(doc(db, "courses", course.id, "students", student.email), student);
    }
    console.log(`Added ${students.length} students to ${course.courseCode}`);
  }
  
  console.log("✅ All test courses created!");
};

// Run the function
createTestCourses().catch(console.error);
