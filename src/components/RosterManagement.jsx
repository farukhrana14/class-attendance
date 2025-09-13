import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc,
  query,
  where
} from "firebase/firestore";
// Excel library import commented out - will be used when backend server implementation is ready
// import * as XLSX from 'xlsx';
import { 
  validateCSVFile, 
  detectAndNormalizeEncoding, 
  parseCSV, 
  processCSVRows,
  checkDuplicateSubmission
} from "../utils/csvValidation";
import { 
  processAttendanceData 
} from "../utils/attendanceValidation";
import uploadLimiter from "../utils/rateLimiter";

export default function RosterManagement() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [stagedStudents, setStagedStudents] = useState([]); // New staging area
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    studentId: "",
    section: "",
    courseName: ""
  });
  const [adding, setAdding] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [uploadMethod, setUploadMethod] = useState("file"); // "file" or "text"
  const [showPreview, setShowPreview] = useState(false); // New preview state
  const [showManualEntry, setShowManualEntry] = useState(false); // Toggle for manual data entry
  const [showMessage, setShowMessage] = useState(false); // Show message modal
  const [messageContent, setMessageContent] = useState({ type: "", title: "", message: "", onConfirm: null }); // Message content
  const [searchTerm, setSearchTerm] = useState(""); // Search filter for students
  const [attendanceData, setAttendanceData] = useState({}); // Student attendance data
  const [attendanceStats, setAttendanceStats] = useState({}); // Attendance statistics
  const [selectedStudents, setSelectedStudents] = useState([]); // Selected students for bulk actions
  const [editingStudent, setEditingStudent] = useState(null); // Currently editing student
  const [showEditModal, setShowEditModal] = useState(false); // Show edit student modal
  const [editFormData, setEditFormData] = useState({ name: "", email: "", studentId: "", section: "" }); // Edit form data

  // Show message modal
  const showMessageModal = (type, title, message, onConfirm = null) => {
    setMessageContent({ type, title, message, onConfirm });
    setShowMessage(true);
  };

  // Close message modal
  const closeMessageModal = () => {
    setShowMessage(false);
    setMessageContent({ type: "", title: "", message: "", onConfirm: null });
  };

  // Handle confirmation
  const handleConfirm = () => {
    if (messageContent.onConfirm) {
      messageContent.onConfirm();
    }
    closeMessageModal();
  };

  // Fetch course and students
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get course details
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (!courseDoc.exists()) {
          setError("Course not found");
          return;
        }
        
        setCourse({ id: courseDoc.id, ...courseDoc.data() });

        // Get students
        const studentsRef = collection(db, "courses", courseId, "students");
        const studentsSnap = await getDocs(studentsRef);
        
        const studentsList = [];
        studentsSnap.forEach((doc) => {
          studentsList.push({ id: doc.id, ...doc.data() });
        });
        
        setStudents(studentsList);
        
        // Fetch attendance data for each student
        if (studentsList.length > 0) {
          try {
            // Get all attendance records for this course
            const attendanceRef = collection(db, "attendance");
            const attendanceQuery = query(attendanceRef, where("courseId", "==", courseId));
            const attendanceSnapshot = await getDocs(attendanceQuery);
            
            // Process attendance data using our validation utilities
            const { attendanceData, attendanceStats } = processAttendanceData(
              attendanceSnapshot.docs, 
              studentsList,
              courseId
            );
            
            // Update state with validated attendance data
            setAttendanceData(attendanceData);
            setAttendanceStats(attendanceStats);
          } catch (attendanceError) {
            console.error("Error fetching attendance data:", attendanceError);
          }
        }
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  // Add new student to staging
  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    if (!newStudent.name || !newStudent.email || !newStudent.studentId || !newStudent.section || !newStudent.courseName) {
      showMessageModal("error", "Validation Error", "All fields are required");
      return;
    }

    // Check if student already exists in current students
    const existingStudent = students.find(s => s.email === newStudent.email);
    if (existingStudent) {
      showMessageModal("error", "Duplicate Student", "Student with this email already exists in this course");
      return;
    }

    // Check if student already exists in staged students
    const stagedStudent = stagedStudents.find(s => s.email === newStudent.email);
    if (stagedStudent) {
      showMessageModal("error", "Duplicate Student", "Student with this email is already in the preview list for this course");
      return;
    }

    // Add to staging area
    setStagedStudents(prev => [
      ...prev,
      {
        ...newStudent,
        id: newStudent.email,
        enrolledCourses: [newStudent.courseName]
      }
    ]);
    setNewStudent({ name: "", email: "", studentId: "", section: "", courseName: "" });
    setShowPreview(true);
  };

  // Remove student
  const handleRemoveStudent = async (studentEmail) => {
    // Use custom modal for confirmation
    showMessageModal(
      "warning", 
      "Confirm Removal", 
      "Are you sure you want to remove this student from the course?",
      async () => {
        try {
          await deleteDoc(doc(db, "courses", courseId, "students", studentEmail));
          setStudents(prev => prev.filter(s => s.email !== studentEmail));
          showMessageModal("success", "Success", "Student removed successfully");
        } catch (err) {
          console.error("Error removing student:", err);
          showMessageModal("error", "Delete Error", "Failed to remove student");
        }
      }
    );
  };

  // Stage bulk import students (don't save to Firestore yet)
  const handleBulkImport = async () => {
    if (!bulkInput.trim()) {
      showMessageModal("error", "Input Required", "Please enter student data");
      return;
    }

    await processBulkData(bulkInput.trim());
  };

  // Handle file upload for bulk import
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Apply comprehensive file validation
    const fileValidation = validateCSVFile(file);
    if (!fileValidation.isValid) {
      showMessageModal("error", "Invalid File", fileValidation.error);
      event.target.value = ''; // Clear the file input
      return;
    }
    
    // Check for duplicate submission
    if (checkDuplicateSubmission(file)) {
      showMessageModal("warning", "Duplicate Upload", "This file appears to have been uploaded already. Please wait before trying again.");
      event.target.value = ''; // Clear the file input
      return;
    }
    
    // Apply rate limiting if user is authenticated
    if (userData?.uid) {
      const rateCheck = uploadLimiter.checkLimit(userData.uid);
      if (!rateCheck.allowed) {
        showMessageModal("error", "Too Many Attempts", 
          `Upload limit reached. Please try again in ${rateCheck.timeToReset} seconds.`);
        event.target.value = ''; // Clear the file input
        return;
      }
    }

    setBulkProcessing(true);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          // Safely detect encoding and normalize the content
          const csvText = detectAndNormalizeEncoding(e.target.result);
          
          // Process the CSV text with enhanced security
          await processBulkData(csvText, file);

          /* 
          // Excel processing functionality - to be implemented when secured backend server is available
          if (fileType.endsWith('.xlsx') || fileType.endsWith('.xls')) {
            const workbook = XLSX.read(e.target.result, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to CSV format
            csvText = XLSX.utils.sheet_to_csv(worksheet);
          }
          */

        } catch (err) {
          console.error('Error processing file:', err);
          showMessageModal("error", "File Processing Error", "Failed to process file. Please check the format and try again.");
        } finally {
          setBulkProcessing(false);
        }
      };

      // Read file as ArrayBuffer for proper encoding detection
      reader.readAsArrayBuffer(file);

    } catch (err) {
      console.error('Error reading file:', err);
      showMessageModal("error", "File Read Error", "Failed to read file. Please try again.");
      setBulkProcessing(false);
    } finally {
      // Clear the file input
      event.target.value = '';
    }
  };

  // Save staged students to Firestore
  const handleSaveStaged = async () => {
    if (!stagedStudents.length) return;

    try {
      const batch = [];
      for (const student of stagedStudents) {
        const studentRef = doc(db, "courses", courseId, "students", student.email);
        batch.push(() => setDoc(studentRef, {
          name: student.name,
          email: student.email,
          studentId: student.studentId,
          section: student.section
        }));
      }

      // Execute all promises
      await Promise.all(batch.map(fn => fn()));

      // Add the new students to the state with empty attendance data
      const newStudents = stagedStudents.map(s => ({ id: s.email, ...s }));
      
      // Update local state
      setStudents(prev => [...prev, ...newStudents]);
      
      // Update the enrolledEmails set to include the new students
      // This ensures attendance data is correctly filtered when component re-renders
      const newStudentEmails = new Set(newStudents.map(student => student.email.toLowerCase()));
      
      // Ensure new students don't show old attendance data that might have been cached
      setAttendanceStats(prev => {
        const updatedStats = { ...prev };
        // Reset attendance data for newly added students
        newStudentEmails.forEach(email => {
          if (updatedStats[email]) {
            delete updatedStats[email];
          }
        });
        return updatedStats;
      });
      
      // Clear staging area
      setStagedStudents([]);
      setShowPreview(false);
      
      showMessageModal("success", "Success", `Successfully added ${stagedStudents.length} students!`);
    } catch (error) {
      console.error("Error saving students:", error);
      showMessageModal("error", "Save Error", "Failed to save students. Please try again.");
    }
  };

  // Cancel staged students
  const handleCancelStaged = () => {
    setStagedStudents([]);
    setShowPreview(false);
  };

  // Remove individual staged student
  const handleRemoveStaged = (email) => {
    setStagedStudents(prev => prev.filter(s => s.email !== email));
  };

  // Open edit modal for a student
  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setEditFormData({
      name: student.name || "",
      email: student.email || "",
      studentId: student.studentId || "",
      section: student.section || ""
    });
    setShowEditModal(true);
  };

  // Handle edit form changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save edited student
  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    
    try {
      // Basic validation
      if (!editFormData.name || !editFormData.email) {
        showMessageModal("error", "Validation Error", "Name and email are required");
        return;
      }
      
      // Check if email changed and if it exists for another student
      if (editFormData.email !== editingStudent.email) {
        const existingStudent = students.find(s => 
          s.email.toLowerCase() === editFormData.email.toLowerCase() && 
          s.email !== editingStudent.email
        );
        
        if (existingStudent) {
          showMessageModal("error", "Duplicate Email", "Another student with this email already exists");
          return;
        }
      }
      
      // If email is changed, we need to delete the old document and create a new one
      // because the email is the document ID
      if (editFormData.email !== editingStudent.email) {
        // Create new student document
        await setDoc(doc(db, "courses", courseId, "students", editFormData.email), {
          name: editFormData.name,
          email: editFormData.email,
          studentId: editFormData.studentId,
          section: editFormData.section
        });
        
        // Delete old student document
        await deleteDoc(doc(db, "courses", courseId, "students", editingStudent.email));
        
        // Update local state
        setStudents(prev => [
          ...prev.filter(s => s.email !== editingStudent.email),
          { 
            id: editFormData.email, 
            ...editFormData 
          }
        ]);
      } else {
        // Email is not changed, simple update
        await setDoc(doc(db, "courses", courseId, "students", editingStudent.email), {
          name: editFormData.name,
          email: editFormData.email,
          studentId: editFormData.studentId,
          section: editFormData.section
        }, { merge: true });
        
        // Update local state
        setStudents(prev => prev.map(student => 
          student.email === editingStudent.email 
            ? { id: student.id, ...editFormData } 
            : student
        ));
      }
      
      // Reset edit state
      setShowEditModal(false);
      setEditingStudent(null);
      showMessageModal("success", "Success", "Student information updated successfully");
    } catch (error) {
      console.error("Error updating student:", error);
      showMessageModal("error", "Update Error", "Failed to update student information");
    }
  };
  
  // Cancel edit
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingStudent(null);
  };

  const [sectionFilter, setSectionFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  
  // Get unique sections
  const sections = [...new Set(students.map(student => student.section || 'Unassigned'))];
  
  // Filter students based on search term, section filter, and attendance filter
  const filteredStudents = students.filter(student => {
    // Apply search term filter
    const matchesSearch = !searchTerm || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase()));
      
    // Apply section filter
    const matchesSection = sectionFilter === 'all' || student.section === sectionFilter || 
      (!student.section && sectionFilter === 'Unassigned');
      
    // Apply attendance filter
    let matchesAttendance = true;
    if (attendanceFilter !== 'all') {
      const stats = attendanceStats[student.email];
      
      if (!stats) {
        matchesAttendance = attendanceFilter === 'no-data';
      } else {
        const percentage = stats.percentage;
        
        switch (attendanceFilter) {
          case 'high':
            matchesAttendance = percentage >= 80;
            break;
          case 'medium':
            matchesAttendance = percentage >= 60 && percentage < 80;
            break;
          case 'low':
            matchesAttendance = percentage < 60;
            break;
          case 'no-data':
            matchesAttendance = false;
            break;
          default:
            matchesAttendance = true;
        }
      }
    }
    
    return matchesSearch && matchesSection && matchesAttendance;
  });

  // Process bulk data and add to staging area
  const processBulkData = async (inputText, originalFile = null) => {
    setBulkProcessing(true);
    
    try {
      // Parse and validate CSV structure using our enhanced utilities
      const { rows, hasHeader, errors: parseErrors, dataRows } = parseCSV(inputText);
      
      if (parseErrors.length > 0) {
        showMessageModal("error", "CSV Format Error", parseErrors.join('\n'));
        return;
      }
      
      // Handle test data with only name column
      if (dataRows.length > 0 && dataRows[0].length === 1) {
        // Special case: CSV has only one column (likely a name column)
        const finalStudents = [];
        
        // Process each row with just the name
        dataRows.forEach((row, index) => {
          const name = row[0].trim();
          if (name) {
            // Generate placeholder values for required fields
            const studentId = `ST${String(index + 1).padStart(3, '0')}`;
            const email = `student${index + 1}@example.com`;
            const section = "A";
            
            finalStudents.push({
              name,
              email,
              studentId,
              section,
              id: email
            });
          }
        });
        
        if (finalStudents.length > 0) {
          setStagedStudents(prev => [...prev, ...finalStudents]);
          setShowPreview(true);
          setBulkInput("");
          setShowBulkImport(false);
          
          showMessageModal("success", "Import Successful", 
            `${finalStudents.length} students prepared from name-only list. Auto-generated IDs and emails.`);
        } else {
          showMessageModal("warning", "No Data", "No valid student data found in the CSV file.");
        }
        
        return;
      }
      
      // Apply comprehensive data validation and sanitization for full format CSV
      const { validRecords, errors: validationErrors } = processCSVRows(dataRows, hasHeader);
      
      // Check for duplicates against current students and staged students
      const finalStudents = [];
      const duplicateErrors = [];
      
      for (const student of validRecords) {
        // Check if student already exists in current students
        const existingStudent = students.find(s => 
          s.email.toLowerCase() === student.email.toLowerCase()
        );
        
        if (existingStudent) {
          duplicateErrors.push(`Student with email ${student.email} already exists in this course`);
          continue;
        }

        // Check if student already exists in staged students
        const existingStagedStudent = [...stagedStudents, ...finalStudents].find(s => 
          s.email.toLowerCase() === student.email.toLowerCase()
        );
        
        if (existingStagedStudent) {
          duplicateErrors.push(`Student with email ${student.email} is already in the preview list`);
          continue;
        }
        
        finalStudents.push(student);
      }
      
      // Combine all errors
      const allErrors = [...validationErrors, ...duplicateErrors];
      
      if (finalStudents.length > 0) {
        setStagedStudents(prev => [...prev, ...finalStudents]);
        setShowPreview(true);
        setBulkInput("");
        setShowBulkImport(false);
        
        // If there were no errors, show success message
        if (allErrors.length === 0) {
          showMessageModal("success", "Import Successful", 
            `${finalStudents.length} students successfully prepared for import. Review and save to complete.`);
        }
      } else if (allErrors.length === 0) {
        // No students imported and no errors - likely an empty file
        showMessageModal("warning", "No Data", "No valid student data found in the CSV file.");
        return;
      }

      if (allErrors.length > 0) {
        const errorMessage = allErrors.length > 10
          ? `Found ${allErrors.length} errors. Showing first 10:\n\n${allErrors.slice(0, 10).join('\n')}\n\n...and ${allErrors.length - 10} more errors.\n\n${finalStudents.length} valid students added to preview.`
          : `Found ${allErrors.length} errors:\n\n${allErrors.join('\n')}\n\n${finalStudents.length} valid students added to preview.`;
          
        showMessageModal(
          finalStudents.length > 0 ? "warning" : "error", 
          "Import Results", 
          errorMessage
        );
      }

    } catch (err) {
      console.error("Error in bulk processing:", err);
      showMessageModal("error", "Processing Error", `Failed to process data: ${err.message}`);
    } finally {
      setBulkProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading roster...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-lg text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate("/teacher")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <div className="px-4 sm:px-6 py-6 w-full flex justify-center">
        <div className="w-full max-w-[1200px]">
        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <div className="mb-2">
                <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full mb-1 md:mb-0">
                  Add Student
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
                Course <span className="text-blue-700">{course?.courseCode}</span>
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                <span className="font-medium">{course?.courseName}</span> 
                {course?.section && <span className="mx-1">•</span>}
                {course?.section && <span>Section {course?.section}</span>}
              </p>
            </div>
            <div className="mt-3 md:mt-0 md:text-right">
              <p className="text-gray-800 font-semibold">
                {course?.university || "State University of ULAB"}
              </p>
              <p className="text-gray-600 text-sm">Fall 2025</p>
            </div>
          </div>
        </div>

        {/* Add Student Form */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Add Students</h2>
            <div>
              <button
                onClick={() => setShowBulkImport(!showBulkImport)}
                className={`px-4 py-2 rounded-md font-medium transition-colors w-full sm:w-auto ${
                  showBulkImport 
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300" 
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {showBulkImport ? "Single Student Entry" : "Bulk Import"}
              </button>
            </div>
          </div>

          {!showBulkImport ? (
            /* Single Student Form */
            <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <input
                type="text"
                placeholder="Student Name"
                value={newStudent.name}
                onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hidden"
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                value={newStudent.email}
                onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hidden"
                required
              />
              <input
                type="text"
                placeholder="Student ID"
                value={newStudent.studentId}
                onChange={(e) => setNewStudent(prev => ({ ...prev, studentId: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hidden"
                required
              />
              <input
                type="text"
                placeholder="Section"
                value={newStudent.section}
                onChange={(e) => setNewStudent(prev => ({ ...prev, section: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hidden"
                required
              />
              <input
                type="text"
                placeholder="Course Name"
                value={newStudent.courseName}
                onChange={(e) => setNewStudent(prev => ({ ...prev, courseName: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hidden"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium hidden"
              >
                Add Student
              </button>
            </form>
          ) : (
            /* Bulk Import Form */
            <div className="space-y-6">
              {/* File Upload Method - Primary Option */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Upload a file with format: <code>Student ID, Name, Email, Section</code><br/>
                  Supports: CSV (.csv) files only
                  {/* Excel file support (.xlsx, .xls) to be implemented when secured backend server is available */}
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={bulkProcessing}
                    className="hidden"
                    id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload" 
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="text-4xl mb-2">📄</div>
                    <div
                      className="bg-green-600 text-white font-medium py-2 px-6 rounded-md hover:bg-green-700 transition-colors mb-2"
                    >
                      Upload CSV
                    </div>
                    <p className="text-sm text-gray-500">
                      Supports .csv files
                      {/* Excel file support (.xlsx, .xls) to be implemented with secured backend server */}
                    </p>
                  </label>
                </div>
                {bulkProcessing && (
                  <p className="text-blue-600 mt-2">Processing file...</p>
                )}
              </div>

              {/* Manual Data Entry - Secondary Option */}
              <div className="border-t border-gray-200 pt-4">
                {!showManualEntry ? (
                  <div className="text-center">
                    <button
                      className="bg-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed opacity-60 border border-gray-200"
                      disabled
                    >
                      Manual Data Entry
                    </button>
                    <p className="text-xs text-gray-400 mt-1">
                      Alternative option for typing or pasting student data
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Manual Data Entry
                      </label>
                      <button
                        onClick={() => {
                          setShowManualEntry(false);
                          setBulkInput("");
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        ✕ Hide
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      Enter one student per line in format: <code>Student ID, Name, Email, Section</code><br/>
                      Example: <code>John Doe, john@email.com, ST001, A</code>
                    </p>
                    <textarea
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      placeholder="John Doe, john.doe@email.com, ST001, A&#10;Jane Smith, jane.smith@email.com, ST002, B&#10;..."
                      className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="8"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleBulkImport}
                        disabled={bulkProcessing || !bulkInput.trim()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {bulkProcessing ? "Processing..." : "Import Students"}
                      </button>
                      <button
                        onClick={() => setBulkInput("")}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => {
                          setShowManualEntry(false);
                          setBulkInput("");
                        }}
                        className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        Hide
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Current Students ({filteredStudents.length} of {students.length})
            </h2>
            {students.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-grow w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search by name, email, or student ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    🔍
                  </div>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                {/* Clear Filters */}
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Bulk Actions Bar */}
          {selectedStudents.length > 0 && (
            <div className="bg-blue-50 p-3 sm:p-4 rounded-md mb-4 flex flex-wrap justify-between items-center gap-3">
              <div className="text-sm text-blue-700 font-medium">
                {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    // Use our custom modal for confirmation
                    showMessageModal(
                      "warning",
                      "Confirm Removal",
                      `Are you sure you want to remove ${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''} from this course?`,
                      async () => {
                        // Implement bulk remove functionality
                        try {
                          const removePromises = selectedStudents.map(email => 
                            deleteDoc(doc(db, "courses", courseId, "students", email))
                          );
                          
                          await Promise.all(removePromises);
                          setStudents(prev => prev.filter(s => !selectedStudents.includes(s.email)));
                          setSelectedStudents([]);
                          showMessageModal("success", "Success", `Successfully removed ${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''}`);
                        } catch (err) {
                          console.error("Error removing students:", err);
                          showMessageModal("error", "Error", "Failed to remove students");
                        }
                      }
                    );
                  }}
                  className="bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md hover:bg-red-700 text-sm font-medium whitespace-nowrap"
                >
                  Remove Selected
                </button>
                <button
                  onClick={() => setSelectedStudents([])}
                  className="bg-gray-200 text-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md hover:bg-gray-300 text-sm font-medium whitespace-nowrap"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {students.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No students in roster</p>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No students match your search criteria</p>
              <button
                onClick={() => setSearchTerm("")}
                className="mt-2 text-blue-600 hover:text-blue-700 underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <colgroup>
                  <col style={{ width: '40px' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '12%' }} />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents(filteredStudents.map(s => s.email));
                            } else {
                              setSelectedStudents([]);
                            }
                          }}
                          checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                        />
                        <span className="ml-2 text-xs font-medium text-gray-500 uppercase">Remove</span>
                      </div>
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modify
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.email} className={selectedStudents.includes(student.email) ? "bg-blue-50" : ""}>
                      <td className="px-3 py-3.5 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={selectedStudents.includes(student.email)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents(prev => [...prev, student.email]);
                            } else {
                              setSelectedStudents(prev => prev.filter(email => email !== student.email));
                            }
                          }}
                        />
                      </td>
                      <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {student.name}
                      </td>
                      <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap text-sm text-gray-500 truncate max-w-[250px]">
                        {student.email}
                      </td>
                      <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">
                        {student.studentId || "-"}
                      </td>
                      <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">
                        {student.section || "-"}
                      </td>
                      <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap">
                        {attendanceStats[student.email] ? (
                          <div className="flex items-center">
                            <div className="mr-2">
                              <span className={`inline-block rounded-full h-3 w-3 ${
                                attendanceStats[student.email].percentage >= 80 
                                  ? "bg-green-500" 
                                  : attendanceStats[student.email].percentage >= 60 
                                  ? "bg-yellow-500" 
                                  : "bg-red-500"
                              }`}></span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {attendanceStats[student.email].percentage}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {attendanceStats[student.email].present} / {attendanceStats[student.email].total} classes
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No data</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap text-sm font-medium text-center">
                        <button
                          onClick={() => handleEditStudent(student)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Preview Modal for Staged Students */}
      {showPreview && stagedStudents.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Preview Students to Add ({stagedStudents.length})
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Review the students below and click "Save All" to add them to the course.
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="overflow-x-auto rounded-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                  <colgroup>
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '25%' }} />
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Section
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stagedStudents.map((student, index) => (
                      <tr key={`staged-${student.email}-${index}`} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap text-sm text-gray-900">
                          {student.studentId}
                        </td>
                        <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap text-sm text-gray-900 truncate max-w-[200px]">
                          {student.name}
                        </td>
                        <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap text-sm text-gray-600 truncate max-w-[250px]">
                          {student.email}
                        </td>
                        <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                          {student.section}
                        </td>
                        <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap text-sm text-gray-600 text-center">
                          <button
                            onClick={() => handleRemoveStaged(student.email)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCancelStaged}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStaged}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Save All ({stagedStudents.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Student Information
              </h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    id="studentId"
                    name="studentId"
                    value={editFormData.studentId}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    id="section"
                    name="section"
                    value={editFormData.section}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className={`p-4 border-b ${
              messageContent.type === 'success' ? 'border-green-200 bg-green-50' :
              messageContent.type === 'error' ? 'border-red-200 bg-red-50' :
              messageContent.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
              'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center">
                <div className={`text-2xl mr-3 ${
                  messageContent.type === 'success' ? 'text-green-600' :
                  messageContent.type === 'error' ? 'text-red-600' :
                  messageContent.type === 'warning' ? 'text-yellow-600' :
                  'text-gray-600'
                }`}>
                  {messageContent.type === 'success' ? '✅' :
                   messageContent.type === 'error' ? '❌' :
                   messageContent.type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>
                <h3 className={`text-lg font-semibold ${
                  messageContent.type === 'success' ? 'text-green-900' :
                  messageContent.type === 'error' ? 'text-red-900' :
                  messageContent.type === 'warning' ? 'text-yellow-900' :
                  'text-gray-900'
                }`}>
                  {messageContent.title}
                </h3>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 whitespace-pre-line">
                {messageContent.message}
              </p>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              {messageContent.onConfirm && (
                <button
                  onClick={closeMessageModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={messageContent.onConfirm ? handleConfirm : closeMessageModal}
                className={`px-4 py-2 rounded-md font-medium ${
                  messageContent.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  messageContent.type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                  messageContent.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                  'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {messageContent.onConfirm ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
