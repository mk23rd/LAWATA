import React, { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { db } from "../firebase/firebase-config";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FiUser, FiTag, FiAlignLeft, FiDollarSign, FiCalendar, FiImage, FiChevronRight, FiChevronLeft, FiUpload, FiCheck, FiX, FiTarget, FiTrash2, FiPlus } from "react-icons/fi";
import imgLogo from '../assets/images/img-logo.svg'
import { useAuth } from "../context/AuthContext";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CreateProjectForm() {
  const navigate = useNavigate();
  // Pull current user and profile completeness gate from auth context
  const { currentUser, profileComplete } = useAuth();
  // Track which step of the multi-step wizard is active
  const [activeStep, setActiveStep] = useState(1);
  // Central form data state shared across steps
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    country: "Ethiopia",
    city: "",
    shortDescription: "",
    longDescription: "",
    fundingGoal: "",
    endDate: "",
    imageFile: null,
    secondaryImages: [],
    milestones: {
      '25': { description: '', completed: false },
      '50': { description: '', completed: false },
      '75': { description: '', completed: false },
      '100': { description: '', completed: false }
    },
    rewards: []
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  // Provide titles for the progress indicator and headings
  const getStepTitle = (step) => {
    const titles = [
      "Project Details",
      "Description",
      "Funding Goal",
      "Campaign Timeline",
      "Milestones",
      "Project Images",
      "Rewards",
      "Preview & Submit"
    ];
    return titles[step - 1] || "Unknown Step";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // City selection is limited to Ethiopia only

  const handleMilestoneChange = (percentage, value) => {
    setFormData(prev => ({
      ...prev,
      milestones: {
        ...prev.milestones,
        [percentage]: { ...prev.milestones[percentage], description: value }
      }
    }));
  };

  // Reward handling functions
  const addReward = () => {
    const newReward = {
      id: Date.now(),
      title: "",
      description: "",
      amount: "",
      type: "unlimited", // "unlimited" or "limited"
      quantity: "",
      imageFile: null
    };
    setFormData(prev => ({
      ...prev,
      rewards: [...prev.rewards, newReward]
    }));
  };

  const removeReward = (rewardId) => {
    setFormData(prev => ({
      ...prev,
      rewards: prev.rewards.filter(reward => reward.id !== rewardId)
    }));
  };

  const updateReward = (rewardId, field, value) => {
    setFormData(prev => ({
      ...prev,
      rewards: prev.rewards.map(reward =>
        reward.id === rewardId ? { ...reward, [field]: value } : reward
      )
    }));
  };

  const handleRewardImageChange = (rewardId, file) => {
    updateReward(rewardId, 'imageFile', file);
  };

  // Allowed image mime types for uploads in Step 6
  const ALLOWED_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
  ]);

  const filterValidImages = (files) => {
    const valid = [];
    const invalid = [];
    files.forEach((file) => {
      const typeOk = file.type && ALLOWED_IMAGE_TYPES.has(file.type);
      const name = (file.name || '').toLowerCase();
      const extOk = name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.gif');
      if (typeOk || extOk) valid.push(file);
      else invalid.push(file);
    });
    return { valid, invalid };
  };

  // Improved file handling logic
  const handleFileChange = (e, isMainImage = false) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const { valid, invalid } = filterValidImages(files);
    if (invalid.length > 0) {
      toast.error('Only PNG, JPG, or GIF images are allowed.');
    }
    if (valid.length === 0) return;

    if (isMainImage) {
      // Set the first file as main image
      setFormData(prev => ({
        ...prev,
        imageFile: valid[0]
      }));
    } else {
      // Add all files to secondary images
      setFormData(prev => ({
        ...prev,
        secondaryImages: [...prev.secondaryImages, ...valid]
      }));
    }
  };

  // Handle drag and drop for images
  const handleDrop = (e, isMainImage = false) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const { valid, invalid } = filterValidImages(files);
    if (invalid.length > 0) {
      toast.error('Only PNG, JPG, or GIF images are allowed.');
    }
    if (valid.length === 0) return;

    if (isMainImage) {
      setFormData(prev => ({
        ...prev,
        imageFile: valid[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        secondaryImages: [...prev.secondaryImages, ...valid]
      }));
    }
  };

  const removeSecondaryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      secondaryImages: prev.secondaryImages.filter((_, i) => i !== index)
    }));
  };

  const removeMainImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: null
    }));
  };

  // Promote a secondary image to main image
  const promoteToMainImage = (index) => {
    setFormData(prev => {
      const newSecondary = [...prev.secondaryImages];
      const promotedImage = newSecondary.splice(index, 1)[0];
      return {
        ...prev,
        imageFile: promotedImage,
        secondaryImages: newSecondary
      };
    });
  };

  // Utility: convert selected image file into Base64 for the ImgBB API
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
    });

  // Upload project image to ImgBB and return hosted URL
  const uploadImage = async (file) => {
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
    if (!apiKey) throw new Error("Missing ImgBB API key");
    const base64Image = await toBase64(file);
    const formDataObj = new FormData();
    formDataObj.append("image", base64Image);
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      { method: "POST", body: formDataObj }
    );
    const data = await response.json();
    if (!data.success) throw new Error("Image upload failed");
    return data.data.url;
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.warning("Please sign in to proceed.");
      navigate(`/signing?redirectTo=/create`);
      return;
    }
    if (!profileComplete) {
      toast.warning("Please complete your profile to proceed.");
      navigate(`/manage-profile?redirectTo=/create`);
      return;
    }
    setLoading(true);
    setMessage("");

    if (!formData.title) return setMessage("❌ Title is missing");
    if (!formData.category) return setMessage("❌ Category is missing");
    if (!formData.city) return setMessage("❌ City is missing");
    if (!formData.shortDescription) return setMessage("❌ Short description is missing");
    if (!formData.longDescription) return setMessage("❌ Long description is missing");
    if (!formData.fundingGoal) return setMessage("❌ Funding goal is missing");
    if (!formData.endDate) return setMessage("❌ End date is missing");
    if (!formData.imageFile) return setMessage("❌ Main project image not uploaded");

    const hasEmptyMilestone = Object.values(formData.milestones).some(
      milestone => !milestone.description.trim()
    );
    if (hasEmptyMilestone) {
      setMessage("❌ All milestone descriptions must be filled.");
      setLoading(false);
      return;
    }

    // Validate rewards if any exist
    if (formData.rewards.length > 0) {
      const hasInvalidReward = formData.rewards.some(reward => 
        !reward.title.trim() || 
        !reward.description.trim() || 
        !reward.amount || 
        Number(reward.amount) <= 0 ||
        (reward.type === 'limited' && (!reward.quantity || Number(reward.quantity) <= 0))
      );
      if (hasInvalidReward) {
        setMessage("❌ All reward fields must be properly filled. Check titles, descriptions, amounts, and quantities for limited rewards.");
        setLoading(false);
        return;
      }
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("You must be logged in");

      // Upload main image
      const imageUrl = await uploadImage(formData.imageFile);
      
      // Upload secondary images
      let secondaryImageUrls = [];
      if (formData.secondaryImages.length > 0) {
        const uploadPromises = formData.secondaryImages.map(file => uploadImage(file));
        secondaryImageUrls = await Promise.all(uploadPromises);
      }

      // Upload reward images
      let rewardsWithImages = [];
      if (formData.rewards.length > 0) {
        rewardsWithImages = await Promise.all(
          formData.rewards.map(async (reward) => {
            if (reward.imageFile) {
              const rewardImageUrl = await uploadImage(reward.imageFile);
              const { imageFile, ...rewardWithoutFile } = reward;
              return { ...rewardWithoutFile, imageUrl: rewardImageUrl };
            } else {
              const { imageFile, ...rewardWithoutFile } = reward;
              return { ...rewardWithoutFile, imageUrl: null };
            }
          })
        );
      }

      const today = new Date();
      const endDate = new Date(formData.endDate);
      const duration = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

      const { imageFile, secondaryImages, rewards, ...dataWithoutFiles } = formData;

      const projectData = {
        ...dataWithoutFiles,
        imageUrl,
        secondaryImages: secondaryImageUrls,
        fundingGoal: Number(formData.fundingGoal),
        duration,
        backers: 0,
        fundedMoney: 0,
        status: "Pending",
        riskLevel: "High",
        createdAt: Timestamp.now(),
        createdBy: {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
        },
        milestones: formData.milestones,
        location: { city: formData.city, country: formData.country },
        rewardsList: rewardsWithImages
      };

      const projectRef = await addDoc(collection(db, "projects"), projectData);
      setMessage("✅ Project submitted successfully!");
      
      try {
        // Notify the owner so they know their submission is under review
        await addDoc(collection(db, "notifications"), {
          userId: user.uid,
          projectId: projectRef.id,
          projectTitle: projectData.title,
          message: `You submitted a project called ${projectData.title}. The admins are reviewing it.`,
          type: "project_submission",
          read: false,
          createdAt: Timestamp.now()
        });
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);
      }

      setActiveStep(1);
      setFormData({
        title: "",
        category: "",
        country: "Ethiopia",
        city: "",
        shortDescription: "",
        longDescription: "",
        fundingGoal: "",
        endDate: "",
        imageFile: null,
        secondaryImages: [],
        milestones: {
          '25': { description: '', completed: false },
          '50': { description: '', completed: false },
          '75': { description: '', completed: false },
          '100': { description: '', completed: false }
        },
        rewards: []
      });
      navigate("/manage");
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to submit project.");
    }

    setLoading(false);
  };

  // GSAP refs
  const stepwrapperRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const steplineRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const stepboxRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    const tl = gsap.timeline();

    stepwrapperRefs.forEach((step, idx) => {
      if (idx + 1 === activeStep) {
        tl.to(step.current, { width: "75%", y: 0, duration: 0.3, ease: "power2.out" }, 0);
      } else {
        tl.to(step.current, { width: "5%", y: (idx + 1) * 20, duration: 0.3, ease: "power2.out" }, 0);
      }
    });

    steplineRefs.forEach((step, idx) => {
      if (idx + 1 === activeStep) {
        tl.to(step.current, { height: "80vh", y: 0, duration: 0.3, ease: "power2.out" }, 0);
      } else {
        tl.to(step.current, { height: "30vh", duration: 0.3, ease: "power2.out" }, 0);
      }
    });

    stepboxRefs.forEach((step, idx) => {
      if (!step.current) return;
      const isActive = idx + 1 === activeStep;

      tl.to(step.current, {
        height: isActive ? "70vh" : "25vh",
        width: isActive ? "105%" : "105%",
        padding: isActive ? "0.8rem" : "0.3rem",
        duration: 0.3,
        ease: "power2.out",
      }, 0);

      step.current.style.display = "flex";
      step.current.style.flexDirection = "column";
      step.current.style.justifyContent = "flex-start";
      step.current.style.alignItems = "flex-start";
      step.current.style.overflow = isActive ? "auto" : "hidden";

      const numberEl = step.current.querySelector("p");
      if (numberEl) {
        tl.to(numberEl, {
          top: isActive ? "0.8rem" : "50%",
          left: isActive ? "0.8rem" : "50%",
          x: isActive ? 0 : "-50%",
          y: isActive ? 0 : "-50%",
          duration: 0.5,
          ease: "power2.out",
        }, 0);
      }

      Array.from(step.current.children).forEach((child) => {
        if (child.tagName !== "P") {
          child.style.display = isActive ? "block" : "none";
        }
      });
    });
  }, [activeStep]);

  const stepContents = [
    // Steps 1-4 remain the same as your original code
    // Step 1
    <div className="space-y-4 w-full h-full overflow-hidden">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Project Information</h2>
        <p className="text-sm text-gray-600">Tell us about your amazing project</p>
      </div>
      
      <div className="space-y-4 h-full overflow-y-auto">
        <div className="relative group">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Project Title *</label>
          <div className="relative">
            <FiUser className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 group-focus-within:text-color-b transition-colors" />
            <input 
              type="text" 
              name="title" 
              placeholder="Enter your project title" 
              value={formData.title} 
              onChange={handleChange} 
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-color-b focus:ring-2 focus:ring-color-b/20 transition-all duration-300 text-gray-800 placeholder-gray-400 text-sm" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative group">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
            <div className="relative">
              <FiTag className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 group-focus-within:text-color-b transition-colors pointer-events-none" />
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="appearance-none w-full pl-10 pr-8 py-3 border-2 border-gray-200 rounded-xl focus:border-color-b focus:ring-2 focus:ring-color-b/20 transition-all duration-300 text-gray-800 bg-white cursor-pointer text-sm"
              >
                <option value="">Select Category</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Arts">Arts</option>
                <option value="Automotives">Automotives</option>
                <option value="Books">Books</option>
                <option value="Business">Business</option>
                <option value="Charity">Charity</option>
                <option value="Community">Community</option>
                <option value="Education">Education</option>
                <option value="Energy">Energy</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Environment">Environment</option>
                <option value="Fashion">Fashion</option>
                <option value="Health">Health</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Research">Research</option>
                <option value="Sports">Sports</option>
                <option value="Technology">Technology</option>
                
              </select>
              <FiChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="relative group">
            <label className="block text-sm font-semibold text-gray-700 mb-1">City (Ethiopia) *</label>
            <div className="relative">
              <FiTag className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 group-focus-within:text-color-b transition-colors pointer-events-none" />
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="appearance-none w-full pl-10 pr-8 py-3 border-2 border-gray-200 rounded-xl focus:border-color-b focus:ring-2 focus:ring-color-b/20 transition-all duration-300 text-gray-800 bg-white cursor-pointer text-sm"
              >
                <option value="">Select City</option>
                <option value="Addis Ababa">Addis Ababa</option>
                <option value="Dire Dawa">Dire Dawa</option>
                <option value="Mekelle">Mekelle</option>
                <option value="Gondar">Gondar</option>
                <option value="Awasa">Awasa</option>
                <option value="Bahir Dar">Bahir Dar</option>
                <option value="Jimma">Jimma</option>
                <option value="Jijiga">Jijiga</option>
                <option value="Shashamane">Shashamane</option>
                <option value="Bishoftu">Bishoftu</option>
                <option value="Arba Minch">Arba Minch</option>
                <option value="Hosaena">Hosaena</option>
                <option value="Harar">Harar</option>
                <option value="Dilla">Dilla</option>
                <option value="Nekemte">Nekemte</option>
                <option value="Debre Markos">Debre Markos</option>
                <option value="Debre Birhan">Debre Birhan</option>
                <option value="Adigrat">Adigrat</option>
                <option value="Woldiya">Woldiya</option>
                <option value="Kombolcha">Kombolcha</option>
              </select>
              <FiChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>,

    // Step 2
    <div className="space-y-4 w-full h-full overflow-hidden">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Project Description</h2>
        <p className="text-sm text-gray-600">Describe your project in detail</p>
      </div>
      
      <div className="space-y-4 h-full overflow-y-auto">
        <div className="relative group">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Short Description *</label>
          <div className="relative">
            <FiAlignLeft className="absolute top-3 left-3 text-gray-400 group-focus-within:text-color-b transition-colors" />
            <textarea 
              name="shortDescription" 
              placeholder="Brief description (2-3 sentences)" 
              value={formData.shortDescription} 
              onChange={handleChange} 
              rows="2" 
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-color-b focus:ring-2 focus:ring-color-b/20 transition-all duration-300 text-gray-800 placeholder-gray-400 resize-none text-sm" 
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Shown on project card</p>
        </div>

        <div className="relative group">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Detailed Description *</label>
          <div className="relative">
            <FiAlignLeft className="absolute top-3 left-3 text-gray-400 group-focus-within:text-color-b transition-colors" />
            <textarea 
              name="longDescription" 
              placeholder="Tell the full story of your project..." 
              value={formData.longDescription} 
              onChange={handleChange} 
              rows="4" 
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-color-b focus:ring-2 focus:ring-color-b/20 transition-all duration-300 text-gray-800 placeholder-gray-400 resize-none text-sm" 
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Shown on project details page</p>
        </div>
      </div>
    </div>,

    // Step 3
    <div className="space-y-4 w-full h-full overflow-hidden flex flex-col items-center justify-center">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Funding Goal</h2>
        <p className="text-sm text-gray-600">Set your funding target</p>
      </div>
      
      <div className="w-full max-w-sm">
        <div className="relative group">
          <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">Funding Goal (ETB) *</label>
          <div className="relative">
            <div className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-400 group-focus-within:text-color-b transition-colors text-xl">ETB</div>
            <input 
              type="number" 
              name="fundingGoal" 
              placeholder="Enter amount in ETB" 
              value={formData.fundingGoal} 
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-color-b focus:ring-2 focus:ring-color-b/20 transition-all duration-300 text-gray-800 placeholder-gray-400 text-center text-xl font-bold" 
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">Minimum amount you need to raise</p>
        </div>
      </div>
    </div>,

    // Step 4
    <div className="space-y-4 w-full h-full overflow-hidden flex flex-col items-center justify-center">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Campaign Timeline</h2>
        <p className="text-sm text-gray-600">When should your campaign end?</p>
      </div>
      
      <div className="w-full max-w-sm">
        <div className="relative group">
          <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">Campaign End Date *</label>
          <div className="relative">
            <FiCalendar className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-400 group-focus-within:text-color-b transition-colors" />
            <input 
              type="date" 
              name="endDate" 
              value={formData.endDate} 
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-color-b focus:ring-2 focus:ring-color-b/20 transition-all duration-300 text-gray-800 text-center text-lg" 
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">Choose a date at least 30 days from today</p>
        </div>
      </div>
    </div>,

    // UPDATED STEP 5 - Project Milestones (Properly Scrollable)
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Project Milestones</h2>
        <p className="text-sm text-gray-600">Describe what you'll do at each funding level</p>
      </div>
      
      {/* Proper scrollable container */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-6 pb-4">
          {Object.entries(formData.milestones).map(([percentage, milestone]) => (
            <div key={percentage} className="relative group">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {percentage}% Funding Milestone *
              </label>
              <div className="relative">
                <FiTarget className="absolute top-3 left-3 text-gray-400 group-focus-within:text-color-b transition-colors" />
                <textarea 
                  value={milestone.description}
                  onChange={(e) => handleMilestoneChange(percentage, e.target.value)}
                  placeholder={`Describe what you'll do when ${percentage}% funded...`}
                  rows="3"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-color-b focus:ring-2 focus:ring-color-b/20 transition-all duration-300 text-gray-800 placeholder-gray-400 resize-none text-sm" 
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Planned activities for {percentage}% of funding goal</p>
            </div>
          ))}
        </div>
      </div>
    </div>,

    // UPDATED STEP 6 - Project Images (Improved & Scrollable)
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Project Images</h2>
        <p className="text-sm text-gray-600">Upload your main image and additional images</p>
      </div>
      
      {/* Scrollable container */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-6 pb-4">
          {/* Main Image Upload */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Main Project Image *</label>
            <p className="text-xs text-gray-500 mb-3">This will be the primary image shown for your project</p>
            
            <div
              className={`relative w-full h-48 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer group ${
                formData.imageFile 
                  ? "border-green-400 bg-green-50" 
                  : "border-gray-300 hover:border-color-b hover:bg-blue-50"
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, true)}
              onClick={() => document.getElementById("mainImageInput").click()}
            >
              {formData.imageFile ? (
                <div className="text-center p-4 w-full h-full flex flex-col justify-between">
                  <div className="flex-1 flex items-center justify-center">
                    <img
                      src={URL.createObjectURL(formData.imageFile)}
                      alt="Main Preview"
                      className="max-h-32 max-w-full object-contain rounded-lg shadow-lg"
                    />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-center mb-2">
                      <FiCheck className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm font-semibold text-green-800">Main Image Set</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMainImage();
                      }}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs flex items-center justify-center mx-auto"
                    >
                      <FiTrash2 className="w-3 h-3 mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-color-b/10 transition-colors">
                    <FiUpload className="w-8 h-8 text-gray-400 group-hover:text-color-b transition-colors" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Upload Main Image</h3>
                  <p className="text-gray-600 text-xs">Click to browse or drag & drop</p>
                  <p className="text-gray-500 text-xs mt-1">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
              <input
                id="mainImageInput"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, true)}
                className="hidden"
              />
            </div>
          </div>

          {/* Secondary Images Upload */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Images</label>
            <p className="text-xs text-gray-500 mb-3">These will be shown in your project gallery</p>
            
            <div
              className={`relative w-full h-32 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer group ${
                formData.secondaryImages.length > 0 
                  ? "border-blue-400 bg-blue-50" 
                  : "border-gray-300 hover:border-color-b hover:bg-blue-50"
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, false)}
              onClick={() => document.getElementById("secondaryImagesInput").click()}
            >
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-color-b/10 transition-colors">
                  <FiUpload className="w-6 h-6 text-blue-600 group-hover:text-color-b transition-colors" />
                </div>
                <h3 className="text-sm font-semibold text-blue-800 mb-1">
                  {formData.secondaryImages.length > 0 ? 'Add More Images' : 'Upload Additional Images'}
                </h3>
                <p className="text-blue-600 text-xs">Click, drag & drop, or paste</p>
                <p className="text-gray-500 text-xs mt-1">PNG, JPG, GIF up to 10MB each</p>
              </div>
              <input
                id="secondaryImagesInput"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e, false)}
                className="hidden"
              />
            </div>
          </div>

          {/* Preview Secondary Images */}
          {formData.secondaryImages.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Additional Images ({formData.secondaryImages.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {formData.secondaryImages.map((file, index) => (
                  <div key={index} className="relative group bg-white rounded-lg border border-gray-200 p-2">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-md"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-md flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-1">
                        <button
                          type="button"
                          onClick={() => promoteToMainImage(index)}
                          className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
                          title="Set as main image"
                        >
                          <FiImage className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSecondaryImage(index)}
                          className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-center truncate">
                      Image {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,

    // Step 7 - Rewards
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Project Rewards</h2>
        <p className="text-sm text-gray-600">Create reward tiers for your backers</p>
      </div>
      
      {/* Scrollable container */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-4 pb-4">
          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="flex items-center mb-2">
              <FiTarget className="w-4 h-4 text-blue-600 mr-2" />
              <h3 className="text-sm font-semibold text-blue-800">Reward Guidelines</h3>
            </div>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Set clear reward amounts and descriptions</li>
              <li>• Consider production and shipping costs</li>
              <li>• Limit quantities for exclusive items</li>
            </ul>
          </div>

          {/* Rewards List */}
          {formData.rewards.length > 0 && (
            <div className="space-y-4">
              {formData.rewards.map((reward, index) => (
                <div key={reward.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-800">Reward #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeReward(reward.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Reward Title */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Reward Title *</label>
                      <input
                        type="text"
                        value={reward.title}
                        onChange={(e) => updateReward(reward.id, 'title', e.target.value)}
                        placeholder="e.g., Early Bird Special"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-color-b focus:ring-1 focus:ring-color-b/20 transition-all text-sm"
                      />
                    </div>

                    {/* Reward Amount */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Pledge Amount (ETB) *</label>
                      <div className="relative">
                        <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="number"
                          value={reward.amount}
                          onChange={(e) => updateReward(reward.id, 'amount', e.target.value)}
                          placeholder="25"
                          className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:border-color-b focus:ring-1 focus:ring-color-b/20 transition-all text-sm"
                        />
                      </div>
                    </div>

                    {/* Reward Description */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Description *</label>
                      <textarea
                        value={reward.description}
                        onChange={(e) => updateReward(reward.id, 'description', e.target.value)}
                        placeholder="Describe what backers will receive..."
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-color-b focus:ring-1 focus:ring-color-b/20 transition-all text-sm resize-none"
                      />
                    </div>

                    {/* Reward Type */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Availability</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`rewardType_${reward.id}`}
                            value="unlimited"
                            checked={reward.type === 'unlimited'}
                            onChange={(e) => updateReward(reward.id, 'type', e.target.value)}
                            className="mr-2 text-color-b focus:ring-color-b"
                          />
                          <span className="text-xs text-gray-700">Unlimited</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`rewardType_${reward.id}`}
                            value="limited"
                            checked={reward.type === 'limited'}
                            onChange={(e) => updateReward(reward.id, 'type', e.target.value)}
                            className="mr-2 text-color-b focus:ring-color-b"
                          />
                          <span className="text-xs text-gray-700">Limited</span>
                        </label>
                      </div>
                    </div>

                    {/* Quantity (if limited) */}
                    {reward.type === 'limited' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Total Quantity *</label>
                        <input
                          type="number"
                          value={reward.quantity}
                          onChange={(e) => updateReward(reward.id, 'quantity', e.target.value)}
                          placeholder="100"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-color-b focus:ring-1 focus:ring-color-b/20 transition-all text-sm"
                        />
                      </div>
                    )}

                    {/* Reward Image */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Reward Image</label>
                      <div
                        className={`relative w-full h-24 flex items-center justify-center rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                          reward.imageFile 
                            ? "border-green-400 bg-green-50" 
                            : "border-gray-300 hover:border-color-b hover:bg-blue-50"
                        }`}
                        onClick={() => document.getElementById(`rewardImage_${reward.id}`).click()}
                      >
                        {reward.imageFile ? (
                          <div className="flex items-center justify-center w-full h-full">
                            <img
                              src={URL.createObjectURL(reward.imageFile)}
                              alt="Reward Preview"
                              className="max-h-20 max-w-full object-contain rounded"
                            />
                          </div>
                        ) : (
                          <div className="text-center">
                            <FiUpload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Click to upload</p>
                          </div>
                        )}
                        <input
                          id={`rewardImage_${reward.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleRewardImageChange(reward.id, e.target.files[0])}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Reward Button */}
          <button
            type="button"
            onClick={addReward}
            className="w-full py-3 px-4 border-2 border-dashed border-color-b text-color-b rounded-xl hover:bg-color-b/5 transition-all duration-300 flex items-center justify-center space-x-2 font-semibold"
          >
            <FiPlus className="w-5 h-5" />
            <span>Add Reward Tier</span>
          </button>

          {formData.rewards.length === 0 && (
            <div className="text-center py-8">
              <FiTarget className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">No rewards created yet</p>
              <p className="text-xs text-gray-400">Click "Add Reward Tier" to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>,

    // Step 8 - Preview & Submit (ProjectDetails-style preview)
    <div className="space-y-3 w-full h-full overflow-hidden flex flex-col">
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Project Preview</h2>
        <p className="text-xs text-gray-600">This is how your project will look</p>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
          {/* Left Column - Image Only */}
          <div className="lg:col-span-2 space-y-3 overflow-y-auto pr-1">
            {/* Image Area */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="relative aspect-video bg-gray-100">
                {formData.imageFile ? (
                  <img
                    src={URL.createObjectURL(formData.imageFile)}
                    alt={formData.title || 'Project Image'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-10 h-10 border-4 border-color-b border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-xs text-gray-500">No image uploaded</p>
                    </div>
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-2 left-2">
                  <span className="inline-block px-2 py-1 bg-white/90 text-gray-800 rounded-full text-[10px] font-medium shadow">
                    {formData.category || 'General'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Funding Stats & Submit */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-3 sticky top-0">
              {/* Funding Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-lg font-bold text-gray-900">ETB 0</span>
                  <span className="text-xs text-gray-500">of ETB {Number(formData.fundingGoal || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                  <div className="h-2 rounded-full bg-color-b" style={{ width: '0%' }} />
                </div>
                <p className="text-[10px] text-gray-500">0% funded</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4 pb-4 border-b border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-500">Backers</p>
                  <p className="text-base font-bold text-gray-900">0</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">End Date</p>
                  <p className="text-base font-bold text-gray-900">{formData.endDate || 'TBD'}</p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-2.5 px-3 rounded-lg font-medium transition-all bg-gray-900 text-white hover:bg-gray-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit Project'
                )}
              </button>
            </div>
          </div>

          {/* Full-width Project Info */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <h1 className="text-xl font-bold text-gray-900 mb-2">{formData.title || 'Untitled Project'}</h1>
              <p className="text-gray-600 mb-3 text-sm">{formData.shortDescription || 'No short description provided.'}</p>

              {/* Quick Summary (from original preview) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-2 rounded-lg border border-blue-100">
                  <div className="flex items-center mb-1">
                    <FiDollarSign className="w-3 h-3 text-color-b mr-1" />
                    <span className="font-semibold text-gray-700 text-xs">Goal</span>
                  </div>
                  <p className="text-xs font-bold text-color-b">ETB {Number(formData.fundingGoal || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-2 rounded-lg border border-green-100">
                  <div className="flex items-center mb-1">
                    <FiCalendar className="w-3 h-3 text-green-600 mr-1" />
                    <span className="font-semibold text-gray-700 text-xs">End Date</span>
                  </div>
                  <p className="text-xs font-bold text-green-600">{formData.endDate || 'TBD'}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-2 rounded-lg border border-purple-100">
                  <div className="flex items-center mb-1">
                    <FiTag className="w-3 h-3 text-purple-600 mr-1" />
                    <span className="font-semibold text-gray-700 text-xs">City</span>
                  </div>
                  <p className="text-xs font-bold text-purple-600">{formData.city || 'N/A'}</p>
                </div>
              </div>

              {/* Long Description */}
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">About This Project</h2>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {formData.longDescription || 'No detailed description available.'}
                </div>
              </div>

              {/* Milestones Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Funding Milestones</h2>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(formData.milestones).map(([percentage, milestone]) => (
                    <div key={percentage} className="p-2 bg-white rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500">{percentage}%</div>
                      <div className="text-sm text-gray-800">{milestone.description || 'Not specified'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rewards Preview */}
              {formData.rewards.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg mt-3">
                  <button type="button" className="w-full p-2 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-semibold text-gray-900">Rewards ({formData.rewards.length})</div>
                  </button>
                  <div className="p-2 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {formData.rewards.map((r) => (
                      <div key={r.id} className="p-2 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="text-sm font-semibold text-gray-900 mb-1">{r.title || 'Reward'}</div>
                        <div className="text-xs text-gray-600 mb-1">{r.description || 'No description'}</div>
                        <div className="text-xs font-bold text-gray-900">ETB {r.amount || 0}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  ];

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <ToastContainer position="top-center" autoClose={4000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
        {/* Mobile Step Navigation */}
        <div className="md:hidden w-full mb-6">
          <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-white/20">
            {stepboxRefs.map((ref, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStep(idx + 1)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  activeStep === idx + 1 
                    ? "bg-gradient-to-r from-color-b to-blue-600 text-white shadow-lg scale-110" 
                    : "bg-white text-color-b hover:bg-gray-100 border-2 border-gray-200"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-gray-600 mt-3 font-medium">
            Step {activeStep} of 8: {getStepTitle(activeStep)}
          </p>
        </div>

        {/* Desktop Candlestick Layout */}
        <div className="hidden md:flex w-full justify-center items-center gap-6">
          {stepboxRefs.map((ref, idx) => (
            <div
              key={idx}
              ref={stepwrapperRefs[idx]}
              className="w-1/25 flex items-center justify-center relative"
              onClick={() => setActiveStep(idx + 1)}
            >
              <div
                ref={steplineRefs[idx]}
                className={`w-0.5 absolute ${idx === 5 && activeStep === 6 ? "border-l-2 border-dashed border-color-b" : "bg-gradient-to-b from-color-b to-blue-600"}`}
                style={{ height: idx + 1 === activeStep ? "90vh" : "50vh" }}
              ></div>

              <div
                ref={ref}
                className={`create border-3 bg-white/90 backdrop-blur-sm h-60 w-full font-titan flex relative z-10 mx-auto flex-none cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500
                  ${idx === 5 && activeStep === 6 ? "border-dashed rounded-xl border-color-b" : "border-solid border-color-b rounded-md"}`}
              >
                <p
                  className="text-color-b font-titan sm:text-xl md:text-3xl lg:text-5xl absolute"
                  style={{
                    top: activeStep === idx + 1 ? "flex-start" : "center",
                    left: activeStep === idx + 1 ? "flex-start" : "center",
                    transform: activeStep === idx + 1 ? "1rem" : "0rem",
                  }}
                >
                  {idx + 1}
                </p>

                {activeStep === idx + 1 && (
                  <div style={{ marginTop: "4rem", width: "100%" }}>
                    {stepContents[idx]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Step Content */}
        <div className="md:hidden w-full max-w-md mx-auto">
          <div className="bg-white/90 backdrop-blur-sm border-3 border-color-b rounded-2xl p-6 min-h-[500px] shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-color-b mb-3">Step {activeStep}</h2>
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-color-b to-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(activeStep / 8) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="w-full">
              {stepContents[activeStep - 1]}
            </div>
            
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                disabled={activeStep === 1}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeStep === 1
                    ? "opacity-50 cursor-not-allowed text-gray-400"
                    : "text-gray-600 hover:text-color-b hover:bg-gray-100"
                }`}
              >
                <FiChevronLeft className="w-5 h-5" />
                <span>Previous</span>
              </button>
              
              {activeStep < 8 ? (
                <button
                  onClick={() => setActiveStep(Math.min(8, activeStep + 1))}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-color-b to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg"
                >
                  <span>Next</span>
                  <FiChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Project</span>
                      <FiCheck className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div className={`max-w-4xl mx-auto mt-6 p-4 rounded-xl text-center font-semibold animate-fade-in-up ${
            message.includes("✅") 
              ? "bg-green-100 text-green-800 border border-green-200" 
              : "bg-red-100 text-red-800 border border-red-200"
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}





