import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase-config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Upload, X, Loader, User, Phone, MapPin, Tag, FileText, Camera, Save, Eye } from "lucide-react";
import { toast } from 'react-toastify';

const ManageProfile = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [formData, setFormData] = useState({
    phoneNumber: "",
    profileImageUrl: "",
    bio: "",
    city: "",
    country: "",
    preferredCategories: [],
  });

  const categories = ['Agriculture', 'Arts', 'Automotives', 'Books', 'Business', 'Charity', 'Community', 'Education', 'Energy', 'Entertainment', 'Environment', 'Fashion', 'Health', 'Infrastructure', 'Research', 'Sports', 'Technology', 'Tourism'];

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");

  const steps = [
    {
      label: "Contact Information",
      milestone: "Contact",
      name: "phoneNumber",
      type: "tel",
      icon: <Phone size={20} className="mr-2" />,
    },
    {
      label: "Profile Picture",
      milestone: "Photo",
      name: "profileImageUrl",
      type: "file",
      icon: <Camera size={20} className="mr-2" />,
    },
    {
      label: "Tell us about yourself",
      milestone: "Bio",
      name: "bio",
      type: "textarea",
      icon: <FileText size={20} className="mr-2" />,
    },
    {
      label: "Your Location",
      milestone: "Location",
      name: "location",
      type: "location",
      icon: <MapPin size={20} className="mr-2" />,
    },
    {
      label: "Your Interests",
      milestone: "Interests",
      name: "preferredCategories",
      type: "categories",
      icon: <Tag size={20} className="mr-2" />,
    },
  ];
  
  const step = steps[currentStep];

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
            preferredCategories: data.preferredCategories || [],
          });
          
          if (data.profileImageUrl) {
            setFilePreview(data.profileImageUrl);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProfile();
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleCategoriesChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      preferredCategories: selected
    }));
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    if (!file.type.match('image.*')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Please select an image smaller than 5MB");
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(formData.profileImageUrl || "");
  };

  const uploadToImageBB = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
      
      if (!apiKey) {
        throw new Error('ImageBB API key is not configured');
      }
      
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data.url;
      } else {
        throw new Error(data.error?.message || 'Image upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Basic validation
    if (!formData.phoneNumber.trim()) {
      toast.error("Phone number is required");
      return;
    }

    if (!formData.bio.trim()) {
      toast.error("Bio is required");
      return;
    }

    if (!formData.city.trim() || !formData.country.trim()) {
      toast.error("Location is required");
      return;
    }

    setLoading(true);
    try {
      let profileImageUrl = formData.profileImageUrl;
      
      if (selectedFile) {
        toast.info("Uploading image...");
        profileImageUrl = await uploadToImageBB(selectedFile);
      }

      await updateDoc(doc(db, "users", user.uid), {
        phoneNumber: formData.phoneNumber,
        profileImageUrl: profileImageUrl,
        bio: formData.bio,
        location: { city: formData.city, country: formData.country },
        preferredCategories: formData.preferredCategories,
      });
      
      toast.success("Profile updated successfully!");
      setTimeout(() => navigate("/profile"), 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-gray-900" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

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
            <span key={idx} className={`${idx === currentStep ? "font-bold text-blue-600" : ""}`}>
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
            rows="4"
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
        ) : step.type === "categories" ? (
          <div className="w-full">
            <p className="text-sm text-gray-600 mb-2">Select categories that interest you (hold Ctrl/Cmd to select multiple):</p>
            <select
              multiple
              value={formData.preferredCategories}
              onChange={handleCategoriesChange}
              className="w-full p-3 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 h-auto min-h-[150px]"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        ) : step.type === "file" ? (
          <div className="flex flex-col items-center">
            {filePreview ? (
              <div className="relative mb-4">
                <img
                  src={filePreview}
                  alt="Profile preview"
                  className="w-32 h-32 rounded-full object-cover border-2 border-blue-300"
                />
                <button
                  type="button"
                  onClick={removeSelectedFile}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center mb-4">
                <Upload className="mx-auto mb-2 text-blue-400" size={32} />
                <p className="text-sm text-gray-600">Upload your profile picture</p>
              </div>
            )}
            
            <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {filePreview ? "Change Image" : "Select Image"}
            </label>
            
            {uploading && (
              <div className="mt-4 flex items-center text-blue-600">
                <Loader className="animate-spin mr-2" size={16} />
                <span>Uploading image...</span>
              </div>
            )}
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
                disabled={uploading}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Next"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || uploading}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50"
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
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold mb-4">Profile Preview</h2>
            <div className="flex flex-col items-center gap-2">
              <img
                src={filePreview || formData.profileImageUrl || "https://via.placeholder.com/100?text=User"}
                alt="Profile"
                className="w-24 h-24 rounded-full mb-2 object-cover"
              />
              <p><strong>Username:</strong> {user?.displayName || "User"}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Phone:</strong> {formData.phoneNumber}</p>
              <p><strong>Bio:</strong> {formData.bio}</p>
              <p><strong>Location:</strong> {formData.city}, {formData.country}</p>
              <p><strong>Preferences:</strong> {formData.preferredCategories.join(", ")}</p>
            </div>
            <button
              className="mt-4 w-full px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
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