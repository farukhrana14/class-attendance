/**
 * Attendance Validation and Processing Utilities
 * 
 * This module provides functions for validating and processing attendance data
 * to ensure data integrity and correct association between students and courses.
 */

/**
 * Validates attendance records to ensure they belong to students enrolled in the specified course
 * @param {Array} attendanceRecords - Array of attendance records
 * @param {Array} enrolledStudents - Array of students enrolled in the course
 * @param {String} courseId - The ID of the course to validate against
 * @returns {Object} Validated attendance data
 */
export function validateAttendanceRecords(attendanceRecords, enrolledStudents, courseId) {
  // Create a set of enrolled student emails for quick lookup
  const enrolledEmails = new Set(
    enrolledStudents.map(student => student.email.toLowerCase())
  );
  
  // Filter attendance records
  const validAttendanceRecords = attendanceRecords.filter(record => 
    record.courseId === courseId && 
    enrolledEmails.has(record.studentEmail.toLowerCase())
  );
  
  // Organize by student
  const attendanceByStudent = {};
  
  validAttendanceRecords.forEach(record => {
    const email = record.studentEmail;
    
    if (!attendanceByStudent[email]) {
      attendanceByStudent[email] = [];
    }
    
    attendanceByStudent[email].push(record);
  });
  
  return attendanceByStudent;
}

/**
 * Calculates attendance statistics for students
 * @param {Object} attendanceByStudent - Object mapping student emails to attendance records
 * @returns {Object} Attendance statistics by student email
 */
export function calculateAttendanceStatistics(attendanceByStudent) {
  const attendanceStats = {};
  
  Object.keys(attendanceByStudent).forEach(email => {
    const records = attendanceByStudent[email];
    const totalClasses = records.length;
    const presentCount = records.filter(r => r.status === "present").length;
    const lateCount = records.filter(r => r.status === "late").length;
    const absentCount = records.filter(r => r.status === "absent").length;
    
    attendanceStats[email] = {
      total: totalClasses,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      percentage: totalClasses > 0 ? Math.round(((presentCount + lateCount) / totalClasses) * 100) : 0
    };
  });
  
  return attendanceStats;
}

/**
 * Processes attendance records from Firestore and validates them for a course
 * @param {Array} firestoreRecords - Raw attendance records from Firestore
 * @param {Array} enrolledStudents - Students enrolled in the course
 * @param {String} courseId - The ID of the course
 * @returns {Object} Processed attendance data and statistics
 */
export function processAttendanceData(firestoreRecords, enrolledStudents, courseId) {
  // Extract data from Firestore documents
  const records = firestoreRecords.map(doc => doc.data());
  
  // Validate attendance records
  const attendanceData = validateAttendanceRecords(records, enrolledStudents, courseId);
  
  // Calculate statistics
  const attendanceStats = calculateAttendanceStatistics(attendanceData);
  
  return {
    attendanceData,
    attendanceStats
  };
}