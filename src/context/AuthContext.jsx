import { createContext, useContext, useEffect, useState, useRef } from "react";
import AccessRestrictedModal from "../components/AccessRestrictedModal";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [userData, setUserData] = useState(null);
  const [showAccessRestricted, setShowAccessRestricted] = useState(false);
  const selectedRoleRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setChecking(false);

      if (!firebaseUser) {
        setUserData(null);
        setShowAccessRestricted(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", firebaseUser.email);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
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
          setShowAccessRestricted(false);
        } else {
          setUserData(null);
          // Only show access restriction for new students, not teachers
          if (selectedRoleRef.current === "student") {
            setShowAccessRestricted(true);
          } else {
            setShowAccessRestricted(false);
          }
        }
      } catch (error) {
        setUserData(null);
        // Only show access restriction for new students, not teachers
        if (selectedRoleRef.current === "student") {
          setShowAccessRestricted(true);
        } else {
          setShowAccessRestricted(false);
        }
      }
    });
    return () => unsub();
  }, []);

  // Accept selectedRole for robust restriction logic
  const login = async (selectedRole) => {
    selectedRoleRef.current = selectedRole;
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      const userDocRef = doc(db, "users", result.user.email);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        // New user, no Firestore doc
        if (selectedRole === "student") {
          setShowAccessRestricted(true);
          setUserData(null);
          return;
        } else if (selectedRole === "teacher") {
          // Let onboarding modal handle teacher onboarding, do not set access restricted
          setUserData(null);
          setShowAccessRestricted(false);
          return;
        }
      } else {
        // Existing user
        const data = userDocSnap.data();
        setUserData(data);
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

  const handleAccessRestrictedClose = async () => {
    setShowAccessRestricted(false);
    setUserData(null);
    await logout();
    // No need to navigate again, logout already navigates to '/'
  };

  // Force-hide modal if not on /login route
  const modalOpen = location.pathname === '/login' && showAccessRestricted;


  return (
    <AuthContext.Provider value={{ user, userData, login, logout, checking, loading: checking }}>
      {children}
      <AccessRestrictedModal open={modalOpen} onClose={handleAccessRestrictedClose} />
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
