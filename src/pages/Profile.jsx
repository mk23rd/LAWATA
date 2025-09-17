import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase/firebase-config";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { MdEmail, MdLocationOn, MdDateRange } from "react-icons/md";
import NotificationBell from "../components/NotificationBell";

const roleColors = {
  creator: "bg-yellow-200 text-black",
  investor: "bg-green-200 text-black",
  visitor: "bg-gray-300 text-black"
};

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const user = auth.currentUser;
  const cardRef = useRef(null);

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
        navigate("/");
      }
    };
    fetchUserData();
  }, [user, navigate]);

  useEffect(() => {
    if (cardRef.current) {
      gsap.from(cardRef.current, { opacity: 0, y: 50, duration: 1, ease: "power2.out" });
    }
  }, [userData]);

  if (!userData) {
    return <div className="text-center mt-20 text-xl text-gray-700">Loading profile...</div>;
  }

  return (
    <div className="bg-white min-h-screen flex flex-col items-center py-12 px-4">
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>
      <h1 className="text-4xl font-bold mb-8 text-black">My Profile</h1>

      <div
        ref={cardRef}
        className="bg-white text-black p-8 rounded-3xl shadow-xl w-full max-w-lg border-2 border-blue-300 flex flex-col items-center"
      >
        {/* Profile Image */}
        <div className="w-36 h-36 mb-6 rounded-full overflow-hidden border-4 border-blue-400 flex items-center justify-center bg-gray-100 text-gray-400 text-4xl">
          {userData.profileImageUrl ? (
            <img
              src={userData.profileImageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-20 h-20"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.33 0-10 1.667-10 5v3h20v-3c0-3.333-6.67-5-10-5z"/>
            </svg>
          )}
        </div>

        {/* Username + Bio */}
        <div className="flex flex-col items-center mb-4 text-center">
          <h2 className="text-3xl font-bold">{userData.username}</h2>
          {userData.bio && (
            <p className="text-gray-700 mt-2 px-4 font-medium">{userData.bio}</p>
          )}
        </div>

        {/* Roles + Categories */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {userData.roles?.map((role) => (
            <span
              key={role}
              className={`px-4 py-1 rounded-full text-sm font-bold ${roleColors[role] || "bg-gray-300 text-black"}`}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
          ))}

          {userData.preferredCategories?.map((cat) => (
            <span
              key={cat}
              className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1"
            >
              <MdDateRange size={16} /> {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </span>
          ))}
        </div>

        {/* Other Info */}
        <div className="w-full space-y-3 text-base text-gray-800 font-semibold">
          <p className="flex items-center gap-2"><MdEmail className="text-blue-400"/> {userData.email}</p>
          {userData.location?.city && userData.location?.country && (
            <p className="flex items-center gap-2"><MdLocationOn className="text-blue-400"/> {userData.location.city}, {userData.location.country}</p>
          )}
          <p className="flex items-center gap-2"><MdDateRange className="text-blue-400"/> Joined: {userData.createdAt?.toDate?.().toLocaleDateString() || userData.createdAt}</p>
        </div>

        {/* Setup Profile Button */}
        <button
          onClick={() => navigate("/manage-profile")}
          className="mt-8 bg-blue-500 hover:bg-blue-600 text-white transition-colors font-bold px-6 py-3 rounded-xl shadow-md text-lg"
        >
          Set Up Profile
        </button>
      </div>
    </div>
  );
};

export default Profile;
