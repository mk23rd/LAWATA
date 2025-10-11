import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase-config";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Upload, X, Loader, User, Phone, MapPin, Tag, FileText, Camera, Save, Eye } from "lucide-react";
import { toast } from 'react-toastify';
import SimplePhoneInput from '../components/ui/SimplePhoneInput';
import CountryCitySelector from '../components/ui/CountryCitySelector';

const ManageProfile = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [formData, setFormData] = useState({
    username: "",
    phoneNumber: "",
    profileImageUrl: "",
    bio: "",
    city: "",
    country: "",
    preferredCategories: "",
  });

  const [phoneData, setPhoneData] = useState({
    number: "",
    isValid: false,
    countryCode: "",
    dialCode: ""
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [originalUsername, setOriginalUsername] = useState("");

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
          const phoneNumber = data.phoneNumber || "";
          const username = data.username || data.displayName || "";
          
          setFormData({
            username: username,
            phoneNumber: phoneNumber,
            profileImageUrl: data.profileImageUrl || "",
            bio: data.bio || "",
            city: data.location?.city || "",
            country: data.location?.country || "",
            preferredCategories: (data.preferredCategories || []).join(", "),
          });
          
          setOriginalUsername(username.toLowerCase());
          
          // Initialize phone data if phone number exists
          if (phoneNumber) {
            setPhoneData({
              number: phoneNumber,
              isValid: true, // Assume existing numbers are valid
              countryCode: "",
              dialCode: ""
            });
          }
          
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
    
    // Reset username availability when username changes
    if (name === 'username') {
      setUsernameAvailable(null);
    }
  };

  // Check if username already exists in database
  const checkUsernameAvailability = async (username) => {
    if (!username.trim()) {
      setUsernameAvailable(null);
      return;
    }

    // Don't check if it's the same as original username
    if (username.toLowerCase() === originalUsername) {
      setUsernameAvailable(true);
      return;
    }

    setUsernameChecking(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      setUsernameAvailable(querySnapshot.empty);
    } catch (error) {
      console.error('Error checking username:', error);
      toast.error('Failed to check username availability');
    } finally {
      setUsernameChecking(false);
    }
  };

  // Debounced username check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.username && formData.username !== originalUsername) {
        checkUsernameAvailability(formData.username);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  const handlePhoneChange = (phoneInfo) => {
    setPhoneData(phoneInfo);
    setFormData((prev) => ({ ...prev, phoneNumber: phoneInfo.number }));
  };

  const handleCountryChange = (country) => {
    setFormData((prev) => ({ ...prev, country: country }));
  };

  const handleCityChange = (city) => {
    setFormData((prev) => ({ ...prev, city: city }));
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

  const validateForm = () => {
    const errors = [];

    // Username validation
    if (!formData.username.trim()) {
      errors.push("Username is required");
    } else if (formData.username.trim().length < 3) {
      errors.push("Username must be at least 3 characters");
    } else if (formData.username.trim().length > 20) {
      errors.push("Username must not exceed 20 characters");
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      errors.push("Username can only contain letters, numbers, and underscores");
    } else if (usernameAvailable === false) {
      errors.push("Username is already taken");
    }

    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      errors.push("Phone number is required");
    } else if (!phoneData.isValid) {
      errors.push("Please enter a valid phone number for the selected country");
    }

    // Bio validation
    if (!formData.bio.trim()) {
      errors.push("Bio is required");
    } else if (formData.bio.trim().length < 20) {
      errors.push("Bio must be at least 20 characters");
    } else if (formData.bio.length > 500) {
      errors.push("Bio must not exceed 500 characters");
    }

    // Location validation
    if (!formData.city.trim()) {
      errors.push("City is required");
    } else if (formData.city.trim().length < 2) {
      errors.push("City name must be at least 2 characters");
    }

    if (!formData.country.trim()) {
      errors.push("Country is required");
    } else if (formData.country.trim().length < 2) {
      errors.push("Country name must be at least 2 characters");
    }

    // Profile image validation
    if (!formData.profileImageUrl && !selectedFile) {
      errors.push("Profile image is required");
    }

    return errors;
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
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
        username: formData.username.trim().toLowerCase(),
        displayName: formData.username.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        profileImageUrl: profileImageUrl,
        bio: formData.bio.trim(),
        location: { 
          city: formData.city.trim(), 
          country: formData.country.trim() 
        },
        preferredCategories: formData.preferredCategories
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Profile Image Section */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8">
            <div className="flex flex-col items-center">
              <div className="relative group">
                {filePreview ? (
                  <div className="relative">
                    <img
                      src={filePreview}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white" size={24} />
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-white shadow-lg flex items-center justify-center">
                    <User className="text-gray-400" size={48} />
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex flex-col items-center gap-2">
                <label className="cursor-pointer bg-white text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium shadow-md">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <Upload size={18} />
                    {filePreview ? "Change Photo" : "Upload Photo"}
                  </div>
                </label>
                <p className="text-gray-300 text-sm">JPG, PNG or GIF (max. 5MB)</p>
              </div>

              {uploading && (
                <div className="mt-3 flex items-center gap-2 text-white bg-white/20 px-4 py-2 rounded-lg">
                  <Loader className="animate-spin" size={16} />
                  <span className="text-sm">Uploading image...</span>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-8 space-y-6">
            {/* Account Info */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <User className="text-gray-700" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span> {user?.email}
                </p>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <User size={18} />
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a unique username"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                />
                {usernameChecking && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader className="animate-spin text-gray-400" size={18} />
                  </div>
                )}
              </div>
              {formData.username && formData.username.toLowerCase() !== originalUsername && (
                <div className="mt-1">
                  {usernameChecking ? (
                    <p className="text-xs text-gray-500">Checking availability...</p>
                  ) : usernameAvailable === true ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Username is available
                    </p>
                  ) : usernameAvailable === false ? (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Username is already taken
                    </p>
                  ) : null}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Phone size={18} />
                Phone Number <span className="text-red-500">*</span>
              </label>
              <SimplePhoneInput
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                placeholder="Enter your phone number"
                error={formData.phoneNumber && !phoneData.isValid}
              />
              {formData.phoneNumber && !phoneData.isValid && (
                <p className="text-red-500 text-xs mt-1">
                  Please enter a valid phone number for the selected country
                </p>
              )}
              {phoneData.isValid && phoneData.countryCode && (
                <p className="text-green-600 text-xs mt-1">
                  Valid {phoneData.countryCode.toUpperCase()} phone number
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <FileText size={18} />
                Bio <span className="text-red-500">*</span>
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                rows="4"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
              />
              <p className={`text-xs mt-1 ${formData.bio.length > 500 ? 'text-red-500' : formData.bio.length < 20 ? 'text-orange-500' : 'text-gray-500'}`}>
                {formData.bio.length}/500 characters {formData.bio.length < 20 && '(minimum 20)'}
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <MapPin size={18} />
                Location <span className="text-red-500">*</span>
              </label>
              <CountryCitySelector
                selectedCountry={formData.country}
                selectedCity={formData.city}
                onCountryChange={handleCountryChange}
                onCityChange={handleCityChange}
                error={(!formData.country || !formData.city)}
              />
            </div>

            {/* Preferred Categories */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Tag size={18} />
                Preferred Categories
              </label>
              <input
                type="text"
                name="preferredCategories"
                value={formData.preferredCategories}
                onChange={handleChange}
                placeholder="e.g., Technology, Art, Music (comma-separated)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple categories with commas</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || uploading || usernameChecking || (usernameAvailable === false && formData.username.toLowerCase() !== originalUsername)}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate("/profile")}
                disabled={loading || uploading}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye size={20} />
                View Profile
              </button>
            </div>
          </div>
        </div>

        {/* Helper Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Fields marked with <span className="text-red-500">*</span> are required
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManageProfile;
