import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider } from "../firebase";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setChecking(false);

      if (!firebaseUser) {
        // No firebase user; clear and keep on public route
        setUserData(null);
        console.warn("⚠️ No Firebase user detected.");
        // keep current route — do not force navigation
        return;
      }

      try {
        const userDocRef = doc(db, "users", firebaseUser.email);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();

          // If role missing, default to "student" in Firestore (merge)
          if (!data.role) {
            try {
              await setDoc(userDocRef, { role: "student" }, { merge: true });
              data.role = "student";
              console.log("ℹ️ Added default role: 'student' to user document");
            } catch (err) {
              console.error("❌ Failed to set default role on user doc:", err);
            }
          }

          setUserData(data);
          console.log("✅ Fetched userData from Firestore:", data);

          // Redirect based on role, but don't redirect if already on a valid path
          const currentPath = window.location.pathname;
          const teacherPaths = ['/teacher'];
          const isOnTeacherPath = teacherPaths.some(path => currentPath.startsWith(path));
          
          if (data.role === "teacher" || data.role === "admin") {
            // Only redirect if not already on a teacher path
            if (!isOnTeacherPath) {
              navigate("/teacher", { replace: true });
            }
          } else {
            // students and unknown roles go to /student
            navigate("/student", { replace: true });
          }
        } else {
          // No user document in Firestore: still navigate to /student so StudentHome can show "not authorized" message
          setUserData(null);
          console.warn("⚠️ No Firestore document found for user:", firebaseUser.email);
          navigate("/student", { replace: true });
        }
      } catch (error) {
        console.error("❌ Error fetching user document:", error);
        setUserData(null);
        // fallback to student route
        navigate("/student", { replace: true });
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);

      const userDocRef = doc(db, "users", result.user.email);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();

        // If role missing, default to "student" in Firestore (merge)
        if (!data.role) {
          try {
            await setDoc(userDocRef, { role: "student" }, { merge: true });
            data.role = "student";
            console.log("ℹ️ Added default role: 'student' on login");
          } catch (err) {
            console.error("❌ Failed to set default role on login:", err);
          }
        }

        setUserData(data);
        console.log("✅ Login: Firestore user data fetched:", data);

        const currentPath = window.location.pathname;
        const teacherPaths = ['/teacher'];
        const isOnTeacherPath = teacherPaths.some(path => currentPath.startsWith(path));

        if (data.role === "teacher" || data.role === "admin") {
          // Only redirect if not already on a teacher path
          if (!isOnTeacherPath) {
            navigate("/teacher", { replace: true });
          }
        } else {
          navigate("/student", { replace: true });
        }
      } else {
        // No Firestore doc - still navigate to /student so StudentHome shows not-authorized UI
        setUserData(null);
        console.warn("⚠️ Login: No Firestore document for", result.user.email);
        navigate("/student", { replace: true });
      }
    } catch (error) {
      console.error("❌ Login error:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("❌ Sign out error:", err);
    } finally {
      setUser(null);
      setUserData(null);
      navigate("/", { replace: true });
    }
  };

  // Debug logs
  console.log("👀 AuthContext - user:", user);
  console.log("👀 AuthContext - userData:", userData);

  return (
    <AuthContext.Provider value={{ user, userData, login, logout, checking, loading: checking }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
