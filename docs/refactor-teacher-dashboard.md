/docs/naming-map.md

# Teacher Dashboard Refactor Plan

## Execution Plan (To-Do Checklist)

> Temporary: access control modals removed from TeacherDashboard.  
> Will reintroduce via TeacherRoute in Step 7 (protected routing).

### Step 1 — Lock canonical attendance component

- [ ] Confirm `RollCall` is the only teacher-side attendance marking tool (Present/Absent/Late).
- [ ] Relegate `CourseAttendance` to student-side self check-in only.
- [ ] Update routes to point teachers to `.../courses/:courseId/rollcall`.

Refactor Plan: Teacher Dashboard & Course Enrollment
Background

Currently, our project relies heavily on the enrolledCourses (a.k.a. enlistedCourses) array field in users documents. This array is used in multiple components:

RollCall.jsx

AddStudents.jsx

TeacherDashboard.jsx

StudentHome.jsx / StudentHomeNew.jsx

RosterManagement.jsx

CourseCreation.jsx

AdminStudentManagement.jsx

The pattern has worked so far but introduces scaling issues and redundancy:

Enrollment data is duplicated between users and courses.

Queries like where("enrolledCourses.courseId", "==", courseId) are inefficient and limited by Firestore constraints.

Per-student details (section, status, etc.) don’t belong inside a user’s enrolledCourses array.

Migration Plan

We will gradually migrate enrollment management away from enrolledCourses and into a more scalable structure:

New path:

courses/{courseId}/students/{studentEmail}

Each student becomes a document under the students subcollection.

Document fields include name, studentId, email, status, semester, year, university.

This aligns with how RosterManagement.jsx and attendance flows already work.

Users will still keep their base profile (role, status, etc.), but not redundant course rosters.

Steps

Phase 1 (Transition)

Continue writing to both places: users/{email}/enrolledCourses and courses/{courseId}/students/{email}.

This ensures backward compatibility while we update consuming components.

Phase 2 (Component Updates)

Update AddStudents.jsx to write into courses/{courseId}/students.

Update RosterManagement.jsx and Student Management CRUD by teachers to fetch from courses/{courseId}/students.

Add consistency checks between users.enrolledCourses and courses/{courseId}/students.

Phase 3 (Deprecation)

Once all consuming components are switched over, remove enrolledCourses from the users schema.

Clean up queries in TeacherDashboard.jsx, StudentHome.jsx, and AdminStudentManagement.jsx.

TODO

Add migration logic in AddStudents.jsx to write to both users.enrolledCourses and courses/{courseId}/students.

Update AddStudents.jsx and Student Management CRUD by teachers to rely on courses/{courseId}/students path for all future operations.

Start refactoring RollCall.jsx to use the new courses/{courseId}/students path instead of userData.enlistedCourses.

### Step 2 — Write naming map

- [ ] Inventory all current components/pages/hooks (CourseDetails, CourseAttendanceReport, CourseCreation, AddStudents, StudentEnrollments).
- [ ] Inventory existing route guards (AdminRoute, StudentRoute, StudentAdminRoute).
- [ ] Add new planned names (TeacherSidebar, TeacherCoursesList, TeacherLayout, TeacherRoutes, BaseModal, ConfirmModal, SuccessModal, LoadingModal).
- [ ] Save the naming map in `/docs/dev-notes.md`.

### Step 3 — Extract modal system

- [ ] Move `MessageModal` (already used in RollCall) into `/components/modals/MessageModal.jsx`.
- [ ] Create `BaseModal.jsx` under `/components/modals/`.
- [ ] Add wrappers: `ConfirmModal.jsx`, `SuccessModal.jsx`, `LoadingModal.jsx`.
- [ ] Replace inline modals in `TeacherDashboard.jsx` with these imports.

### Step 4 — Create custom hooks

- [ ] Add `/hooks/useUserDoc.js` (subscribes to `users/{email}`).
- [ ] Add `/hooks/useTeacherCourses.js` (subscribes to teacher’s courses).
- [ ] Add `/hooks/useCourseRoster.js` (optional later, for student rosters).
- [ ] Replace `useEffect` Firestore logic in `TeacherDashboard.jsx` with hooks.

### Step 5 — Split layout elements

- [ ] Create `/components/TeacherSidebar.jsx` (user info, nav, sign out).
- [ ] Create `/components/TeacherCoursesList.jsx` (cards, skeletons, empty state).
- [ ] Remove these chunks from `TeacherDashboard.jsx`.

### Step 6 — Teacher routes

- [ ] Add `/teacher/roll-call` route that renders `RollCallLauncher` for direct daily access.
- [ ] Create `/routes/TeacherRoutes.jsx`.
- [ ] Move all `<Route>` definitions from `TeacherDashboard.jsx` into `TeacherRoutes.jsx`.
- [ ] Keep only `<Outlet />` in `TeacherDashboard` (or move to `TeacherLayout`).
      Notes
  > `RollCallLauncher` queries courses by `teacherId == user.email` and either:
  >
  > - auto-forwards to RollCall if only 1 course, or
  > - shows a course picker if multiple courses.

### Step 7 — Protected routing

> Temporary: access control modals removed from TeacherDashboard.  
> Will reintroduce via TeacherRoute in Step 7 (protected routing).

- [ ] Create `TeacherRoute.jsx` guard (similar to `AdminRoute`, `StudentRoute`).
- [ ] Place all role-based guards (`AdminRoute`, `StudentRoute`, `TeacherRoute`) under `/routes/`.
- [ ] Ensure dashboards only render if the guard passes.

### Step 8 — Reusable layouts

- [ ] Create `/layout/TeacherLayout.jsx` with sidebar + `<Outlet />`.
- [ ] Create `/layout/StudentLayout.jsx`.
- [ ] Create `/layout/AdminLayout.jsx`.
- [ ] Update routes to wrap pages with these layouts.

### Step 9 — Navigation alignment

- [ ] Verify sidebar items in `TeacherSidebar` match real routes.
- [ ] Remove/replace `/teacher/roll-call` with `/teacher/courses/:courseId/rollcall`.

### Step 10 — Error boundaries

- [ ] Create `/components/common/ErrorBoundary.jsx`.
- [ ] Wrap `TeacherRoutes` in it.
- [ ] Wrap `RollCall` in it.

### Step 11 — Config for sidebar

- [ ] Create `/config/teacherNav.js` with `{ name, path, icon }[]`.
- [ ] Import it inside `TeacherSidebar`.

### Step 12 — Modal helper

- [ ] Add `/hooks/useModal.js` that returns `{ open, type, title, message, openModal, closeModal }`.
- [ ] Use it in `TeacherDashboard` and `RollCall`.

### Step 13 — Lint and format

- [ ] Run `npm run lint` or `yarn lint` on updated files.
- [ ] Run Prettier for formatting.

### Step 14 — Documentation

- [ ] Update `/docs/dev-notes.md` with:
  - Component boundaries.
  - Hook APIs.
  - Route table for teacher/student/admin.
  - Sidebar config reference.

---

## Strategy (Why + What)

### Canonical attendance component

Keep `RollCall` as the final teacher-side component. It’s the most recent, modularized, and supports saving Present/Absent/Late. `CourseAttendance` remains for student check-ins only. This avoids duplicated logic.

### Naming map

A consistent naming system prevents clashes. Document existing and new names so future devs don’t accidentally overwrite or duplicate components.

### Modal system

Currently `TeacherDashboard` has inline confirm, success, and deleting modals. Extracting them into a modal system (using `MessageModal` as a base) reduces repetition and keeps code DRY.

### Custom hooks

Firestore logic is scattered in effects. Moving it into `useTeacherCourses`, `useUserDoc`, and `useCourseRoster` keeps pages slim and logic reusable. No DB schema changes.

### Split layout elements

Sidebar and courses list make `TeacherDashboard` huge. Splitting them into `TeacherSidebar` and `TeacherCoursesList` keeps the dashboard lightweight.

### Teacher routes

Move `<Route>` definitions into `TeacherRoutes.jsx`. This declutters `TeacherDashboard` and makes routes easier to maintain.

### Protected routing

Centralize all role-based access checks in `/routes/`. This keeps dashboards focused on UI, while guards handle permissions.

### Reusable layouts

Layouts under `/layout/` (TeacherLayout, StudentLayout, AdminLayout) let you reuse navigation structures without duplicating sidebar code in every page.

### Navigation alignment

Avoid dead links. Ensure RollCall is always accessed under `/courses/:courseId/rollcall` per the MVP schema.

### Error boundaries

Catch crashes in RollCall and other teacher pages. Improves resilience during refactors.

### Config for sidebar

Move sidebar items into `/config/teacherNav.js`. This centralizes navigation, making it testable and easier to update.

### Modal helper

A `useModal()` hook makes opening/closing modals consistent and less verbose across all dashboards.

### Lint and format

Ensures code style consistency across the refactor. Prevents errors sneaking in from JSX shifts.

### Documentation

Final step: update `/docs/dev-notes.md` with component map, hook APIs, and route table so future work is smooth.

---

## See Also

- [Naming Map](naming-map.md) — list of components, hooks, routes.
- [Visual Route Tree](visual_route_tree.md) — diagram and textual navigation tree.

---
