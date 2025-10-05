import React, { useEffect, useState, useRef } from "react";
import { auth, db, storage } from "../firebase/firebase-config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
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
  MdArrowBack,
  MdCameraAlt
} from "react-icons/md";
import { toast } from "react-toastify";

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
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      event.target.value = "";
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const storageRef = ref(storage, `profile-images/${user.uid}/${Date.now()}.${extension}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setIsUploading(true);
    setUploadProgress(0);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (snapshot.totalBytes) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        }
      },
      (error) => {
        console.error("Error uploading avatar:", error);
        toast.error("Failed to upload profile picture. Please try again.");
        setIsUploading(false);
        setUploadProgress(0);
        event.target.value = "";
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(doc(db, "users", user.uid), {
            profileImageUrl: downloadUrl
          });
          setUserData((prev) => (prev ? { ...prev, profileImageUrl: downloadUrl } : prev));
          toast.success("Profile picture updated!");
        } catch (err) {
          console.error("Error saving avatar URL:", err);
          toast.error("Unable to save profile picture. Please try again.");
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
          event.target.value = "";
        }
      }
    );
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 rounded-full border-4 border-gray-300 border-t-gray-600 animate-spin"></div>
          <p className="text-sm text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <MdArrowBack className="w-4 h-4" />
            Back to Home
          </button>
          <div className="h-4 w-px bg-gray-200" aria-hidden="true"></div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Profile header */}
          <div className="px-6 py-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {userData.profileImageUrl ? (
                    <img
                      src={userData.profileImageUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <MdPerson className="w-10 h-10 text-gray-400" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-xs">
                      <div className="mb-1 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      {uploadProgress}%
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                  disabled={isUploading}
                >
                  <MdCameraAlt className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900">{userData.username}</h2>
                  <MdVerified className="w-4 h-4 text-gray-500" aria-hidden="true" />
                </div>
                {userData.bio && (
                  <p className="mt-1 text-sm text-gray-600">{userData.bio}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate("/manage-profile")}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Edit Profile
              </button>
              <button
                onClick={() => navigate("/manage")}
                className="px-4 py-2.5 rounded-lg bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
              >
                Manage Projects
              </button>
            </div>
          </div>

          {/* Roles & interests */}
          <div className="px-6 py-6 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-gray-900">Roles & Interests</span>
            </div>
            {userData.roles?.length || userData.preferredCategories?.length ? (
              <div className="flex flex-wrap gap-2">
                {userData.roles?.map((role) => {
                  const IconComponent = roleIcons[role] || MdPerson;
                  return (
                    <span
                      key={role}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700"
                    >
                      <IconComponent className="w-3 h-3" />
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                  );
                })}
                {userData.preferredCategories?.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700"
                  >
                    <MdDateRange className="w-3 h-3" />
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No interests added yet.</p>
            )}
          </div>

          {/* Contact information */}
          <div className="px-6 py-6 border-b border-gray-100">
            <span className="block text-sm font-semibold text-gray-900 mb-4">Contact Information</span>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <dt className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                  <MdEmail className="w-4 h-4 text-gray-500" />
                  Email Address
                </dt>
                <dd className="text-sm text-gray-700 break-words">{userData.email}</dd>
              </div>

              {userData.location?.city && userData.location?.country && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <dt className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                    <MdLocationOn className="w-4 h-4 text-gray-500" />
                    Location
                  </dt>
                  <dd className="text-sm text-gray-700">
                    {userData.location.city}, {userData.location.country}
                  </dd>
                </div>
              )}

              <div className="rounded-lg border border-gray-200 p-4">
                <dt className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                  <MdDateRange className="w-4 h-4 text-gray-500" />
                  Member Since
                </dt>
                <dd className="text-sm text-gray-700">
                  {userData.createdAt?.toDate?.().toLocaleDateString() || userData.createdAt}
                </dd>
              </div>
            </dl>
          </div>

          {/* Additional context */}
          <div className="px-6 py-6">
            <p className="text-sm text-gray-500">
              Keep your profile information up to date so the community can connect with you easily.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
