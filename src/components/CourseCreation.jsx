import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function CourseCreation() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    courseCode: '',
    title: '',
    semester: '',
    year: new Date().getFullYear(),
    universityName: ''
  });
  const [roster, setRoster] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = () => {
    logout();
    setTimeout(() => {
      navigate("/");
    }, 100);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          setRoster(data);
        } catch (error) {
          console.error('Error parsing file:', error);
          alert('Error parsing file. Please make sure it\'s a valid Excel/CSV file.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!user || !user.email) {
        throw new Error('Please log in to create a course.');
      }

      const teacherData = {
        teacherId: user.email,
        teacherName: user.displayName || 'Unknown Teacher',
        teacherEmail: user.email
      };

      const courseRef = await addDoc(collection(db, 'courses'), {
        ...formData,
        ...teacherData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      });

      if (roster.length > 0) {
        const rosterPromises = roster.map(student => 
          addDoc(collection(db, 'courses', courseRef.id, 'students'), {
            ...student,
            courseId: courseRef.id,
            addedAt: serverTimestamp(),
            status: 'enrolled'
          })
        );
        await Promise.all(rosterPromises);
      }

      navigate('/teacher/courses');
    } catch (error) {
      console.error('Error saving course:', error);
      alert(`Error saving course: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const semesters = [
    'Spring 2024',
    'Summer 2024',
    'Fall 2024',
    'Spring 2025',
    'Summer 2025',
    'Fall 2025'
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-semibold">Create New Course</h1>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Course Details Section */}
                <div className="bg-white shadow sm:rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Course Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700">
                        Course Code
                      </label>
                      <input
                        type="text"
                        id="courseCode"
                        name="courseCode"
                        required
                        value={formData.courseCode}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., CSC101"
                      />
                    </div>

                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., Introduction to Computer Science"
                      />
                    </div>

                    <div>
                      <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                        Semester
                      </label>
                      <select
                        id="semester"
                        name="semester"
                        required
                        value={formData.semester}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select a semester</option>
                        {semesters.map(sem => (
                          <option key={sem} value={sem}>{sem}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                        Year
                      </label>
                      <input
                        type="number"
                        id="year"
                        name="year"
                        required
                        value={formData.year}
                        onChange={handleInputChange}
                        min="2024"
                        max="2030"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="universityName" className="block text-sm font-medium text-gray-700">
                        University Name
                      </label>
                      <input
                        type="text"
                        id="universityName"
                        name="universityName"
                        required
                        value={formData.universityName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., State University"
                      />
                    </div>
                  </div>
                </div>

                {/* Student Roster Section */}
                <div className="bg-white shadow sm:rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Student Roster</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Upload a spreadsheet containing student information
                      </p>
                    </div>
                    <div>
                      <input
                        type="file"
                        id="roster-upload"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        className="sr-only"
                      />
                      <label
                        htmlFor="roster-upload"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                      >
                        Upload Roster
                      </label>
                    </div>
                  </div>

                  {/* Roster Preview */}
                  {roster.length > 0 && (
                    <div className="mt-6">
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {Object.keys(roster[0]).map((header) => (
                                <th
                                  key={header}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {roster.slice(0, 5).map((student, index) => (
                              <tr key={index}>
                                {Object.values(student).map((value, i) => (
                                  <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {value}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {roster.length > 5 && (
                          <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
                            Showing 5 of {roster.length} students
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/teacher/courses')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isLoading ? 'Creating...' : 'Save Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}