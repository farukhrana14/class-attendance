import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';

export default function DatabaseSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingStatus, setSeedingStatus] = useState('');
  const [stats, setStats] = useState(null);

  const clearDatabase = async () => {
    setSeedingStatus('Clearing existing data...');
    
    const collections = ['users', 'courses', 'attendance', 'pendingStudents'];
    
    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db, collectionName));
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      if (snapshot.docs.length > 0) {
        await batch.commit();
      }
    }
  };

  const seedData = async () => {
    setIsSeeding(true);
    setStats(null);
    
    try {
      // Clear existing data
      await clearDatabase();
      
      setSeedingStatus('Creating users...');
      
      // Create admin
      await setDoc(doc(db, "users", "admin@university.edu"), {
        name: "System Administrator",
        email: "admin@university.edu",
        role: "admin",
        createdAt: new Date()
      });

      // Create teachers
      const teachers = [
        { email: "alice.smith@university.edu", name: "Dr. Alice Smith", courses: ["CS101", "CS102"] },
        { email: "bob.johnson@university.edu", name: "Prof. Bob Johnson", courses: ["MATH201"] },
        { email: "carol.white@university.edu", name: "Dr. Carol White", courses: ["PHYS150"] }
      ];

      for (const teacher of teachers) {
        await setDoc(doc(db, "users", teacher.email), {
          ...teacher,
          role: "teacher",
          createdAt: new Date()
        });
      }

      // Create students
      const students = [
        { email: "john.doe@student.edu", name: "John Doe", studentId: "ST001" },
        { email: "jane.smith@student.edu", name: "Jane Smith", studentId: "ST002" },
        { email: "mike.wilson@student.edu", name: "Mike Wilson", studentId: "ST003" },
        { email: "sarah.davis@student.edu", name: "Sarah Davis", studentId: "ST004" },
        { email: "alex.johnson@student.edu", name: "Alex Johnson", studentId: "ST005" },
        { email: "emily.brown@student.edu", name: "Emily Brown", studentId: "ST006" }
      ];

      for (const student of students) {
        await setDoc(doc(db, "users", student.email), {
          ...student,
          role: "student",
          enrolledCourses: [],
          createdAt: new Date()
        });
      }

      setSeedingStatus('Creating courses...');

      // Create courses
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

      setSeedingStatus('Creating enrollments...');

      // Create enrollments
      const enrollments = {
        "cs101-fall2024": ["john.doe@student.edu", "jane.smith@student.edu", "alex.johnson@student.edu"],
        "math201-fall2024": ["john.doe@student.edu", "mike.wilson@student.edu", "alex.johnson@student.edu"],
        "phys150-fall2024": ["mike.wilson@student.edu", "sarah.davis@student.edu", "emily.brown@student.edu"]
      };

      let totalEnrollments = 0;
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
            totalEnrollments++;
          }
        }
      }

      setSeedingStatus('Creating attendance records...');

      // Create attendance for last 5 days
      const getRandomStatus = () => {
        const rand = Math.random();
        if (rand < 0.7) return "present";
        if (rand < 0.9) return "late";
        return "absent";
      };

      let totalAttendance = 0;
      for (let i = 4; i >= 0; i--) {
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
                timestamp: new Date(date.getTime() + Math.random() * 8 * 60 * 60 * 1000),
                location: {
                  latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
                  longitude: -74.0060 + (Math.random() - 0.5) * 0.01
                }
              });
              totalAttendance++;
            }
          }
        }
      }

      setSeedingStatus('Database seeded successfully!');
      setStats({
        users: 1 + teachers.length + students.length,
        teachers: teachers.length,
        students: students.length,
        courses: courses.length,
        enrollments: totalEnrollments,
        attendance: totalAttendance
      });

    } catch (error) {
      console.error('Error seeding database:', error);
      setSeedingStatus(`Error: ${error.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Database Seeder</h2>
      <p className="text-gray-600 mb-6">
        This will populate your database with test data for development and testing.
      </p>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Warning</h3>
        <p className="text-yellow-700 text-sm">
          This will clear all existing data and replace it with test data. Only use this in development!
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">📊 Test Data Includes:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• 1 admin user (admin@university.edu)</li>
          <li>• 3 teachers with different courses</li>
          <li>• 6 students enrolled in various courses</li>
          <li>• 3 courses with realistic details</li>
          <li>• Course enrollments (rosters)</li>
          <li>• 5 days of attendance records</li>
        </ul>
      </div>

      <button
        onClick={seedData}
        disabled={isSeeding}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
          isSeeding
            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isSeeding ? 'Seeding Database...' : 'Seed Database with Test Data'}
      </button>

      {seedingStatus && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md">
          <p className="text-sm text-gray-700">{seedingStatus}</p>
        </div>
      )}

      {stats && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-semibold text-green-800 mb-2">✅ Success!</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
            <div>Users: {stats.users}</div>
            <div>Teachers: {stats.teachers}</div>
            <div>Students: {stats.students}</div>
            <div>Courses: {stats.courses}</div>
            <div>Enrollments: {stats.enrollments}</div>
            <div>Attendance: {stats.attendance}</div>
          </div>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500">
        <p>Test accounts you can use:</p>
        <p><strong>Admin:</strong> admin@university.edu</p>
        <p><strong>Teacher:</strong> alice.smith@university.edu</p>
        <p><strong>Student:</strong> john.doe@student.edu</p>
      </div>
    </div>
  );
}
