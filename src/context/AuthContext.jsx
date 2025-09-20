import { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase/firebase-config";
import { doc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [isInvestor , setIsInvestor] = useState(false);
  const auth = getAuth();

  useEffect(() => {
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
            const hasAll = Boolean(
              data &&
                data.phoneNumber &&
                data.profileImageUrl &&
                data.bio &&
                data.location &&
                data.location.city &&
                data.location.country
            );
            data.roles.forEach(e => {
              if (e === 'Investor'){
                setIsInvestor(true)
              }
            });
            setProfileComplete(hasAll);
            setLoading(false);
          },
          () => {
            setUserProfile(null);
            setProfileComplete(false);
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setProfileComplete(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  if (loading) {
    return <p className="text-center text-gray-500 mt-6">Loading...</p>;
  }

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, profileComplete , isInvestor}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
