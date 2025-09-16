import React from "react";

export default function ReportHeader({
  course,
  teacherName,
  onExport,
  onPrint,
  onBack,
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="mb-2">
            <span className="inline-block bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
              Attendance Report
            </span>
            {course?.section && (
              <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full ml-2">
                Section {course.section}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {course?.courseCode} {course?.courseCode && " - "}{" "}
            {course?.courseName}
          </h1>
          <p className="text-gray-600">
            <span className="font-medium">{course?.university}</span>
            {course?.semester && <span> • {course.semester}</span>}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Teacher: {course?.teacherName || teacherName || "N/A"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <span className="mr-2">📊</span> Export to Excel
          </button>
          <button
            onClick={onPrint}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <span className="mr-2">🖨️</span> Print Report
          </button>
          <button
            onClick={onBack}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
