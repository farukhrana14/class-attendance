# Naming Map — Class Attendance App

This map lists existing components, pages, hooks, and routes to prevent conflicts and duplication during refactor.

---

## Pages (`src/pages/`)

- **TeacherDashboard.jsx** → main teacher UI (currently large, to be slimmed)
- **StudentHome.jsx / StudentHomeNew.jsx** → student landing pages
- **AdminMainArea.jsx** → admin dashboard entry
- **PendingEnrollmentsManagement.jsx**
- **PendingStudentsManagement.jsx**
- **CourseCreation.jsx**
- **AddStudents.jsx**
- **CourseDetails.jsx**
- **CourseAttendanceReport.jsx**

---

## Components (`src/components/`)

- **RollCall.jsx** → latest canonical teacher attendance (with CourseHeader, RosterList, AttendanceSummary, MessageModal inside)
- **CourseAttendance.jsx** → older attendance flow, now mainly student-facing
- **AttendanceHistory.jsx** → shows past records (status: review use/unused)
- **attendanceValidation.js** → helper for validating entries
- **attendanceQuery.js** → Firestore query helpers (attendance data)
- **CourseHeader.jsx** (extracted from RollCall)
- **RosterList.jsx** (extracted from RollCall)
- **AttendanceSummary.jsx** (extracted from RollCall)
- **MessageModal.jsx** (extracted from RollCall)

---

## Routes (`src/routes/`)

- **AdminRoute.jsx** (role guard)
- **StudentRoute.jsx**
- **StudentAdminRoute.jsx**
- _(Planned)_: **TeacherRoute.jsx**
- _(Planned)_: **TeacherRoutes.jsx** (to hold all teacher `<Route>` declarations)

---

## Hooks (`src/hooks/`)

- **useAuth.js** (context/provider for auth)
- _(Planned)_: **useUserDoc.js** (Firestore user doc subscription)
- _(Planned)_: **useTeacherCourses.js** (subscribe to teacher’s courses)
- _(Planned)_: **useCourseRoster.js** (subscribe to students of a course)
- _(Planned)_: **useModal.js** (central modal state management)

---

## Config (`src/config/`)

- _(Planned)_: **teacherNav.js** (central sidebar items for teacher)
- _(Later)_: **studentNav.js**, **adminNav.js** if needed

---

## Layouts (`src/layout/`) — _(to be added)_

- **TeacherLayout.jsx** → sidebar + outlet
- **StudentLayout.jsx**
- **AdminLayout.jsx**

---

## Notes

- **Canonical attendance component** = `RollCall` (teacher).
- **CourseAttendance** stays for student check-in.
- Inline modals inside TeacherDashboard will be migrated to `/components/modals/`.
- Protect naming consistency: do not reuse `Dashboard` without role prefix.
- Keep routes in `/routes/` not inside pages after refactor.
