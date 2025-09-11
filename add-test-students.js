// Quick script to add test students to your course
// Paste this in browser console on any page with Firebase loaded

const addTestStudents = async () => {
  const courseId = "Cx9hpzLXGfI8mDCUjiKb"; // Your course ID
  
  const testStudents = [
    { name: "Alice Johnson", email: "alice@student.edu", studentId: "ST001" },
    { name: "Bob Smith", email: "bob@student.edu", studentId: "ST002" },
    { name: "Carol Davis", email: "carol@student.edu", studentId: "ST003" },
    { name: "David Wilson", email: "david@student.edu", studentId: "ST004" }
  ];
  
  for (const student of testStudents) {
    const studentRef = doc(db, "courses", courseId, "students", student.email);
    await setDoc(studentRef, student);
    console.log(`Added student: ${student.name}`);
  }
  
  console.log("✅ All test students added!");
  console.log("Refresh the roll call page to see them.");
};

// Run it
addTestStudents().catch(console.error);
