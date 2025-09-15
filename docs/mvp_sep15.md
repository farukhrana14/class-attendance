# MVP Progress - September 15, 2025

## Key Features Implemented

## Recent Refactors & Improvements

## Developer Workflows

## Next Steps

---

🔑 Core Idea

A PWA attendance system built with React + Firebase. It supports three roles:

Students → self-check-in, view own attendance.

Teachers → create/manage courses, rosters, and take attendance.

Admins → manage teachers/students, limited CRUD.

📊 Data Flow

```text
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
[attendance/{courseId}_{dateId}_{studentEmail}] saved

Student Dashboard --> reads own attendance
Teacher Dashboard --> reads/exports attendance
Admin Dashboard  --> manage teachers/students (protected)
```

Firestore schema examples:

users/{email}: role, name, orgType, courses

courses/{courseId}: code, title, university, section, semester, teacherEmails

rosters/{courseId}/students/{studentEmail}: name, studentId

pendingStudents/{autoId}: new student waiting for approval

attendance/{courseId}_{dateId}_{studentEmail}: status, timestamp, mode, gps

🧭 Workflow

1. Onboarding

Student signs in → checks if in roster.

If not, they go into pendingStudents until approved.

Teacher signs in → can create course and upload/add roster.

Admin manages approvals and roles.

2. Course & Roster Management

Teachers create courses (courses collection).

Students added via roster upload (CSV/Excel) or manual entry (rosters subcollection).

Admin can adjust teachers/students directly.

3. Attendance Modes

Self Check-in:

Student selects course & section, validates GPS/time window, and submits.

Firestore writes attendance with mode: "self-checkin".

Roll Call:

Teacher marks present/late/absent in UI.

Firestore writes attendance with mode: "rollcall".

4. Dashboards

Student Dashboard: sees only own attendance.

Teacher Dashboard: manages courses, exports attendance.

Admin Dashboard: aggregates system stats (pending approvals, total counts).

🔒 Security

Students: can only read/write their own attendance.

Teachers: manage only their own courses & rosters.

Admins: full access, controlled by Firestore rules
