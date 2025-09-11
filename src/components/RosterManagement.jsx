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
  deleteDoc 
} from "firebase/firestore";
import * as XLSX from 'xlsx';

export default function RosterManagement() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    studentId: "",
    section: ""
  });
  const [adding, setAdding] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [uploadMethod, setUploadMethod] = useState("file"); // "file" or "text"

  const handleSignOut = () => {
    logout();
    setTimeout(() => {
      navigate("/");
    }, 100);
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

  // Add new student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    if (!newStudent.name || !newStudent.email) {
      alert("Name and email are required");
      return;
    }

    try {
      setAdding(true);
      
      const studentRef = doc(db, "courses", courseId, "students", newStudent.email);
      await setDoc(studentRef, newStudent);
      
      // Update local state
      setStudents(prev => [...prev, { id: newStudent.email, ...newStudent }]);
      setNewStudent({ name: "", email: "", studentId: "", section: "" });
      
    } catch (err) {
      console.error("Error adding student:", err);
      alert("Failed to add student");
    } finally {
      setAdding(false);
    }
  };

  // Remove student
  const handleRemoveStudent = async (studentEmail) => {
    if (!confirm("Are you sure you want to remove this student?")) return;

    try {
      await deleteDoc(doc(db, "courses", courseId, "students", studentEmail));
      setStudents(prev => prev.filter(s => s.email !== studentEmail));
    } catch (err) {
      console.error("Error removing student:", err);
      alert("Failed to remove student");
    }
  };

  // Bulk import students
  const handleBulkImport = async () => {
    if (!bulkInput.trim()) {
      alert("Please enter student data");
      return;
    }

    await processBulkData(bulkInput.trim());
    setBulkInput("");
    setShowBulkImport(false);
  };

  // Handle file upload for bulk import
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const fileType = file.name.toLowerCase();
    if (!fileType.endsWith('.csv') && !fileType.endsWith('.xlsx') && !fileType.endsWith('.xls')) {
      alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    setBulkProcessing(true);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          let csvText = '';

          if (fileType.endsWith('.csv')) {
            // Handle CSV file
            csvText = new TextDecoder().decode(e.target.result);
          } else {
            // Handle Excel file using xlsx library
            const workbook = XLSX.read(e.target.result, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to CSV format
            csvText = XLSX.utils.sheet_to_csv(worksheet);
          }

          // Process the CSV text
          await processBulkData(csvText);

        } catch (err) {
          console.error('Error processing file:', err);
          alert('Failed to process file. Please check the format and try again.');
          setBulkProcessing(false);
        }
      };

      // Read file as ArrayBuffer to support both CSV and Excel
      reader.readAsArrayBuffer(file);

    } catch (err) {
      console.error('Error reading file:', err);
      alert('Failed to read file. Please try again.');
      setBulkProcessing(false);
    } finally {
      // Clear the file input
      event.target.value = '';
    }
  };

  // Extract bulk processing logic into separate function
  const processBulkData = async (inputText) => {
    setBulkProcessing(true);
    
    try {
      const lines = inputText.trim().split('\n');
      const importedStudents = [];
      const errors = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Expected format: StudentID, Name, Email, Section (optional)
        // or CSV format: StudentID,Name,Email,Section
        const parts = line.split(',').map(part => part.trim());
        
        // Skip header rows - check if first column looks like a header
        const firstCol = parts[0].toLowerCase();
        if (i === 0 && (firstCol.includes('name') || firstCol.includes('student') || firstCol.includes('email') || firstCol.includes('id'))) {
          console.log(`Skipping header row: ${line}`);
          continue;
        }
        
        if (parts.length < 3) {
          errors.push(`Line ${i + 1}: Invalid format. Need at least StudentID, Name, and Email`);
          continue;
        }

        const [studentId, name, email, section = ""] = parts;
        
        // Additional header detection - skip if values look like column headers
        if (studentId.toLowerCase().includes('student') || studentId.toLowerCase().includes('id') || 
            name.toLowerCase().includes('name') || email.toLowerCase().includes('email')) {
          console.log(`Skipping detected header row: ${line}`);
          continue;
        }
        
        if (!studentId || !name || !email) {
          errors.push(`Line ${i + 1}: StudentID, Name, and Email are all required`);
          continue;
        }

        // TODO: Uncomment email validation before production deployment
        // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // if (!emailRegex.test(email)) {
        //   errors.push(`Line ${i + 1}: Invalid email format`);
        //   continue;
        // }

        // Check if student already exists
        const existingStudent = students.find(s => s.email === email);
        if (existingStudent) {
          errors.push(`Line ${i + 1}: Student with email ${email} already exists`);
          continue;
        }

        const studentData = { name, email, studentId, section };
        
        try {
          const studentRef = doc(db, "courses", courseId, "students", email);
          await setDoc(studentRef, studentData);
          importedStudents.push({ id: email, ...studentData });
        } catch (err) {
          errors.push(`Line ${i + 1}: Failed to add ${name} (${email})`);
        }
      }

      // Update local state with successfully imported students
      if (importedStudents.length > 0) {
        setStudents(prev => [...prev, ...importedStudents]);
      }

      // Show results
      if (errors.length > 0) {
        alert(`Import completed with errors:\n\n${errors.join('\n')}\n\nSuccessfully imported: ${importedStudents.length} students`);
      } else {
        alert(`Successfully imported ${importedStudents.length} students!`);
      }

      // Hide bulk import section after successful import
      if (importedStudents.length > 0) {
        setShowBulkImport(false);
        setBulkInput("");
      }

    } catch (err) {
      console.error("Error in bulk import:", err);
      alert("Failed to process bulk import");
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
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Header with Sign Out button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleSignOut}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Manage Roster: {course?.courseCode}
              </h1>
              <p className="text-gray-600 mt-1">
                {course?.courseName} • {course?.university}
              </p>
            </div>
            <button
              onClick={() => navigate(`/teacher/courses/${courseId}`)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Course
            </button>
          </div>
        </div>

        {/* Add Student Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Add Students</h2>
            <div className="space-x-2">
              <button
                onClick={() => setShowBulkImport(!showBulkImport)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                {showBulkImport ? "Single Student" : "Bulk Import"}
              </button>
            </div>
          </div>

          {!showBulkImport ? (
            /* Single Student Form */
            <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Student Name"
                value={newStudent.name}
                onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                value={newStudent.email}
                onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Student ID (optional)"
                value={newStudent.studentId}
                onChange={(e) => setNewStudent(prev => ({ ...prev, studentId: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Section (optional)"
                value={newStudent.section}
                onChange={(e) => setNewStudent(prev => ({ ...prev, section: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={adding}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add Student"}
              </button>
            </form>
          ) : (
            /* Bulk Import Form */
            <div className="space-y-4">
              {/* Upload Method Toggle */}
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setUploadMethod("file")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    uploadMethod === "file" 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  📁 Upload File
                </button>
                <button
                  onClick={() => setUploadMethod("text")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    uploadMethod === "text" 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  📝 Copy & Paste
                </button>
              </div>

              {uploadMethod === "file" ? (
                /* File Upload Method */
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Excel or CSV File
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Upload a file with format: <code>Student ID, Name, Email, Section</code><br/>
                    Supports: Excel (.xlsx, .xls) and CSV (.csv) files
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
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
                      <p className="text-lg text-gray-600 mb-1">
                        Click to upload Excel or CSV file
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports .xlsx, .xls, and .csv files
                      </p>
                    </label>
                  </div>
                  {bulkProcessing && (
                    <p className="text-blue-600 mt-2">Processing file...</p>
                  )}
                </div>
              ) : (
                /* Text Input Method */
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bulk Import Students (CSV Format)
                  </label>
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
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Current Students ({students.length})
          </h2>
          
          {students.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No students in roster</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.email}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.studentId || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.section || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRemoveStudent(student.email)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
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
  );
}
