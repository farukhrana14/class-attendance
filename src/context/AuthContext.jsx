import { createContext, useContext, useEffect, useState } from "react";
import { auth, provider } from "../firebase";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // Make sure this is imported
import { db } from "../firebase"; // Also ensure this is imported

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setChecking(false);

      if (firebaseUser) {
        // Fetch Firestore user document on auth state change
        const userDocRef = doc(db, "users", firebaseUser.email);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setUserData(data);
          console.log("✅ Fetched userData from Firestore:", data);
        } else {
          setUserData(null);
          console.warn("⚠️ No Firestore document found for user:", firebaseUser.email);
        }
      } else {
        setUserData(null);
        console.warn("⚠️ No Firebase user detected.");
      }
    });

    return () => unsub();
  }, []);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);

      const userDocRef = doc(db, "users", result.user.email);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setUserData(data);
        console.log("✅ Login: Firestore user data fetched:", data);
      } else {
        setUserData(null);
        console.warn("⚠️ Login: No Firestore document for", result.user.email);
      }
    } catch (error) {
      console.error("❌ Login error:", error);
    }
  };

  const logout = () => {
    signOut(auth);
    setUser(null);
    setUserData(null);
  };

  // Debug logs
  console.log("👀 AuthContext - user:", user);
  console.log("👀 AuthContext - userData:", userData);

  return (
    <AuthContext.Provider value={{ user, userData, login, logout, checking }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
