import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const CourseAttendance = ({ enrollment }) => {
  const { user } = useAuth();
  const [attendanceStatus, setAttendanceStatus] = useState('checking');
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);

  useEffect(() => {
    checkTodayAttendance();
  }, [enrollment.id]);

  const checkTodayAttendance = async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('studentEmail', '==', user.email),
        where('courseCode', '==', enrollment.courseCode),
        where('date', '==', todayStr)
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      if (!attendanceSnapshot.empty) {
        const attendanceData = attendanceSnapshot.docs[0].data();
        setAttendanceStatus('submitted');
        console.log('Attendance already submitted:', attendanceData);
      } else {
        setAttendanceStatus('available');
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
      setAttendanceStatus('available');
    }
  };

  const enableGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setGpsEnabled(true);
        },
        (error) => {
          console.error('GPS Error:', error);
          alert('Unable to get your location. Please enable GPS and try again.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const submitAttendance = async () => {
    if (!location) {
      alert('Please enable GPS access first.');
      return;
    }

    setSubmitting(true);

    try {
      const today = new Date();
      const attendanceData = {
        studentEmail: user.email,
        studentName: user.displayName || user.email,
        courseCode: enrollment.courseCode,
        courseName: enrollment.courseName || enrollment.courseCode,
        teacherEmail: enrollment.teacherEmail,
        section: enrollment.section,
        semester: enrollment.semester,
        year: enrollment.year,
        university: enrollment.university,
        date: today.toISOString().split('T')[0],
        time: today.toLocaleTimeString(),
        timestamp: serverTimestamp(),
        status: 'present',
        method: 'Self Check-In',
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        }
      };

      await addDoc(collection(db, 'attendance'), attendanceData);
      
      console.log('Attendance submitted:', attendanceData);
      setAttendanceStatus('submitted');
      
      alert('Attendance submitted successfully!');
    } catch (error) {
      console.error('Error submitting attendance:', error);
      alert('Error submitting attendance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (attendanceStatus === 'checking') {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-gray-600">Checking attendance status...</span>
        </div>
      </div>
    );
  }

  if (attendanceStatus === 'submitted') {
    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-medium text-green-800">✓ Present</h4>
            <p className="text-sm text-green-600">Attendance already submitted today</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h4 className="font-medium text-blue-800">Today's Attendance</h4>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          Available
        </span>
      </div>

      <p className="text-sm text-blue-600 mb-4">
        Attendance window is open
      </p>

      {!gpsEnabled ? (
        <button
          onClick={enableGPS}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Enable GPS Access
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center text-sm text-green-600">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            GPS location acquired
          </div>
          <button
            onClick={submitAttendance}
            disabled={submitting}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Attendance'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseAttendance;
