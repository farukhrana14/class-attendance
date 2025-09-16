// src/utils/attendanceExportExcel.js
import * as XLSX from "xlsx";

const toKey = (s) => (s || "").trim().toLowerCase();

const formatDate = (s) => {
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return s;
  }
};

export function exportAttendanceToExcel({ course, students, dates, records }) {
  // Build fast lookup: email/id -> date -> status
  const map = new Map();
  for (const r of records || []) {
    const key = toKey(r.studentId);
    if (!key || !r.date) continue;
    if (!map.has(key)) map.set(key, new Map());
    map.get(key).set(r.date, r.status || "N/A");
  }

  const wsData = [];
  const headers = ["Student ID", "Student Name", "Email", "Section"];
  (dates || []).forEach((d) => headers.push(formatDate(d)));
  wsData.push(headers);

  (students || []).forEach((s) => {
    const key = toKey(s.email || s.id);
    const row = [
      s.studentId || s.id || s.email || "N/A",
      s.name || "",
      s.email || "",
      s.section || "",
    ];
    (dates || []).forEach((d) => {
      const status = map.get(key)?.get(d) ?? "N/A";
      row.push(status);
    });
    wsData.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");

  const fileName = `${course?.courseCode || "Course"}_Attendance_${
    new Date().toISOString().split("T")[0]
  }.xlsx`;

  XLSX.writeFile(wb, fileName);
}
