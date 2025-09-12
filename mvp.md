# ClassAttend — MVP

## 🔌 Bot Integration (Telegram Primary, WhatsApp Secondar## 🔌 Implementation Strategy:
- Dual-bot system with Telegram as the flagship intelligent assistant
- Advanced machine learning integration for Telegram bot training
- Comprehensive data collection and analytics dashboard
- Regular bot training updates based on user interaction patterns
- Seamless backend integration for attendance recording across both platforms

### Telegram Bot Strategy (Primary for Attendance)
**Attendance Process:**
- classAttend app initiates message to students 10 minutes after class begins (with teacher approval)
- Students reply to the bot message
- Bot captures all necessary attendance data from the reply
- **Advantage**: Both outgoing (app→student) and incoming (student→app) messages are FREE
- **Result**: Telegram will be the primary attendance method due to cost efficiency

**Advanced AI Support Features:**
- **Intelligent 24/7 Assistance**: AI-trained bot provides comprehensive support for app settings, installation procedures, removal processes, editing functions, and updates
- **Interactive Troubleshooting**: Step-by-step guidance for complex technical issues
- **User Experience Analytics**: All support interactions are captured and analyzed to identify common pain points and user difficulties
- **Continuous Improvement Loop**: Support data drives targeted app improvements, UI/UX enhancements, and feature updates
- **Proactive Issue Resolution**: Bot learns from user patterns to provide preemptive solutions and prevent recurring problems

### WhatsApp Bot Strategy (Secondary/Alternative)
**Attendance Process:**
- Students in class send "attendance" message to the WhatsApp bot
- App records the attendance and replies confirming "attendance recorded"
- **Limitation**: System-initiated messages (app→student) are NOT free
- **Result**: WhatsApp used as alternative method, student-initiated only

**Support Features:**
- Basic FAQ responses
- Installation guidance
- User support (limited compared to Telegram due to cost constraints)

### Key Differences:
1. **Telegram**: App can initiate attendance messages (FREE both ways) + Advanced AI support
2. **WhatsApp**: Students must initiate attendance messages (outgoing costs money) + Basic support
3. **Primary Method**: Telegram due to cost efficiency and superior support capabilities
4. **Secondary Method**: WhatsApp for user preference/backup

#### Example Bot Interactions:
```
User: "How do I install the app?"
Bot: "To install the class-attendance PWA, open the app in your browser, tap the menu (⋮), and select 'Add to Home Screen'. [See screenshots here]"

User: "I can't find the check-in button."
Bot: "Make sure you are logged in as a student. Then, open your dashboard and look for the 'Check-In' card. If you still have issues, let me know!"
```

#### Implementation Benefits:
| Feature | Value |
|---------|-------|
| Automated FAQ | Reduces support load |
| Usage Analytics | Guides product improvements |
| Easy for users | Answers right inside Telegram |
| Data-driven UX decisions | Focus on real pain points |
| Cost Efficiency | Free messaging in both directions |

#### Technical Implementation:
- Use BotFather on Telegram to create bot and get API token
- Backend with Node.js/Python to connect to Telegram Bot API
- Advanced NLP and machine learning for intelligent support
- Firebase/database logging for user queries and analytics
- Feedback loop to continuously improve bot responses 🎯 Goal
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
