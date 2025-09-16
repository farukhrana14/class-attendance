import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Subscribes to a user's Firestore document by email.
 * 
 * @param {string} email - The email ID of the user (used as the doc ID).
 * @returns {object} { userData, loading }
 */
export function useUserDoc(email) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setUserData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, "users", email);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setUserData(snap.data());
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [email]);

  return { userData, loading };
}
