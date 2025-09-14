# Copilot Instructions for classAttend

## Project Overview
- **Framework:** React (with Vite for build/dev), Firebase (Firestore), Tailwind CSS
- **Structure:**
  - `src/` contains all app code, organized by `components/`, `pages/`, `layouts/`, `context/`, `routes/`, and `utils/`.
  - `firebase.js` sets up Firebase/Firestore integration.
  - `public/` for static assets, `docs/` for data samples and schema.

## Key Patterns & Conventions
- **Component Structure:**
  - Use functional React components. Most UI logic is in `components/` and `pages/`.
  - Layouts (e.g., `AdminLayout.jsx`, `AdminMainArea.jsx`) wrap pages and provide dashboard structure.
- **Data Access:**
  - All Firestore access is via the `firebase.js` export (`db`).
  - Use `firebase/firestore` methods (`collection`, `query`, `where`, `getDocs`, etc.) for CRUD.
  - Example: See `AdminMainArea.jsx` for dashboard stats queries.
- **State Management:**
  - Use React context for global state (see `context/`).
  - Local state via `useState`/`useEffect`.
- **Styling:**
  - Tailwind CSS is used throughout. Use utility classes, avoid custom CSS unless necessary.
- **Routing:**
  - React Router v6. Route guards in `routes/` (e.g., `AdminRoute.jsx`).
- **Modals & UI Patterns:**
  - Modals and admin utilities are in `components/` and use context for open/close state.

## Developer Workflows
- **Start Dev Server:**
  - `npm run dev` (Vite, hot reload)
- **Build:**
  - `npm run build`
- **Lint:**
  - `npm run lint` (uses ESLint config)
- **Firebase:**
  - Service account and config in `serviceAccountKey.json` and `firebase.js`.
  - Firestore schema/data samples in `docs/`.

## Project-Specific Notes
- **Admin Dashboard:**
  - Dashboard stats are aggregated from Firestore (see `AdminMainArea.jsx`).
  - Teacher/student/course management in `components/` and `pages/`.
- **Data Validation:**
  - Utilities for attendance and CSV validation in `utils/`.
- **Sensitive Data:**
  - Do not commit or expose `serviceAccountKey.json`.

## Integration Points
- **Firebase:** All backend data is in Firestore. No custom backend server.
- **Vite:** Handles build/dev, config in `vite.config.js`.
- **Tailwind:** Config in `tailwind.config.js`.

## Examples
- **Querying Firestore:**
  ```js
  import { collection, query, where, getDocs } from "firebase/firestore";
  import { db } from "../firebase";
  // ...
  const q = query(collection(db, "users"), where("role", "==", "teacher"));
  const snap = await getDocs(q);
  ```
- **Component Layout:**
  ```jsx
  <AdminMainArea topSection={...}>{children}</AdminMainArea>
  ```

---
For more details, see `README.md`, `src/firebase.js`, and `docs/`.
