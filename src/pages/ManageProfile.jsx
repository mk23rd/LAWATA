import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase-config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const steps = [
  { label: "Phone Number", name: "phoneNumber", type: "text", milestone: "Phone" },
  { label: "Profile Image URL", name: "profileImageUrl", type: "text", milestone: "Profile Image" },
  { label: "Bio", name: "bio", type: "textarea", milestone: "Bio" },
  { label: "Location", name: ["city", "country"], type: "location", milestone: "Location" },
  { label: "Preferred Categories", name: "preferredCategories", type: "text", milestone: "Preferences" },
];

const ManageProfile = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [formData, setFormData] = useState({
    phoneNumber: "",
    profileImageUrl: "",
    bio: "",
    city: "",
    country: "",
    preferredCategories: "",
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        navigate("/");
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFormData({
            phoneNumber: data.phoneNumber || "",
            profileImageUrl: data.profileImageUrl || "",
            bio: data.bio || "",
            city: data.location?.city || "",
            country: data.location?.country || "",
            preferredCategories: (data.preferredCategories || []).join(", "),
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };
    fetchProfile();
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        phoneNumber: formData.phoneNumber,
        profileImageUrl: formData.profileImageUrl,
        bio: formData.bio,
        location: { city: formData.city, country: formData.country },
        preferredCategories: formData.preferredCategories
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      });
      alert("Profile updated successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="bg-white min-h-screen flex flex-col items-center justify-start p-6 text-black">
      {/* Page Title */}
      <h1 className="text-4xl font-bold mt-8 mb-2 text-center">Set Up Your Profile</h1>
      <p className="text-center text-gray-600 mb-6">
        Complete your profile to unlock all features
      </p>

      {/* Progress Bar with Milestone Text */}
      <div className="w-full max-w-md mb-6">
        <div className="flex justify-between mb-1 text-sm text-gray-500">
          {steps.map((s, idx) => (
            <span key={idx} className={`${idx === currentStep ? "font-bold" : ""}`}>
              {s.milestone}
            </span>
          ))}
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Form Box */}
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-blue-400">
        <h2 className="text-2xl font-semibold mb-4">{step.label}</h2>

        {step.type === "textarea" ? (
          <textarea
            name={step.name}
            value={formData[step.name]}
            onChange={handleChange}
            className="w-full p-3 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        ) : step.type === "location" ? (
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              className="w-full p-3 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={formData.country}
              onChange={handleChange}
              className="w-full p-3 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        ) : (
          <input
            type={step.type}
            name={step.name}
            value={formData[step.name]}
            onChange={handleChange}
            className="w-full p-3 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-lg border border-blue-300 ${
              currentStep === 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-100 transition"
            }`}
          >
            Previous
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 rounded-lg border border-blue-300 hover:bg-blue-100 transition"
            >
              Preview
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded-2xl max-w-md w-full relative">
            <h2 className="text-2xl font-bold mb-4">Profile Preview</h2>
            <div className="flex flex-col items-center gap-2">
              <img
                src={formData.profileImageUrl || "https://via.placeholder.com/100?text=User"}
                alt="Profile"
                className="w-24 h-24 rounded-full mb-2"
              />
              <p><strong>Username:</strong> {user?.displayName || "User"}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Phone:</strong> {formData.phoneNumber}</p>
              <p><strong>Bio:</strong> {formData.bio}</p>
              <p><strong>Location:</strong> {formData.city}, {formData.country}</p>
              <p><strong>Preferences:</strong> {formData.preferredCategories}</p>
            </div>
            <button
              className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
              onClick={() => setShowPreview(false)}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProfile;
