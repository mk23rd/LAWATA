import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase-config";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        navigate("/"); // if not logged in, redirect home
      }
    };

    fetchUserData();
  }, [user, navigate]);

  if (!userData) {
    return <div className="text-center text-color-e mt-20">Loading profile...</div>;
  }

  return (
    <div className="bg-color-d min-h-screen p-10 text-color-e">
      <h1 className="text-4xl font-bold mb-6">Profile</h1>

      <div className="bg-color-e text-color-d p-6 rounded-2xl shadow-lg max-w-lg">
        <p><span className="font-semibold">Username:</span> {userData.username}</p>
        <p><span className="font-semibold">Email:</span> {userData.email}</p>
        <p><span className="font-semibold">Roles:</span> {userData.roles?.join(", ")}</p>
        <p><span className="font-semibold">Joined:</span> {userData.createdAt?.toDate?.().toLocaleString() || userData.createdAt}</p>
        <p><span className="font-semibold">Last Login:</span> {userData.lastLogin?.toDate?.().toLocaleString() || userData.lastLogin}</p>
      </div>
    </div>
  );
};

export default Profile;
