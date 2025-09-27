import React, { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { db } from "../firebase/firebase-config";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FiUser, FiTag, FiAlignLeft, FiDollarSign, FiCalendar, FiImage, FiChevronRight, FiChevronLeft, FiUpload, FiCheck, FiX, FiPlus, FiTrash2, FiTarget } from "react-icons/fi";
import imgLogo from '../assets/images/img-logo.svg'
import { useAuth } from "../context/AuthContext";

export default function CreateProjectForm() {
  const navigate = useNavigate();
  const { currentUser, profileComplete } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    country: "",   // ✅ new field
    shortDescription: "",
    longDescription: "",
    fundingGoal: "",
    endDate: "",
    projectStartDate: "",
    projectLaunchDate: "",
    milestones: [],
    imageFile: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  const getStepTitle = (step) => {
    const titles = [
      "Project Details",
      "Description",
      "Funding Goal",
      "Campaign Timeline",
      "Project Image",
      "Preview & Submit"
    ];
    return titles[step - 1] || "Unknown Step";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, imageFile: e.target.files[0] }));
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const addDaysToDate = (dateString, days) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const getMilestoneMinDate = (currentIndex) => {
    if (currentIndex === 0) {
      // First milestone: minimum is project start date
      return formData.projectStartDate || getTodayDate();
    } else {
      // Subsequent milestones: minimum is previous milestone date + 1 day
      const previousMilestone = formData.milestones[currentIndex - 1];
      if (previousMilestone && previousMilestone.date) {
        return addDaysToDate(previousMilestone.date, 1);
      } else {
        // If previous milestone doesn't have a date, use project start date
        return formData.projectStartDate || getTodayDate();
      }
    }
  };

  const getRelativeDateLabel = (targetDate, referenceDate, referenceLabel) => {
    if (!targetDate || !referenceDate) return "";
    
    const target = new Date(targetDate);
    const reference = new Date(referenceDate);
    const diffTime = target - reference;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days before ${referenceLabel}`;
    if (diffDays === 0) return `Same day as ${referenceLabel}`;
    if (diffDays < 30) return `${diffDays} days after ${referenceLabel}`;
    
    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    
    if (remainingDays === 0) {
      return `${months} month${months > 1 ? 's' : ''} after ${referenceLabel}`;
    } else {
      return `${months} month${months > 1 ? 's' : ''} and ${remainingDays} days after ${referenceLabel}`;
    }
  };

  const getDaysFromNow = (targetDate) => {
    if (!targetDate) return "";
    
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days from now`;
  };

  const canAddMilestone = () => {
    if (!formData.projectLaunchDate) return false;
    if (formData.milestones.length === 0) return true;
    
    const lastMilestone = formData.milestones[formData.milestones.length - 1];
    return lastMilestone.title.trim() !== "" && 
           lastMilestone.description.trim() !== "" && 
           lastMilestone.date !== "";
  };

  const addMilestone = () => {
    if (!canAddMilestone()) return;
    
    const newMilestone = {
      id: Date.now(),
      title: "",
      description: "",
      date: "",
      milestoneStatus: "Incomplete"
    };
    setFormData((prev) => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone]
    }));
  };

  const removeMilestone = (id) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter(milestone => milestone.id !== id)
    }));
  };

  const updateMilestone = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.map(milestone =>
        milestone.id === id ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
    });

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
    // Gate: must be logged in and have completed profile
    if (!currentUser) {
      alert("Please sign in to proceed.");
      navigate(`/signing?redirectTo=/create`);
      return;
    }
    if (!profileComplete) {
      alert("Please complete your profile to proceed.");
      navigate(`/manage-profile?redirectTo=/create`);
      return;
    }
    setLoading(true);
    setMessage("");

    if (!formData.title) return setMessage("❌ Title is missing");
    if (!formData.category) return setMessage("❌ Category is missing");
    if (!formData.country) return setMessage("❌ Country is missing");
    if (!formData.shortDescription) return setMessage("❌ Short description is missing");
    if (!formData.longDescription) return setMessage("❌ Long description is missing");
    if (!formData.fundingGoal) return setMessage("❌ Funding goal is missing");
    if (!formData.endDate) return setMessage("❌ Campaign end date is missing");
    if (!formData.projectStartDate) return setMessage("❌ Project start date is missing");
    if (!formData.projectLaunchDate) return setMessage("❌ Project launch date is missing");
    if (!formData.imageFile) return setMessage("❌ Image not uploaded");

    // Validate date sequence
    const endDate = new Date(formData.endDate);
    const startDate = new Date(formData.projectStartDate);
    const launchDate = new Date(formData.projectLaunchDate);
    
    if (startDate < endDate) {
      setLoading(false);
      return setMessage("❌ Project start date must be on or after campaign end date");
    }
    
    // Check for minimum one day gap between start and launch
    const timeDiff = launchDate - startDate;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 1) {
      setLoading(false);
      return setMessage("❌ Project launch date must be at least one day after project start date");
    }

    // Validate milestone date sequence
    for (let i = 0; i < formData.milestones.length; i++) {
      const milestone = formData.milestones[i];
      if (milestone.date) {
        const milestoneDate = new Date(milestone.date);
        
        // Check if milestone is after project start
        if (milestoneDate < startDate) {
          setLoading(false);
          return setMessage(`❌ Milestone ${i + 1} date must be on or after project start date`);
        }
        
        // Check if milestone is before project launch
        if (milestoneDate >= launchDate) {
          setLoading(false);
          return setMessage(`❌ Milestone ${i + 1} date must be before project launch date`);
        }
        
        // Check if milestone is after previous milestone (if exists)
        if (i > 0 && formData.milestones[i - 1].date) {
          const prevMilestoneDate = new Date(formData.milestones[i - 1].date);
          if (milestoneDate <= prevMilestoneDate) {
            setLoading(false);
            return setMessage(`❌ Milestone ${i + 1} date must be after milestone ${i} date`);
          }
        }
      }
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("You must be logged in");

      const imageUrl = await uploadImage(formData.imageFile);
      const today = new Date();
      const endDate = new Date(formData.endDate);
      const duration = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

      const { imageFile, ...dataWithoutFile } = formData;

      const projectData = {
        ...dataWithoutFile,
        imageUrl,
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
      };


      const projectRef = await addDoc(collection(db, "projects"), projectData);
      setMessage("✅ Project submitted successfully!");
      // Create a notification for the submitting user
      try {
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
      console.log('submitted project successfully')
      // Reset form
      setActiveStep(1); 

      setFormData({
        title: "",
        category: "",
        country: "",
        shortDescription: "",
        longDescription: "",
        fundingGoal: "",
        endDate: "",
        projectStartDate: "",
        projectLaunchDate: "",
        milestones: [],
        imageFile: null,
      });
      navigate("/projects");
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to submit project.");
    }

    setLoading(false);
  };

  // GSAP refs
  const stepwrapperRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const steplineRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const stepboxRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    // Create a timeline for simultaneous animations
    const tl = gsap.timeline();

    stepwrapperRefs.forEach((step, idx) => {
      if (idx + 1 === activeStep) {
        tl.to(step.current, { width: "75%", y: 0, duration: 0.5, ease: "power2.out" }, 0);
      } else {
        tl.to(step.current, { width: "5%", y: (idx + 1) * 20, duration: 0.5, ease: "power2.out" }, 0);
      }
    });

    steplineRefs.forEach((step, idx) => {
      if (idx + 1 === activeStep) {
        tl.to(step.current, { height: "70vh", y: 0, duration: 0.5, ease: "power2.out" }, 0);
      } else {
        tl.to(step.current, { height: "30vh", duration: 0.5, ease: "power2.out" }, 0);
      }
    });

    stepboxRefs.forEach((step, idx) => {
      if (!step.current) return;
      const isActive = idx + 1 === activeStep;

      // Simultaneous diagonal expansion animation
      tl.to(step.current, {
        height: isActive ? "65vh" : "25vh",
        width: isActive ? "100%" : "100%",
        padding: isActive ? "0.8rem" : "0.3rem",
        duration: 0.5,
        ease: "power2.out",
      }, 0);

      step.current.style.display = "flex";
      step.current.style.flexDirection = "column";
      step.current.style.justifyContent = "flex-start";
      step.current.style.alignItems = "flex-start";
      step.current.style.overflow = "hidden";

      // Animate number position simultaneously
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

      // Show/hide content except number
      Array.from(step.current.children).forEach((child) => {
        if (child.tagName !== "P") {
          child.style.display = isActive ? "block" : "none";
        }
      });
    });
  }, [activeStep]);


  const stepContents = [
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
                <option value="cars">🚗 Cars & Automotive</option>
                <option value="cloth">👕 Fashion & Clothing</option>
                <option value="books">📚 Books & Literature</option>
        </select>
              <FiChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
            </div>
      </div>

          <div className="relative group">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Country *</label>
      <div className="relative">
              <FiTag className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 group-focus-within:text-color-b transition-colors pointer-events-none" />
        <select
          name="country"
          value={formData.country}
          onChange={handleChange}
                className="appearance-none w-full pl-10 pr-8 py-3 border-2 border-gray-200 rounded-xl focus:border-color-b focus:ring-2 focus:ring-color-b/20 transition-all duration-300 text-gray-800 bg-white cursor-pointer text-sm"
        >
          <option value="">Select Country</option>
                <option value="Ethiopia">🇪🇹 Ethiopia</option>
                <option value="USA">🇺🇸 United States</option>
                <option value="Germany">🇩🇪 Germany</option>
                <option value="India">🇮🇳 India</option>
                <option value="Japan">🇯🇵 Japan</option>
        </select>
              <FiChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>,

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

    <div className="space-y-4 w-full h-full overflow-hidden flex flex-col items-center justify-center">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Funding Goal</h2>
        <p className="text-sm text-gray-600">Set your funding target</p>
      </div>
      
      <div className="w-full max-w-sm">
        <div className="relative group">
          <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">Funding Goal (USD) *</label>
      <div className="relative">
            <FiDollarSign className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-400 group-focus-within:text-color-b transition-colors" />
            <input 
              type="number" 
              name="fundingGoal" 
              placeholder="Enter amount in USD" 
              value={formData.fundingGoal} 
          onChange={handleChange}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-color-b focus:ring-2 focus:ring-color-b/20 transition-all duration-300 text-gray-800 placeholder-gray-400 text-center text-xl font-bold" 
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">Minimum amount you need to raise</p>
      </div>
      </div>
    </div>,

    <div className="space-y-4 w-full h-full flex flex-col">
      <div className="text-center mb-4 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Project Timeline</h2>
        <p className="text-sm text-gray-600">Set your campaign and project timeline</p>
      </div>
      
      <div className="space-y-4 flex-1 overflow-y-auto pr-2">
        {/* Campaign End Date */}
        <div className="relative group">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign End Date *</label>
          <div className="relative">
            <FiCalendar className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 group-focus-within:text-color-b transition-colors" />
            <input 
              type="date" 
              name="endDate" 
              value={formData.endDate} 
              onChange={handleChange}
              min={getTodayDate()}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-color-b focus:ring-2 focus:ring-color-b/20 transition-all duration-300 text-gray-800 text-sm" 
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            When your funding campaign will end (cannot be before today)
            {formData.endDate && (
              <span className="text-blue-600 font-medium ml-2">
                ({getDaysFromNow(formData.endDate)})
              </span>
            )}
          </p>
        </div>

        {/* Project Start Date */}
        <div className={`relative group ${!formData.endDate ? 'opacity-50' : ''}`}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Project Development Start Date *
            {!formData.endDate && <span className="text-red-500 ml-1">(Select campaign end date first)</span>}
          </label>
          <div className="relative">
            <FiCalendar className={`absolute top-1/2 left-3 transform -translate-y-1/2 transition-colors ${
              !formData.endDate ? 'text-gray-300' : 'text-gray-400 group-focus-within:text-color-b'
            }`} />
            <input 
              type="date" 
              name="projectStartDate" 
              value={formData.projectStartDate} 
              onChange={handleChange}
              min={formData.endDate || getTodayDate()}
              disabled={!formData.endDate}
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl transition-all duration-300 text-sm ${
                !formData.endDate 
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'border-gray-200 focus:border-color-b focus:ring-2 focus:ring-color-b/20 text-gray-800'
              }`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Must be on or after campaign end date
            {formData.projectStartDate && formData.endDate && (
              <span className="text-blue-600 font-medium ml-2">
                ({getRelativeDateLabel(formData.projectStartDate, formData.endDate, "campaign end")})
              </span>
            )}
          </p>
        </div>

        {/* Project Launch Date */}
        <div className={`relative group ${!formData.projectStartDate ? 'opacity-50' : ''}`}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Estimated Project Launch Date *
            {!formData.projectStartDate && <span className="text-red-500 ml-1">(Select project start date first)</span>}
          </label>
          <div className="relative">
            <FiTarget className={`absolute top-1/2 left-3 transform -translate-y-1/2 transition-colors ${
              !formData.projectStartDate ? 'text-gray-300' : 'text-gray-400 group-focus-within:text-color-b'
            }`} />
            <input 
              type="date" 
              name="projectLaunchDate" 
              value={formData.projectLaunchDate} 
              onChange={handleChange}
              min={addDaysToDate(formData.projectStartDate, 1) || getTodayDate()}
              disabled={!formData.projectStartDate}
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl transition-all duration-300 text-sm ${
                !formData.projectStartDate 
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'border-gray-200 focus:border-color-b focus:ring-2 focus:ring-color-b/20 text-gray-800'
              }`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Must be at least one day after project start date
            {formData.projectLaunchDate && formData.projectStartDate && (
              <>
                <span className="text-blue-600 font-medium ml-2">
                  ({getRelativeDateLabel(formData.projectLaunchDate, formData.projectStartDate, "project start")})
                </span>
                {(() => {
                  const startDate = new Date(formData.projectStartDate);
                  const launchDate = new Date(formData.projectLaunchDate);
                  const diffDays = Math.ceil((launchDate - startDate) / (1000 * 60 * 60 * 24));
                  if (diffDays < 30) {
                    return (
                      <span className="text-amber-600 font-medium ml-2 block mt-1">
                        ⚠️ Development period less than 30 days - not recommended
                      </span>
                    );
                  }
                  return null;
                })()}
              </>
            )}
          </p>
        </div>

        {/* Milestones Section */}
        <div className={`border-t pt-4 ${!formData.projectLaunchDate ? 'opacity-50' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Project Milestones
              {!formData.projectLaunchDate && <span className="text-red-500 ml-1">(Complete timeline first)</span>}
            </h3>
            <button
              type="button"
              onClick={addMilestone}
              disabled={!canAddMilestone() || !formData.projectLaunchDate}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors text-xs ${
                canAddMilestone() && formData.projectLaunchDate
                  ? "bg-color-b text-white hover:bg-blue-600" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <FiPlus className="w-3 h-3" />
              <span>Add Milestone</span>
            </button>
          </div>

          {!canAddMilestone() && formData.milestones.length > 0 && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                Complete the current milestone (title, description, and date) before adding a new one.
              </p>
            </div>
          )}

          {formData.milestones.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <FiTarget className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No milestones added yet</p>
              <p className="text-xs text-gray-400">Add milestones to track your project progress</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {formData.milestones.map((milestone, index) => (
                <div key={milestone.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">Milestone {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeMilestone(milestone.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Milestone title"
                      value={milestone.title}
                      onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-color-b focus:ring-1 focus:ring-color-b/20 transition-all text-xs"
                    />
                    
                    <textarea
                      placeholder="Milestone description"
                      value={milestone.description}
                      onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-color-b focus:ring-1 focus:ring-color-b/20 transition-all text-xs resize-none"
                    />
                    
                    <div className="space-y-1">
                      <input
                        type="date"
                        value={milestone.date}
                        onChange={(e) => updateMilestone(milestone.id, 'date', e.target.value)}
                        min={getMilestoneMinDate(index)}
                        max={formData.projectLaunchDate}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-color-b focus:ring-1 focus:ring-color-b/20 transition-all text-xs"
                      />
                      {milestone.date && (
                        <div className="space-y-1">
                          <p className="text-xs text-purple-600 font-medium">
                            {index === 0 
                              ? getRelativeDateLabel(milestone.date, formData.projectStartDate, "project start")
                              : formData.milestones[index - 1]?.date 
                                ? getRelativeDateLabel(milestone.date, formData.milestones[index - 1].date, `milestone ${index}`)
                                : getRelativeDateLabel(milestone.date, formData.projectStartDate, "project start")
                            }
                          </p>
                          {index > 0 && formData.milestones[index - 1]?.date && milestone.date && (
                            (() => {
                              const prevDate = new Date(formData.milestones[index - 1].date);
                              const currentDate = new Date(milestone.date);
                              const diffDays = Math.ceil((currentDate - prevDate) / (1000 * 60 * 60 * 24));
                              if (diffDays < 7) {
                                return (
                                  <p className="text-xs text-amber-600 font-medium">
                                    ⚠️ Less than 7 days from previous milestone
                                  </p>
                                );
                              }
                              return null;
                            })()
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,

    <div className="space-y-4 w-full h-full overflow-hidden flex flex-col items-center justify-center">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Project Image</h2>
        <p className="text-sm text-gray-600">Upload a compelling image for your project</p>
      </div>
      
      <div
        className={`relative w-full h-full max-h-[50vh] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer group ${
          formData.imageFile 
            ? "border-green-400 bg-green-50" 
            : "border-gray-300 hover:border-color-b hover:bg-blue-50"
        }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          setFormData((prev) => ({ ...prev, imageFile: e.dataTransfer.files[0] }));
        }
      }}
      onClick={() => document.getElementById("imageInput").click()}
    >
        {formData.imageFile ? (
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiCheck className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-1">Image Uploaded!</h3>
            <p className="text-green-600 mb-4 text-sm">Your project image is ready</p>
            <img
              src={URL.createObjectURL(formData.imageFile)}
              alt="Preview"
              className="w-48 h-32 object-cover rounded-xl shadow-lg mx-auto mb-3"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFormData((prev) => ({ ...prev, imageFile: null }));
              }}
              className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
            >
              <FiX className="w-3 h-3 inline mr-1" />
              Remove
            </button>
          </div>
        ) : (
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-color-b/10 transition-colors">
              <FiUpload className="w-8 h-8 text-gray-400 group-hover:text-color-b transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Project Image</h3>
            <p className="text-gray-600 mb-3 text-sm">Drag and drop your image here, or click to browse</p>
            <div className="text-xs text-gray-500">
              PNG, JPG, GIF up to 10MB
            </div>
          </div>
        )}

        {/* Hidden file input */}
      <input
        id="imageInput"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      </div>
    </div>,

    <div className="space-y-3 w-full h-full flex flex-col">
      <div className="text-center mb-2 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Project Preview</h2>
        <p className="text-xs text-gray-600">Review your project before submitting</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 flex-1 flex flex-col overflow-y-auto">
        {/* Hero Section */}
        <div className="relative">
          {formData.imageFile ? (
            <img
              src={URL.createObjectURL(formData.imageFile)}
              alt="Project Preview"
              className="w-full h-20 object-cover"
            />
          ) : (
            <div className="w-full h-20 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-center">
                <FiImage className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <p className="text-gray-500 text-xs">No image</p>
              </div>
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-1 left-1">
            <span className="bg-white/90 backdrop-blur-sm text-color-b px-2 py-1 rounded-full text-xs font-semibold flex items-center shadow-lg">
              <FiTag className="mr-1 w-3 h-3" />
              {formData.category || 'General'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col">
          {/* Title and Description */}
          <div className="mb-3">
            <h1 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">
              {formData.title || 'Untitled Project'}
            </h1>
            <p className="text-gray-600 text-xs leading-relaxed line-clamp-1">
              {formData.shortDescription || 'No short description provided.'}
            </p>
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-2 gap-1 mb-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-2 rounded-lg border border-blue-100">
              <div className="flex items-center mb-1">
                <FiDollarSign className="w-3 h-3 text-color-b mr-1" />
                <span className="font-semibold text-gray-700 text-xs">Goal</span>
              </div>
              <p className="text-xs font-bold text-color-b">${formData.fundingGoal || 0}</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-2 rounded-lg border border-purple-100">
              <div className="flex items-center mb-1">
                <FiTag className="w-3 h-3 text-purple-600 mr-1" />
                <span className="font-semibold text-gray-700 text-xs">Country</span>
              </div>
              <p className="text-xs font-bold text-purple-600">{formData.country || 'N/A'}</p>
            </div>
          </div>

          {/* Timeline Info */}
          <div className="grid grid-cols-3 gap-1 mb-3">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-2 rounded-lg border border-blue-100">
              <div className="flex items-center mb-1">
                <FiCalendar className="w-3 h-3 text-blue-600 mr-1" />
                <span className="font-semibold text-gray-700 text-xs">Dev Start</span>
              </div>
              <p className="text-xs font-bold text-blue-600">{formData.projectStartDate || 'TBD'}</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-2 rounded-lg border border-green-100">
              <div className="flex items-center mb-1">
                <FiCalendar className="w-3 h-3 text-green-600 mr-1" />
                <span className="font-semibold text-gray-700 text-xs">Campaign End</span>
              </div>
              <p className="text-xs font-bold text-green-600">{formData.endDate || 'TBD'}</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-2 rounded-lg border border-orange-100">
              <div className="flex items-center mb-1">
                <FiTarget className="w-3 h-3 text-orange-600 mr-1" />
                <span className="font-semibold text-gray-700 text-xs">Launch</span>
              </div>
              <p className="text-xs font-bold text-orange-600">{formData.projectLaunchDate || 'TBD'}</p>
            </div>
          </div>

          {/* Milestones Preview */}
          {formData.milestones.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-2 mb-3">
              <h4 className="text-xs font-bold text-gray-900 mb-1">Milestones ({formData.milestones.length})</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {formData.milestones.map((milestone, index) => (
                  <div key={milestone.id} className="text-xs text-gray-600">
                    <span className="font-semibold">{milestone.title || `Milestone ${index + 1}`}</span>
                    {milestone.date && <span className="text-gray-500 ml-1">({milestone.date})</span>}
                    {milestone.description && (
                      <div className="text-gray-500 mt-1 text-xs line-clamp-1">
                        {milestone.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Description */}
          <div className="bg-gray-50 rounded-lg p-2 flex-1">
            <h3 className="text-xs font-bold text-gray-900 mb-1">About This Project</h3>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-xs line-clamp-3 overflow-y-auto">
              {formData.longDescription || 'No detailed description available.'}
        </div>
      </div>

          {/* Submit Button */}
          <div className="mt-3 pt-2 border-t border-gray-200">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Submitting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span>Submit Project</span>
                  <FiCheck className="w-4 h-4 ml-1" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>


  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-titan bg-gradient-to-r from-color-b via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 animate-fade-in-up">
            Create Your Project
          </h1>
          <p className="text-lg text-gray-600 animate-fade-in-up animation-delay-200">
            Bring your ideas to life with our modern project creation platform
          </p>
        </div>

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
            Step {activeStep} of 6: {getStepTitle(activeStep)}
          </p>
      </div>

        {/* Desktop Candlestick Layout */}
      <div className="hidden md:flex w-full justify-center items-center gap-10">
        {stepboxRefs.map((ref, idx) => (
          <div
            key={idx}
            ref={stepwrapperRefs[idx]}
            className="w-1/25 flex items-center justify-center relative"
            onClick={() => setActiveStep(idx + 1)}
          >
            {/* Step line */}
            <div
              ref={steplineRefs[idx]}
                className={`w-0.5 absolute ${idx === 4 && activeStep === 5 ? "border-l-2 border-dashed border-color-b" : "bg-gradient-to-b from-color-b to-blue-600"}`}
              style={{ height: idx + 1 === activeStep ? "90vh" : "50vh" }}
            ></div>

            {/* Step box */}
            <div
              ref={ref}
                className={`create border-3 bg-white/90 backdrop-blur-sm ${activeStep === idx + 1 && idx === 3 ? 'h-96' : 'h-60'} w-full font-titan flex relative z-10 mx-auto flex-none cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500
                  ${idx === 4 && activeStep === 5 ? "border-dashed rounded-xl border-color-b" : "border-solid rounded-none border-color-b"}`}
            >
              {/* Number */}
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

              {/* Content visible only when expanded */}
              {activeStep === idx + 1 && (
                <div style={{ marginTop: "4rem", width: "100%", height: "calc(100% - 4rem)", overflow: "hidden" }}>
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
                style={{ width: `${(activeStep / 6) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="w-full">
              {stepContents[activeStep - 1]}
          </div>
          
          {/* Mobile Navigation Buttons */}
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
            
            {activeStep < 6 ? (
              <button
                onClick={() => setActiveStep(Math.min(6, activeStep + 1))}
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

        {/* Message */}
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
