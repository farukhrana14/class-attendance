// src/components/AttendanceTable.jsx
import React from "react";
import StatusBadge from "./StatusBadge";

// local helper to build the lookup key
const keyOf = (emailOrId) => (emailOrId || "").trim().toLowerCase();

export default function AttendanceTable({
  students = [],
  dates = [],
  recordMap,
}) {
  const hasRows = students.length > 0 && dates.length > 0;

  if (!hasRows) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          No attendance records found for this course
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Take attendance first to see records here
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Student ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            {dates.map((d) => (
              <th
                key={d}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                title={d}
              >
                {new Date(d).toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {students.map((s) => {
            const emailKey = keyOf(s.email || s.id);
            return (
              <tr key={s.email || s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {s.studentId || s.id || s.email || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {s.name || s.email}
                </td>

                {dates.map((d) => {
                  const cellStatus =
                    recordMap?.get(`${emailKey}__${d}`) || "N/A";
                  return (
                    <td
                      key={`${emailKey}-${d}`}
                      className="px-6 py-4 whitespace-nowrap text-sm"
                    >
                      <StatusBadge status={cellStatus} />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
