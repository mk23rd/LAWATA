import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase-config";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  Edit3, 
  ArrowLeft,
  Phone,
  Tag,
  Briefcase,
  TrendingUp,
  Heart,
  DollarSign,
  Eye,
  Loader
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        navigate("/");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate]);

  const getRoleIcon = (role) => {
    const roleMap = {
      creator: Briefcase,
      investor: DollarSign,
      funder: DollarSign,
      visitor: Eye
    };
    return roleMap[role.toLowerCase()] || User;
  };

  const getRoleColor = (role) => {
    const colorMap = {
      creator: "from-green-500 to-emerald-600",
      investor: "from-blue-500 to-cyan-600",
      funder: "from-yellow-500 to-orange-600",
      visitor: "from-gray-500 to-slate-600"
    };
    return colorMap[role.toLowerCase()] || "from-gray-500 to-slate-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 animate-spin text-gray-900" />
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700">No profile data found</p>
          <button
            onClick={() => navigate("/manage-profile")}
            className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Complete Your Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium mb-6 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        {/* Main Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header Section with Gradient */}
          <div className="relative h-48 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-gray-400 to-gray-600">
                  {userData.profileImageUrl ? (
                    <img
                      src={userData.profileImageUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-20 px-8 pb-8">
            {/* Name and Edit Button */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {userData.username || "User"}
                </h1>
                {userData.bio && (
                  <p className="text-gray-600 max-w-2xl leading-relaxed">
                    {userData.bio}
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate("/manage-profile")}
                className="mt-4 sm:mt-0 flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold shadow-lg"
              >
                <Edit3 size={18} />
                Edit Profile
              </button>
            </div>

            {/* Roles and Categories */}
            {(userData.roles?.length > 0 || userData.preferredCategories?.length > 0) && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Roles & Interests
                </h2>
                <div className="flex flex-wrap gap-3">
                  {userData.roles?.map((role) => {
                    const IconComponent = getRoleIcon(role);
                    const colorClass = getRoleColor(role);
                    
                    return (
                      <span
                        key={role}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-semibold text-sm bg-gradient-to-r ${colorClass} shadow-md`}
                      >
                        <IconComponent size={16} />
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    );
                  })}

                  {userData.preferredCategories?.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-md"
                    >
                      <Heart size={16} />
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Email Address</p>
                    <p className="text-gray-900 font-medium break-all">{userData.email}</p>
                  </div>
                </div>
              </div>

              {/* Phone */}
              {userData.phoneNumber && (
                <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Phone Number</p>
                      <p className="text-gray-900 font-medium">{userData.phoneNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              {userData.location?.city && userData.location?.country && (
                <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Location</p>
                      <p className="text-gray-900 font-medium">
                        {userData.location.city}, {userData.location.country}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Join Date */}
              <div className="bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Member Since</p>
                    <p className="text-gray-900 font-medium">
                      {userData.createdAt?.toDate?.().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/manage")}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold shadow-lg"
              >
                <TrendingUp size={20} />
                Manage Projects
              </button>
              <button
                onClick={() => navigate("/wallet")}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg"
              >
                <DollarSign size={20} />
                My Wallet
              </button>
            </div>
          </div>
        </div>

        {/* Profile Completion Tip */}
        {(!userData.phoneNumber || !userData.bio || !userData.location?.city) && (
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                  Complete Your Profile
                </h3>
                <p className="text-sm text-yellow-700">
                  Your profile is incomplete. Add more information to help others connect with you and unlock all features.
                </p>
                <button
                  onClick={() => navigate("/manage-profile")}
                  className="mt-3 text-sm font-semibold text-yellow-800 hover:text-yellow-900 underline"
                >
                  Complete Now →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
