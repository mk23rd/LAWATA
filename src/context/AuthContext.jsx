import { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase/firebase-config";
import { doc, onSnapshot } from "firebase/firestore";

// Context for exposing Firebase authentication state and profile metadata
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Firebase user returned by the auth service
  const [currentUser, setCurrentUser] = useState(null);
  // Track whether initial snapshot subscriptions have resolved
  const [loading, setLoading] = useState(true);
  // Rich profile document associated with the user
  const [userProfile, setUserProfile] = useState(null);
  // Indicates if required profile fields are present
  const [profileComplete, setProfileComplete] = useState(false);
  // Flag for quick investor role checks throughout the UI
  const [isInvestor , setIsInvestor] = useState(false);
  // Firebase auth singleton instance
  const auth = getAuth();

  useEffect(() => {
    // Reference to unsubscribe from firestore user document snapshot
    let unsubscribeUserDoc = null;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      // Cleanup previous listener
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (user) {
        // Live subscribe to user profile
        const userRef = doc(db, "users", user.uid);
        unsubscribeUserDoc = onSnapshot(
          userRef,
          (snap) => {
            const data = snap.exists() ? snap.data() : null;
            setUserProfile(data);
            // Determine profile completion by checking mandatory fields
            const hasAll = Boolean(
              data &&
                data.phoneNumber &&
                data.profileImageUrl &&
                data.bio &&
                data.location &&
                data.location.city &&
                data.location.country
            );
            // Identify investor role from the roles array
            data.roles.forEach(e => {
              if (e === 'Investor'){
                setIsInvestor(true)
              }
            });
            setProfileComplete(hasAll);
            setLoading(false);
          },
          () => {
            // Reset state if the snapshot errors out
            setUserProfile(null);
            setProfileComplete(false);
            setLoading(false);
          }
        );
      } else {
        // When no user is logged in, clear profile state
        setUserProfile(null);
        setProfileComplete(false);
        setLoading(false);
      }
    });

    // Unsubscribe from Firebase auth listener on cleanup
    return () => unsubscribe();
  }, [auth]);

  if (loading) {
    return <p className="text-center text-gray-500 mt-6">Loading...</p>;
  }

  return (
    // Expose auth-related values to the component tree
    <AuthContext.Provider value={{ currentUser, userProfile, profileComplete , isInvestor}}>
      {children}
    </AuthContext.Provider>
  );
};

// Convenience hook for consuming the authentication context
export const useAuth = () => useContext(AuthContext);
