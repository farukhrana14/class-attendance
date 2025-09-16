import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Subscribes to the teacher's courses (active only).
 * Uses enrolledCourses array from userData.
 *
 * @param {object} userData - The user document object (must include enrolledCourses).
 * @param {boolean} userLoading - Whether the user doc is still loading.
 * @returns {object} { courses, loading }
 */
export function useTeacherCourses(userData, userLoading) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;

    if (!userData?.enrolledCourses || userData.enrolledCourses.length === 0) {
      setCourses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const coursesRef = collection(db, "courses");
    const q = query(
      coursesRef,
      where("__name__", "in", userData.enrolledCourses),
      where("status", "==", "active")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = [];
        snap.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
        setCourses(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error subscribing to courses:", err);
        setCourses([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userLoading, userData]);

  return { courses, loading };
}
