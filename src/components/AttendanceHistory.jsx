import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const AttendanceHistory = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');

  useEffect(() => {
    if (!user) return;

    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('studentEmail', '==', user.email)
    );

    const unsubscribe = onSnapshot(attendanceQuery, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by date (newest first)
      const sortedRecords = records.sort((a, b) => {
        if (a.date && b.date) {
          return new Date(b.date) - new Date(a.date);
        }
        return 0;
      });

      console.log('Attendance records received:', sortedRecords);
      setAttendanceRecords(sortedRecords);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const uniqueCourses = [...new Set(attendanceRecords.map(record => record.courseCode))];
  
  const filteredRecords = selectedCourse === 'all' 
    ? attendanceRecords 
    : attendanceRecords.filter(record => record.courseCode === selectedCourse);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          📊 Attendance History
        </h2>
        
        {uniqueCourses.length > 0 && (
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Courses</option>
            {uniqueCourses.map(courseCode => (
              <option key={courseCode} value={courseCode}>
                {courseCode}
              </option>
            ))}
          </select>
        )}
      </div>

      {filteredRecords.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
          <p className="text-gray-600">
            You haven't submitted any attendance yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {record.courseCode}
                    </div>
                    <div className="text-sm text-gray-500">
                      {record.courseName || 'Course Name'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      ✓ {record.status || 'Present'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.time || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.method || 'Self Check-In'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-4 text-sm text-gray-500 text-center">
            Showing {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
