# ClassAttend — MVP

## 🎯 Goal
Build a PWA attendance app (React + Firebase) for schools/training with two core modes:
1. **Student self check-in** (time window, optional GPS)
2. **Teacher roll call** (present/absent/late)

## 👥 User Roles
- **Student**: Google sign-in, self-register if not on roster, check own attendance.
- **Teacher**: Create courses, upload roster (now or later), take attendance.
- **Admin**: Minimal CRUD for teachers/students, protected access.

## 🔑 Onboarding
- Google Sign-In → fetch/create `users/{email}`.
- **Student first-time**: If not in roster, prompt for Name, Course Code, University, Section → save to `pendingStudents`.
- **Teacher first-time**: Create course (Course Name, Code, University, Section, Semester), option to upload roster later.

## 🧭 Attendance Flow
- **Teacher chooses mode per session:**
  - Self check-in: Students use link within time window (optional GPS).
  - Roll call: Teacher marks Present/Absent/Late in UI.
- One attendance doc per student per session.

## 🔌 WhatsApp (MVP basic)
- User-initiated: Students send “attendance” to app’s WhatsApp; app replies with link/confirmation (logs timestamp/GPS if link opens app).

## 🗂 Firestore Collections & Schemas
- `users/{email}`: role, name, orgType, courses
- `courses/{courseId}`: code, title, university, section, semester, teacherEmails, rosterUploaded, geofence
- `rosters/{courseId}/students/{studentEmail}`: name, studentId
- `pendingStudents/{autoId}`: name, email, courseCode, university, section, status
- `attendance/{courseId}/{dateId}/{studentEmail}`: status, ts, mode, gps

## 🔄 Data Flow
```
[Student] --Google Sign-In--> [Auth] --> [Firestore users/{email}]
   | if not in roster
   v
[Pending Student Form] --> [pendingStudents]

[Teacher] --Google Sign-In--> [Auth] --> [Firestore users/{email}]
   |
   v
[Create Course] --> [courses/{courseId}] (upload roster now or later)

[Take Attendance] --> (Self check-in) or (Roll call)
   v
[attendance/{courseId}/{dateId}/{studentEmail}] saved

Student Dashboard --> reads own attendance
Teacher Dashboard --> reads/exports attendance
Admin Dashboard  --> manage teachers/students (protected)
```

## 🧭 Routes (example)
- `/` → Home (role router)
- `/teacher` → dashboard
- `/teacher/courses/:courseId/rollcall`
- `/student` → my attendance
- `/admin/teachers` → protected
- `/checkin` → self check-in endpoint (validates window/geofence)
- `/not-allowed`

## 🔒 Security
- Students: read/write only their attendance.
- Teachers: manage attendance/roster for their courses.
- Admin: full control (enforced in Firestore rules).

## 📦 Stack
- React (Vite), Tailwind, React Router
- Firebase Auth (Google)
- Firestore
- PWA (manifest + service worker)

## 🧪 Engineering Setup
- ESLint with type-aware rules (`eslint-plugin-jsdoc`, `eslint-plugin-import`), lint script for `src/**/*.js,jsx`.
- CI (later): lint, unit tests (Vitest/Jest), build check on PRs.
