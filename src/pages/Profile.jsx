import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase/firebase-config";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  MdEmail, 
  MdLocationOn, 
  MdDateRange, 
  MdEdit, 
  MdVerified,
  MdTrendingUp,
  MdPerson,
  MdAttachMoney,
  MdVisibility,
  MdArrowBack
} from "react-icons/md";

gsap.registerPlugin(ScrollTrigger);

const roleColors = {
  creator: "from-green-400 to-emerald-500 text-white",
  investor: "from-emerald-500 to-teal-600 text-white", 
  funder: "from-yellow-500 to-amber-600 text-white",
  visitor: "from-gray-500 to-slate-600 text-white",
  // Handle case variations
  Creator: "from-green-400 to-emerald-500 text-white",
  Investor: "from-emerald-500 to-teal-600 text-white", 
  Funder: "from-yellow-500 to-amber-600 text-white",
  Visitor: "from-gray-500 to-slate-600 text-white"
};

const roleIcons = {
  creator: MdPerson,
  investor: MdAttachMoney,
  funder: MdAttachMoney,
  visitor: MdVisibility,
  // Handle case variations
  Creator: MdPerson,
  Investor: MdAttachMoney,
  Funder: MdAttachMoney,
  Visitor: MdVisibility
};

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const user = auth.currentUser;
  const containerRef = useRef(null);
  const profileCardRef = useRef(null);
  const avatarRef = useRef(null);
  const nameRef = useRef(null);
  const bioRef = useRef(null);
  const rolesRef = useRef(null);
  const infoRef = useRef(null);
  const buttonRef = useRef(null);

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
    if (userData && containerRef.current) {
      // Simple, subtle animations
      gsap.from(profileCardRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power2.out"
      });

      gsap.from(avatarRef.current, {
        opacity: 0,
        scale: 0.9,
        duration: 0.6,
        delay: 0.2,
        ease: "power2.out"
      });

      gsap.from([nameRef.current, bioRef.current], {
        opacity: 0,
        y: 20,
        duration: 0.6,
        delay: 0.4,
        stagger: 0.1,
        ease: "power2.out"
      });

      gsap.from(rolesRef.current?.children, {
        opacity: 0,
        y: 15,
        duration: 0.5,
        delay: 0.6,
        stagger: 0.05,
        ease: "power2.out"
      });

      gsap.from(infoRef.current?.children, {
        opacity: 0,
        x: -20,
        duration: 0.5,
        delay: 0.8,
        stagger: 0.1,
        ease: "power2.out"
      });

      gsap.from(buttonRef.current, {
        opacity: 0,
        y: 15,
        duration: 0.5,
        delay: 1,
        ease: "power2.out"
      });
    }
  }, [userData]);

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-color-b border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden flex items-center justify-center py-8">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-color-b/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-emerald-400/10 to-color-b/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-lg mx-auto px-4">
        {/* Back to Home Link */}
        <div className="w-full flex justify-start mb-4">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 text-color-b hover:text-blue-700 font-medium transition-colors duration-300"
          >
            <MdArrowBack className="text-lg" />
            <span className="text-sm">Back to Home</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-4xl font-titan font-bold text-color-b mb-2 mt-2">
            My Profile
          </h1>
          <div className="w-16 h-1 bg-color-b mx-auto rounded-full"></div>
        </div>

        {/* Main Profile Card */}
        <div
          ref={profileCardRef}
          className="glass bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl w-full border border-white/20 overflow-hidden"
        >
          <div className="p-6 md:p-8">
            {/* Profile Header - Centered */}
            <div className="flex flex-col items-center text-center mb-5">
              {/* Avatar Section */}
              <div className="relative group mb-3">
                <div
                  ref={avatarRef}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white shadow-xl relative z-10 bg-gradient-to-br from-color-b to-purple-600 flex items-center justify-center mx-auto"
                >
                  {userData.profileImageUrl ? (
                    <img
                      src={userData.profileImageUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-12 h-12 md:w-14 md:h-14 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.33 0-10 1.667-10 5v3h20v-3c0-3.333-6.67-5-10-5z"/>
                    </svg>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div ref={nameRef} className="mb-3">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center justify-center">
                  {userData.username}
                  <MdVerified className="text-color-b text-xl" />
                </h2>
                {userData.bio && (
                  <p ref={bioRef} className="text-base text-gray-600 font-medium leading-relaxed">
                    {userData.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Roles and Categories */}
            <div ref={rolesRef} className="mb-5">
              <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">Roles & Interests</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {userData.roles?.map((role) => {
                  const IconComponent = roleIcons[role] || MdPerson;
                  const roleKey = role.toLowerCase();
                  const colorClass = roleColors[role] || roleColors[roleKey] || "from-gray-400 to-slate-500 text-white";
                  
                  return (
                    <span
                      key={role}
                      className={`px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${colorClass} shadow-md flex items-center gap-2`}
                    >
                      <IconComponent size={16} />
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                  );
                })}

                {userData.preferredCategories?.map((cat) => (
                  <span
                    key={cat}
                    className="bg-gradient-to-r from-color-b to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-md"
                  >
                    <MdDateRange size={16} /> 
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div ref={infoRef} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl mb-5">
              <div className="space-y-0">
                <div className="flex items-center gap-3 p-2 bg-white/60 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-color-b to-blue-600 rounded-full flex items-center justify-center">
                    <MdEmail className="text-white text-sm" />
                  </div>
                  <span className="text-gray-700 font-medium text-sm">{userData.email}</span>
                </div>
                
                {userData.location?.city && userData.location?.country && (
                  <div className="flex items-center gap-3 p-2 bg-white/60 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                      <MdLocationOn className="text-white text-sm" />
                    </div>
                    <span className="text-gray-700 font-medium text-sm">
                      {userData.location.city}, {userData.location.country}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-3 p-2 bg-white/60 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                    <MdDateRange className="text-white text-sm" />
                  </div>
                  <span className="text-gray-700 font-medium text-sm">
                    Joined: {userData.createdAt?.toDate?.().toLocaleDateString() || userData.createdAt}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                ref={buttonRef}
                onClick={() => navigate("/manage-profile")}
                className="bg-color-b hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 text-sm"
              >
                <MdEdit className="text-base" />
                Manage Profile
              </button>
              
              <button
                onClick={() => navigate("/projects")}
                className="bg-white hover:bg-gray-50 text-color-b font-bold px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 text-sm border-2 border-color-b/20 hover:border-color-b/40"
              >
                <MdTrendingUp className="text-base" />
                View Projects
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
