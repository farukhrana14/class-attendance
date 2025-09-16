Step-by-step refactor plan (no DB field changes)
Step 1 — Extract a data hook

Create a single hook that hides all Firestore logic and normalizes data so the component becomes dumb.

File: src/hooks/useCourseAttendance.js

useCourseAttendance(courseId, { dateISO })

Returns: { course, students, dates, records, loading, error }

Students are derived from attendance docs (email/name), so the table shows only real attendees.

Normalizes date (timestamp or string) to YYYY-MM-DD.

Keeps field names exactly as-is in Firestore (no writes, no renames).

Step 2 — Presentational table

Pure UI component that renders a grid given props; no Firestore or side effects.

File: src/components/attendance/AttendanceTable.jsx

Props: { students, dates, records }

Builds cells by matching (student.email|id, date) to a record.

Small StatusBadge inside for coloring.

Step 3 — Report header

Move the header (course info + buttons) out so the page is composable.

File: src/components/attendance/ReportHeader.jsx

Props: { course, teacherName, onExport, onPrint, onBack }

Uses the same Tailwind look you already have.

Step 4 — Utilities (no UI)

Move the heavy functions out of the component.

File: src/utils/attendanceExport.js

exportAttendanceToExcel({ course, students, dates, records })

File: src/utils/attendancePrint.js

printAttendance({ course, teacherName, students, dates, records })

Uses the “safe” HTML template you’re on now.

Step 5 — Thin page component

CourseAttendanceReport.jsx becomes a tiny orchestrator:

Reads courseId + optional ?date=YYYY-MM-DD.

Calls useCourseAttendance.

Renders <ReportHeader/> and <AttendanceTable/>.

Wires buttons to exportAttendanceToExcel() and printAttendance().

Step 6 — Reuse existing modals

Replace the local “Message Modal” with the shared BaseModal/Success/Error you already keep in TeacherDashboard (or keep local for now, swap in Step 7).

Step 7 — Perf + polish (optional)

Build a Map keyed by ${email}__${date} for O(1) cell lookup (no .find per cell).

Memoize derived maps with useMemo.

Add navigate(-1) fallback for “Back to Reports” if a direct link was used.

If classes get huge, consider row virtualization later.

Refactor: Course Attendance Report (Teacher)

Scope: Make CourseAttendanceReport small, testable, and fast by moving data fetching/normalization into a hook, splitting UI into small components, and reusing our existing utilities — without changing any Firestore fields.

Status: Plan
Invariant: Do not change/remove/rename/add DB fields.

Why refactor?

Problems today

One large component owns fetching, data shaping, export, print, UI, and modals.

Hard to reason about (lots of state, many concerns mixed).

Every render recomputes lookups with Array.find inside table cells.

Goals

Keep Firestore schema untouched.

Encapsulate all read logic & normalization.

Thin page component + clear props.

O(1) cell lookup in the table.

Reuse existing modal primitives later.

Testing & QA checklist

Route /teacher/courses/:courseId/reports renders with sidebar.

With ?date=YYYY-MM-DD shows only that date’s column (table can still support multi-date; this filter affects hook status mapping).

Students list shows only real students from attendance docs (teacher never shown).

Status pills: Present/Late/Absent/Sick colors correct.

Export: file name format ${courseCode}\_Attendance_YYYY-MM-DD.xlsx.

Print: opens a new tab, prints, closes after a few seconds.

No console errors or React key warnings.

Large classes (40+ students) scroll smoothly (recordMap = O(1) lookup).

Performance notes

recordMap avoids Array.find per cell.

Expensive derivations are wrapped in useMemo.

If tables exceed thousands of rows, consider row virtualization later (not needed now).

Future ideas (optional)

Date range controls (from / to) → filter by documentId prefix ranges.

CSV export (in addition to XLSX).

Column summary (per date: present %, absent count).

Reuse global modal system (BaseModal) instead of local.

Summary

This refactor keeps the Firestore schema untouched, adds a clean data hook, separates presentation into small components, and optimizes the table with O(1) lookups. Each “student” object you render now includes the fields you requested — status (per date), name, id, email — without writing anything back to the DB.
