// src/hooks/useCourseAttendance.js
// READ-ONLY hook. Does not change/remove/rename/add any Firestore fields.

import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  startAt,
  endAt,
  documentId,
} from "firebase/firestore";

// ---- helpers (pure) ----
const toKey = (s) => (s || "").trim().toLowerCase();

const normalizeDate = (val) => {
  // Accepts Firestore Timestamp or ISO/string
  if (!val) return "";
  const d = typeof val?.toDate === "function" ? val.toDate() : new Date(val);
  return d instanceof Date && !isNaN(d) ? d.toISOString().split("T")[0] : String(val);
};

const toDateId = (iso) => (iso || "").replaceAll("-", ""); // "2025-09-16" -> "20250916"

/**
 * useCourseAttendance
 * @param {string} courseId
 * @param {{ dateISO?: string }} opts  optional ?date=YYYY-MM-DD filter (by docId prefix)
 *
 * Returns:
 *  - loading, error
 *  - course (unchanged fields from Firestore)
 *  - records: flat list [{ id, date, studentId(email), status, studentName, mode, timestamp }]
 *  - dates: string[] YYYY-MM-DD (asc)
 *  - students: [{ id(lowercase email), email, name, studentId?, section?, statusByDate, status? }]
 *  - recordMap: Map(`${emailLower}__${date}` -> status) for O(1) table lookup
 */
export default function useCourseAttendance(courseId, { dateISO } = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [course, setCourse] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (!courseId) {
          setError("No course selected.");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError("");

        // ---- course ----
        const courseSnap = await getDoc(doc(db, "courses", courseId));
        if (!courseSnap.exists()) {
          if (!cancelled) {
            setError("Course not found");
            setCourse(null);
          }
          return;
        }
        if (!cancelled) setCourse({ id: courseSnap.id, ...courseSnap.data() });

        // ---- attendance ----
        const ref = collection(db, "attendance");
        let snap;

        if (dateISO) {
          // Filter by docId prefix: courseId_YYYYMMDD_
          const prefix = `${courseId}_${toDateId(dateISO)}_`;
          const q = query(
            ref,
            orderBy(documentId()),
            startAt(prefix),
            endAt(prefix + "\uf8ff")
          );
          snap = await getDocs(q);
        } else {
          // All docs for this course
          const q = query(ref, where("courseId", "==", courseId));
          snap = await getDocs(q);
        }

        const recs = [];
        snap.forEach((d) => {
          const x = d.data();
          const date = normalizeDate(x.date);

          // In this project, the student's email is the stable key.
          const email = x.studentEmail || x.studentId || x.email || "";
          if (!email) return;

          recs.push({
            id: d.id,
            date,
            studentId: email,            // keep in "studentId" field for UI compatibility
            status: x.status || "N/A",
            studentName: x.studentName || "",
            mode: x.mode || "",
            timestamp: x.timestamp || null,
          });
        });

        // Sort: newest date first, then by email
        recs.sort((a, b) =>
          a.date !== b.date
            ? new Date(b.date) - new Date(a.date)
            : toKey(a.studentId).localeCompare(toKey(b.studentId))
        );

        if (!cancelled) setRecords(recs);
      } catch (e) {
        if (!cancelled) setError("Failed to load attendance data");
        // optional: console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [courseId, dateISO]);

  // ---- derived: dates (asc) ----
  const dates = useMemo(() => {
    const s = new Set();
    records.forEach((r) => r.date && s.add(r.date));
    return Array.from(s).sort((a, b) => new Date(a) - new Date(b));
  }, [records]);

  // ---- derived: students list + per-date status ----
  const students = useMemo(() => {
    const map = new Map();
    for (const r of records) {
      const key = toKey(r.studentId);
      if (!key) continue;

      if (!map.has(key)) {
        map.set(key, {
          id: key,                 // lowercase email as stable id
          email: r.studentId,      // original email
          name: r.studentName || r.studentId,
          studentId: "",           // some docs may not have a separate numeric/roll id
          section: "",             // not always present in attendance docs
          statusByDate: {},
        });
      }
      map.get(key).statusByDate[r.date] = r.status || "N/A";
    }

    const list = Array.from(map.values());
    list.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));

    // If a specific date filter is set, surface `.status` for that day (you asked for it)
    if (dateISO) {
      list.forEach((s) => {
        s.status = s.statusByDate[dateISO] || "N/A";
      });
    }

    return list;
  }, [records, dateISO]);

  // ---- derived: O(1) lookup for table cells ----
  const recordMap = useMemo(() => {
    const m = new Map();
    for (const r of records) {
      m.set(`${toKey(r.studentId)}__${r.date}`, r.status || "N/A");
    }
    return m;
  }, [records]);

  return { loading, error, course, students, dates, records, recordMap };
}
