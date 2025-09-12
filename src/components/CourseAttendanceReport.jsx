import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';

export default function CourseAttendanceReport() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();

  const [course, setCourse] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [students, setStudents] = useState([]);
  const [dates, setDates] = useState([]);
  
  // Message modal state
  const [showMessage, setShowMessage] = useState(false);
  const [messageContent, setMessageContent] = useState({ type: "", title: "", message: "", onConfirm: null });

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
        
        const courseData = { id: courseDoc.id, ...courseDoc.data() };
        setCourse(courseData);

        // Get students for the course
        const studentsRef = collection(db, "courses", courseId, "students");
        const studentsSnap = await getDocs(studentsRef);
        
        const studentsList = [];
        studentsSnap.forEach((doc) => {
          studentsList.push({ id: doc.id, ...doc.data() });
        });
        
        setStudents(studentsList);

        // Get attendance records for the course
        const attendanceRef = collection(db, "attendance");
        const attendanceQuery = query(
          attendanceRef, 
          where("courseId", "==", courseId)
        );
        const attendanceSnap = await getDocs(attendanceQuery);

        const records = [];
        const uniqueDates = new Set();
        
        attendanceSnap.forEach((doc) => {
          const record = { id: doc.id, ...doc.data() };
          records.push(record);
          if (record.date) {
            uniqueDates.add(record.date);
          }
        });
        
        // Sort records by date (newest first) and then by student name
        records.sort((a, b) => {
          if (a.date !== b.date) {
            return new Date(b.date) - new Date(a.date);
          }
          return a.studentName.localeCompare(b.studentName);
        });
        
        setAttendanceRecords(records);
        
        // Sort dates chronologically (oldest first for table display)
        const sortedDates = Array.from(uniqueDates).sort((a, b) => new Date(a) - new Date(b));
        setDates(sortedDates);
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load attendance data");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get status color class
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'sick':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      // Create worksheet data
      const wsData = [];
      
      // Add header row
      const headers = [
        'Student ID', 
        'Student Name', 
        'Email',
        'Section'
      ];
      
      // Add date headers
      dates.forEach(date => {
        headers.push(formatDate(date));
      });
      
      wsData.push(headers);
      
      // Add data rows for each student
      students.forEach(student => {
        const row = [
          student.studentId,
          student.name,
          student.email,
          student.section
        ];
        
        // Add attendance status for each date
        dates.forEach(date => {
          const record = attendanceRecords.find(
            r => r.studentEmail === student.email && r.date === date
          );
          row.push(record?.status || 'N/A');
        });
        
        wsData.push(row);
      });
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      
      // Generate file name
      const fileName = `${course?.courseCode || 'Course'}_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, fileName);
      
      showMessageModal('success', 'Export Successful', `Attendance data has been exported to ${fileName}`);
    } catch (err) {
      console.error('Export error:', err);
      showMessageModal('error', 'Export Failed', 'Failed to export attendance data. Please try again.');
    }
  };

  // PDF generation functionality has been removed as requested

  // Print attendance report
  const printReport = () => {
    // Declare printWindow variable outside the try block so it's accessible throughout the function
    let printWindow;
    
    try {
      console.log("Starting print report process");
      printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        console.error("Failed to open print window. This might be due to pop-up blocking.");
        showMessageModal('error', 'Print Failed', 'Failed to open print window. Please check if pop-ups are blocked for this site.');
        return;
      }
      
      // Generate dates for attendance report (default 25, up to 30 based on data)
      const generateAllDates = () => {
        console.log("Generating dates for report");
        const DEFAULT_DATES = 25;
        const MAX_DATES = 30;
        
        // If we have actual dates, use them and fill up to DEFAULT_DATES
        if (dates.length > 0) {
          const firstDate = new Date(dates[0]);
          const allDates = [...dates]; // Start with actual dates
          
          // Use all actual dates if between DEFAULT_DATES and MAX_DATES
          if (allDates.length >= DEFAULT_DATES && allDates.length <= MAX_DATES) {
            return allDates;
          }
          
          // If we have less than DEFAULT_DATES, generate more
          if (allDates.length < DEFAULT_DATES) {
            let lastDate = firstDate;
            if (dates.length > 0) {
              lastDate = new Date(dates[dates.length - 1]);
            }
            
            while (allDates.length < DEFAULT_DATES) {
              // Add 2-3 days gap (randomly)
              const gap = Math.floor(Math.random() * 2) + 2; // 2-3 days
              const nextDate = new Date(lastDate);
              nextDate.setDate(lastDate.getDate() + gap);
              
              // Format to YYYY-MM-DD format
              const dateStr = nextDate.toISOString().split('T')[0];
              allDates.push(dateStr);
              lastDate = nextDate;
            }
          }
          
          // If we have more than MAX_DATES, take just the first MAX_DATES
          return allDates.slice(0, MAX_DATES);
        } else {
          // If no dates, generate DEFAULT_DATES starting from today with 2-3 day gaps
          const allDates = [];
          let currentDate = new Date();
          
          for (let i = 0; i < DEFAULT_DATES; i++) {
            // Format to YYYY-MM-DD format
            const dateStr = currentDate.toISOString().split('T')[0];
            allDates.push(dateStr);
            
            // Add 2-3 days gap (randomly)
            const gap = Math.floor(Math.random() * 2) + 2; // 2-3 days
            currentDate.setDate(currentDate.getDate() + gap);
          }
          
          return allDates;
        }
      };
      
      const allDates = generateAllDates();
      
      // Basic HTML and CSS for print
      // Create a suggested filename based on course code and current date
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      const suggestedFilename = `${course?.courseCode || 'Course'}_ClassAttendance_${formattedDate}`;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${suggestedFilename}</title>
          <meta name="filename" content="${suggestedFilename}.pdf">
          <meta name="description" content="Attendance report for ${course?.courseCode || 'Course'} - ${course?.courseName || ''} - ${formattedDate}">
          <style>
            @page {
              size: landscape;
              margin: 10mm;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 10px;
            }
            h1 { font-size: 16px; margin-bottom: 5px; }
            h2 { font-size: 14px; margin-bottom: 5px; }
            .details { margin-bottom: 10px; }
            .details p { margin: 3px 0; font-size: 12px; }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin-top: 10px;
              font-size: 7px; /* Smaller font to accommodate more columns */
              table-layout: fixed;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 2px 3px; /* Reduced padding */
              text-align: center;
              font-size: 7px;
              max-width: 16px; /* Narrower cells */
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }
            .student-name {
              text-align: left;
              font-size: 7px;
              width: 90px; /* Fixed width */
              max-width: 90px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .student-id {
              text-align: left;
              font-size: 7px;
              width: 50px; /* Fixed width */
              max-width: 50px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            th { 
              background-color: #f2f2f2;
              position: sticky;
              top: 0;
            }
            .date-header {
              writing-mode: vertical-rl;
              transform: rotate(180deg);
              white-space: nowrap;
              height: 80px;
              vertical-align: bottom;
              text-align: left;
              font-size: 8px;
              font-weight: normal;
            }
            .present { background-color: #d1fae5; }
            .late { background-color: #fef3c7; }
            .absent { background-color: #fee2e2; }
            .sick { background-color: #dbeafe; }
            .print-summary {
              margin-top: 15px;
              font-size: 12px;
            }
            .print-footer {
              margin-top: 15px;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
            .status-legend {
              display: flex;
              gap: 10px;
              margin-top: 5px;
              font-size: 8px;
            }
            .legend-item {
              display: flex;
              align-items: center;
            }
            .legend-color {
              width: 12px;
              height: 12px;
              margin-right: 3px;
            }
          </style>
        </head>
        <body>
          <h1>Attendance Report</h1>
          <div class="details">
            <p><strong>Course:</strong> ${course?.courseCode || ''} - ${course?.courseName || ''}</p>
            <p><strong>Section:</strong> ${course?.section || 'N/A'} | <strong>University:</strong> ${course?.university || 'N/A'} | <strong>Semester:</strong> ${course?.semester || ''}</p>
            <p><strong>Teacher:</strong> ${course?.teacherName || userData?.name || 'N/A'} | <strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="status-legend">
            <div class="legend-item">
              <div class="legend-color present"></div>
              <span>Present</span>
            </div>
            <div class="legend-item">
              <div class="legend-color late"></div>
              <span>Late</span>
            </div>
            <div class="legend-item">
              <div class="legend-color absent"></div>
              <span>Absent</span>
            </div>
            <div class="legend-item">
              <div class="legend-color sick"></div>
              <span>Sick</span>
            </div>
          </div>

          <!-- Horizontal Table (for printing) -->
          <table>
            <thead>
              <tr>
                <th style="min-width: 60px;">Student ID</th>
                <th style="min-width: 100px;">Student Name</th>
                ${allDates.map(date => `<th class="date-header">${formatDate(date)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${students.map(student => `
                <tr>
                  <td class="student-id">${student.studentId || 'N/A'}</td>
                  <td class="student-name">${student.name}</td>
                  ${allDates.map(date => {
                    const record = attendanceRecords.find(
                      r => r.studentEmail === student.email && r.date === date
                    );
                    const status = record?.status || '';
                    let statusClass = '';
                    let displayStatus = '';
                    
                    if (status.toLowerCase() === 'present') {
                      statusClass = 'present';
                      displayStatus = 'P';
                    } else if (status.toLowerCase() === 'late') {
                      statusClass = 'late';
                      displayStatus = 'L';
                    } else if (status.toLowerCase() === 'absent') {
                      statusClass = 'absent';
                      displayStatus = 'A';
                    } else if (status.toLowerCase() === 'sick') {
                      statusClass = 'sick';
                      displayStatus = 'S';
                    }
                    
                    return `<td class="${statusClass}">${displayStatus}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="print-summary">
            <p><strong>Total Students:</strong> ${students.length}</p>
            <p><strong>Total Classes:</strong> ${allDates.length}</p>
            <p><strong>Actual Attendance Records:</strong> ${dates.length} days</p>
          </div>
          
          <div class="print-footer">
            <p>Generated by ClassAttend - ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; position: fixed; bottom: 20px; left: 0; right: 0;">
            <p id="closeMessage" style="display: none; font-size: 14px; color: #4B5563;">This tab will close automatically in <span id="countdown">3</span> seconds...</p>
            <button id="closeButton" style="padding: 8px 16px; background-color: #475569; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; display: none;">
              Close Tab Now
            </button>
          </div>
          
          <script>
            // Auto close functionality with improved error handling
            window.onload = function() {
              try {
                const closeButton = document.getElementById('closeButton');
                const closeMessage = document.getElementById('closeMessage');
                const countdown = document.getElementById('countdown');
                let seconds = 3;
                let countdownInterval;
                let printInitiated = false;
                
                // Function to start countdown and close
                function startCloseCountdown() {
                  try {
                    if (closeMessage) closeMessage.style.display = 'block';
                    if (closeButton) closeButton.style.display = 'inline-block';
                    
                    countdownInterval = setInterval(function() {
                      seconds--;
                      if (countdown) countdown.textContent = seconds;
                      if (seconds <= 0) {
                        clearInterval(countdownInterval);
                        try {
                          window.close();
                        } catch (e) {
                          console.log("Could not close window automatically");
                        }
                      }
                    }, 1000);
                  } catch (err) {
                    console.log("Error in countdown:", err);
                    // Still try to close the window even if countdown fails
                    setTimeout(() => window.close(), 2000);
                  }
                }
                
                // Handle manual close button
                if (closeButton) {
                  closeButton.addEventListener('click', function() {
                    try {
                      window.close();
                    } catch (e) {
                      console.log("Could not close window via button");
                    }
                  });
                }
                
                // Show print dialog safely
                setTimeout(function() {
                  if (!printInitiated) {
                    printInitiated = true;
                    try {
                      window.print();
                    } catch (e) {
                      console.log("Print dialog error:", e);
                    }
                  }
                }, 200);
                
                // After print dialog is shown/closed (with feature detection)
                if (typeof window.onafterprint !== 'undefined') {
                  window.addEventListener('afterprint', function() {
                    startCloseCountdown();
                  });
                }
                
                // Fallback: If print dialog doesn't trigger afterprint within 1.5 seconds
                setTimeout(function() {
                  if (seconds === 3) { // If countdown hasn't started yet
                    startCloseCountdown();
                  }
                }, 1500);
                
                // Force close after 7 seconds regardless of what happens
                setTimeout(function() {
                  try {
                    window.close();
                  } catch (e) {
                    console.log("Could not force close window");
                  }
                }, 7000);
                
              } catch (err) {
                console.log("General error in print window:", err);
                // Final fallback
                setTimeout(() => window.close(), 5000);
              }
            };
          </script>
        </body>
        </html>
      `);
      
      console.log("Finalizing print window document");
      
      try {
        // Close the document properly to trigger rendering
        printWindow.document.close();
        
        // Create a variable to track if the window is still being referenced
        let windowClosed = false;
        
        // Handle the case where the tab is closed by the user
        printWindow.onbeforeunload = function() {
          // Mark as closed rather than trying to modify the constant
          windowClosed = true;
          console.log("Print window was closed by user");
        };
        
        // Set a reference to check if window is still open
        const checkPrintWindowInterval = setInterval(() => {
          try {
            // Skip check if we already know it's closed
            if (windowClosed) {
              clearInterval(checkPrintWindowInterval);
              return;
            }
            
            if (printWindow && printWindow.closed) {
              console.log("Print window was detected as closed");
              windowClosed = true;
              clearInterval(checkPrintWindowInterval);
            }
          } catch (e) {
            // Window access might cause cross-origin errors after navigation
            console.log("Could not check print window status:", e.message);
            clearInterval(checkPrintWindowInterval);
          }
        }, 1000);
        
        // Clear check after 10 seconds max
        setTimeout(() => clearInterval(checkPrintWindowInterval), 10000);
        
      } catch (docErr) {
        console.error("Error finalizing print window:", docErr);
      }
      
    } catch (err) {
      console.error('Print error:', err);
      showMessageModal('error', 'Print Failed', `Failed to generate printable report: ${err.message || 'Unknown error'}. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading attendance records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-lg text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate("/teacher/reports")}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Back to Reports
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <div className="mb-2">
                <span className="inline-block bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
                  Attendance Report
                </span>
                {course?.section && 
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full ml-2">
                    Section {course?.section}
                  </span>
                }
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                {course?.courseCode} - {course?.courseName}
              </h1>
              <p className="text-gray-600">
                <span className="font-medium">{course?.university}</span>
                {course?.semester && <span> • {course?.semester}</span>}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Teacher: {course?.teacherName || userData?.name}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportToExcel}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <span className="mr-2">📊</span> Export to Excel
              </button>
              <button
                onClick={printReport}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <span className="mr-2">🖨️</span> Print Report
              </button>
              <button
                onClick={() => navigate("/teacher/reports")}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Reports
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-lg shadow-md p-6 overflow-hidden">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Attendance Records</h2>
          
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No attendance records found for this course</p>
              <p className="text-sm text-gray-400 mt-2">Take attendance first to see records here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    {dates.map(date => (
                      <th 
                        key={date} 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {formatDate(date)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.email} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.studentId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.name}
                      </td>
                      {dates.map(date => {
                        const record = attendanceRecords.find(
                          r => r.studentEmail === student.email && r.date === date
                        );
                        const status = record?.status || 'N/A';
                        
                        return (
                          <td key={`${student.email}-${date}`} className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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