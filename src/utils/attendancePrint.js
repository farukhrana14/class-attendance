// src/utils/attendancePrint.js

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

const statusCell = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "present") return { short: "P", cls: "present" };
  if (s === "late")    return { short: "L", cls: "late" };
  if (s === "absent")  return { short: "A", cls: "absent" };
  if (s === "sick")    return { short: "S", cls: "sick" };
  return { short: "", cls: "" };
};

const toKey = (v) => (v || "").trim().toLowerCase();

/**
 * printAttendance({ course, teacherName, students, dates, records })
 * - students: [{ studentId?, id?, email, name, section? }, ...]
 * - dates: ["YYYY-MM-DD", ...]
 * - records: [{ studentId(email), date:"YYYY-MM-DD", status }, ...]
 */
export function printAttendance({ course, teacherName, students, dates, records }) {
  let win = null;
  try {
    win = window.open("", "_blank");
    if (!win) {
      alert("Pop-up blocked. Please allow pop-ups and try again.");
      return;
    }

    const allDates = (dates && dates.length)
      ? dates
      : [new Date().toISOString().split("T")[0]];

    // Build lookup for O(1) cell rendering
    const map = new Map(); // key = email(id) -> date -> status
    for (const r of records || []) {
      const k = toKey(r.studentId);
      if (!k || !r.date) continue;
      if (!map.has(k)) map.set(k, new Map());
      map.get(k).set(r.date, r.status || "N/A");
    }

    const dateHeaderHtml = allDates
      .map((d) => `<th class="date-header">${formatDate(d)}</th>`)
      .join("");

    const rowsHtml = (students || []).map((s) => {
      const key = toKey(s.email || s.id);
      const idText = s.studentId || s.id || s.email || "N/A";
      const nameText = s.name || "";

      const cells = allDates.map((d) => {
        const status = map.get(key)?.get(d) ?? "";
        const { short, cls } = statusCell(status);
        return `<td class="${cls}">${short}</td>`;
      }).join("");

      return `<tr>
        <td class="student-id">${idText}</td>
        <td class="student-name">${nameText}</td>
        ${cells}
      </tr>`;
    }).join("");

    const today = new Date().toISOString().split("T")[0];
    const suggestedFilename = `${course?.courseCode || "Course"}_ClassAttendance_${today}`;

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${suggestedFilename}</title>
  <meta name="filename" content="${suggestedFilename}.pdf">
  <meta name="description" content="Attendance report for ${course?.courseCode || "Course"} - ${course?.courseName || ""} - ${today}">
  <style>
    @page { size: landscape; margin: 10mm; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
    h1 { font-size: 16px; margin-bottom: 5px; }
    .details { margin-bottom: 10px; }
    .details p { margin: 3px 0; font-size: 12px; }
    table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 7px; table-layout: fixed; }
    th, td { border: 1px solid #ddd; padding: 2px 3px; text-align: center; font-size: 7px; max-width: 16px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .student-name { text-align: left; width: 90px; max-width: 90px; }
    .student-id { text-align: left; width: 50px; max-width: 50px; }
    th { background-color: #f2f2f2; position: sticky; top: 0; }
    .date-header { writing-mode: vertical-rl; transform: rotate(180deg); height: 80px; vertical-align: bottom; text-align: left; font-size: 8px; font-weight: normal; }
    .present { background-color: #d1fae5; }
    .late { background-color: #fef3c7; }
    .absent { background-color: #fee2e2; }
    .sick { background-color: #dbeafe; }
    .print-summary { margin-top: 15px; font-size: 12px; }
    .print-footer { margin-top: 15px; text-align: center; font-size: 10px; color: #666; }
  </style>
</head>
<body>
  <h1>Attendance Report</h1>
  <div class="details">
    <p><strong>Course:</strong> ${course?.courseCode || ""} - ${course?.courseName || ""}</p>
    <p><strong>Section:</strong> ${course?.section || "N/A"} | <strong>University:</strong> ${course?.university || "N/A"} | <strong>Semester:</strong> ${course?.semester || ""}</p>
    <p><strong>Teacher:</strong> ${course?.teacherName || teacherName || "N/A"} | <strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th style="min-width:60px;">Student ID</th>
        <th style="min-width:100px;">Student Name</th>
        ${dateHeaderHtml}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="print-summary">
    <p><strong>Total Students:</strong> ${(students || []).length}</p>
    <p><strong>Total Classes:</strong> ${allDates.length}</p>
    <p><strong>Actual Attendance Records:</strong> ${(dates || []).length} days</p>
  </div>

  <div class="print-footer">Generated by ClassAttend - ${new Date().toLocaleDateString()}</div>

  <script>
    setTimeout(function(){ try { window.print(); } catch(e){} }, 200);
    setTimeout(function(){ try { window.close(); } catch(e){} }, 7000);
  </script>
</body>
</html>`);
    win.document.close();
  } catch (err) {
    console.error("Print error:", err);
    if (win && !win.closed) try { win.close(); } catch {}
    alert("Failed to generate printable report.");
  }
}
