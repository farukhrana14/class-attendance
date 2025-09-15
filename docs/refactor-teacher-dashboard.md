/docs/naming-map.md

# Teacher Dashboard Refactor Plan

## Execution Plan (To-Do Checklist)

### Step 1 — Lock canonical attendance component

- [ ] Confirm `RollCall` is the only teacher-side attendance marking tool (Present/Absent/Late).
- [ ] Relegate `CourseAttendance` to student-side self check-in only.
- [ ] Update routes to point teachers to `.../courses/:courseId/rollcall`.

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

- [ ] Create `/routes/TeacherRoutes.jsx`.
- [ ] Move all `<Route>` definitions from `TeacherDashboard.jsx` into `TeacherRoutes.jsx`.
- [ ] Keep only `<Outlet />` in `TeacherDashboard` (or move to `TeacherLayout`).

### Step 7 — Protected routing

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
