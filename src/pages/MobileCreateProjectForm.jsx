import React, { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { db } from "../firebase/firebase-config";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FiUser, FiTag, FiAlignLeft, FiDollarSign } from "react-icons/fi";
import imgLogo from "../assets/images/img-logo.svg";

export default function CreateProjectForm() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    country: "",
    shortDescription: "",
    longDescription: "",
    fundingGoal: "",
    endDate: "",
    imageFile: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, imageFile: e.target.files[0] }));
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
    setLoading(true);
    setMessage("");

    if (!formData.title) return setMessage("❌ Title is missing");
    if (!formData.category) return setMessage("❌ Category is missing");
    if (!formData.country) return setMessage("❌ Country is missing");
    if (!formData.shortDescription) return setMessage("❌ Short description is missing");
    if (!formData.longDescription) return setMessage("❌ Long description is missing");
    if (!formData.fundingGoal) return setMessage("❌ Funding goal is missing");
    if (!formData.endDate) return setMessage("❌ End date is missing");
    if (!formData.imageFile) return setMessage("❌ Image not uploaded");

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

      await addDoc(collection(db, "projects"), projectData);
      setMessage("✅ Project submitted successfully!");
      setActiveStep(1);
      setFormData({
        title: "",
        category: "",
        country: "",
        shortDescription: "",
        longDescription: "",
        fundingGoal: "",
        endDate: "",
        imageFile: null,
      });
      navigate("/view-my-projects");
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to submit project.");
    }

    setLoading(false);
  };

  // GSAP refs
  const stepwrapperRefs = Array.from({ length: 6 }, () => useRef(null));
  const steplineRefs = Array.from({ length: 6 }, () => useRef(null));
  const stepboxRefs = Array.from({ length: 6 }, () => useRef(null));

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Animate steps
  useEffect(() => {
    const mobileInactiveHeight = "12vh"; // 6 steps fit nicely on phone
    const mobileActiveHeight = "30vh";
    const desktopInactiveHeight = "20vh";
    const desktopActiveHeight = "65vh";

    stepwrapperRefs.forEach((step, idx) => {
      if (idx + 1 === activeStep) {
        gsap.to(step.current, {
          width: isMobile ? "95%" : "70%",
          duration: 0.5,
          ease: "power2.out",
          y: 0,
        });
      } else {
        gsap.to(step.current, {
          width: isMobile ? "95%" : "15%",
          duration: 0.5,
          ease: "power2.out",
          y: 0,
        });
      }
    });

    steplineRefs.forEach((step, idx) => {
      gsap.to(step.current, {
        height:
          idx + 1 === activeStep
            ? isMobile
              ? mobileActiveHeight
              : desktopActiveHeight
            : isMobile
            ? mobileInactiveHeight
            : desktopInactiveHeight,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
      });
    });

    stepboxRefs.forEach((step, idx) => {
      if (!step.current) return;
      const isActive = idx + 1 === activeStep;

      gsap.to(step.current, {
        minHeight: isActive
          ? isMobile
            ? mobileActiveHeight
            : desktopActiveHeight
          : isMobile
          ? mobileInactiveHeight
          : desktopInactiveHeight,
        maxHeight: "70vh",
        padding: isActive ? "1rem" : "0.5rem",
        duration: 0.5,
        ease: "power2.out",
      });

      step.current.style.display = "flex";
      step.current.style.flexDirection = "column";
      step.current.style.justifyContent = "flex-start";
      step.current.style.alignItems = "flex-start";
      step.current.style.overflowY = "auto";

      const numberEl = step.current.querySelector("p");
      if (numberEl) {
        gsap.to(numberEl, {
          top: "0.5rem",
          left: "0.5rem",
          x: 0,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        });
      }

      Array.from(step.current.children).forEach((child) => {
        if (child.tagName !== "P") child.style.display = isActive ? "block" : "none";
      });
    });
  }, [activeStep, isMobile]);

  const handleTouchStart = (e) =>
    (touchStartX.current = e.changedTouches[0].screenX);
  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    const deltaX = touchEndX.current - touchStartX.current;
    if (Math.abs(deltaX) < 50) return;
    if (deltaX > 0 && activeStep > 1) setActiveStep(activeStep - 1);
    else if (deltaX < 0 && activeStep < stepboxRefs.length)
      setActiveStep(activeStep + 1);
  };

  // Step contents
  const stepContents = [
    // Step 1
    <div className="space-y-4 w-full">
      <div className="relative">
        <FiUser className="absolute top-1/2 left-3 transform -translate-y-1/2" />
        <input
          type="text"
          name="title"
          placeholder="Project Title"
          value={formData.title}
          onChange={handleChange}
          className="w-full pl-10 p-2 border rounded-lg"
        />
      </div>
      <div className="relative">
        <FiTag className="absolute top-1/2 left-3 transform -translate-y-1/2" />
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full pl-10 pr-8 p-2 border rounded-lg"
        >
          <option value="">Select Category</option>
          <option value="cars">Cars</option>
          <option value="cloth">Cloth</option>
          <option value="books">Books</option>
        </select>
      </div>
      <div className="relative">
        <FiTag className="absolute top-1/2 left-3 transform -translate-y-1/2" />
        <select
          name="country"
          value={formData.country}
          onChange={handleChange}
          className="w-full pl-10 pr-8 p-2 border rounded-lg"
        >
          <option value="">Select Country</option>
          <option value="Ethiopia">Ethiopia</option>
          <option value="USA">USA</option>
          <option value="Germany">Germany</option>
          <option value="India">India</option>
          <option value="Japan">Japan</option>
        </select>
      </div>
    </div>,
    // Step 2
    <div className="space-y-4 w-full">
      <div className="relative">
        <FiAlignLeft className="absolute top-2 left-3" />
        <textarea
          name="shortDescription"
          placeholder="Short Description"
          value={formData.shortDescription}
          onChange={handleChange}
          rows="2"
          className="w-full pl-10 p-2 border rounded-lg"
        />
      </div>
      <div className="relative">
        <FiAlignLeft className="absolute top-2 left-3" />
        <textarea
          name="longDescription"
          placeholder="Long Description"
          value={formData.longDescription}
          onChange={handleChange}
          rows="5"
          className="w-full pl-10 p-2 border rounded-lg"
        />
      </div>
    </div>,
    // Step 3
    <div className="relative w-full">
      <FiDollarSign className="absolute top-1/2 left-3 transform -translate-y-1/2" />
      <input
        type="number"
        name="fundingGoal"
        placeholder="Funding Goal (USD)"
        value={formData.fundingGoal}
        onChange={handleChange}
        className="w-full pl-10 p-2 border rounded-lg"
      />
    </div>,
    // Step 4
    <div className="relative w-full">
      <label className="block font-medium mb-1">Campaign End Date</label>
      <input
        type="date"
        name="endDate"
        value={formData.endDate}
        onChange={handleChange}
        className="w-full p-2 border rounded-lg"
      />
    </div>,
    // Step 5
    <div
      className="relative w-full h-60 md:h-80 flex flex-col items-center justify-center rounded-xl cursor-pointer border-2 border-dashed overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0])
          setFormData((prev) => ({
            ...prev,
            imageFile: e.dataTransfer.files[0],
          }));
      }}
      onClick={() => document.getElementById("imageInput").click()}
    >
      <img src={imgLogo} alt="" className="w-16 mb-4" />
      <p className="mb-2">Drag and Drop</p>
      <p className="mb-4">OR</p>
      <input
        id="imageInput"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          document.getElementById("imageInput").click();
        }}
        className="px-6 py-2 bg-color-b text-color-d rounded-lg hover:bg-color-e"
      >
        Upload Image
      </button>
      {formData.imageFile && (
        <img
          src={URL.createObjectURL(formData.imageFile)}
          alt="Preview"
          className="mt-4 w-48 rounded-lg border object-cover"
        />
      )}
    </div>,
    // Step 6
    <div className="w-full h-[60vh] md:h-[65vh] overflow-y-auto px-2 md:px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 md:gap-10">
        <div className="relative w-full md:w-3/4 h-48 md:h-64 rounded-xl overflow-hidden border border-gray-300">
          {formData.imageFile ? (
            <img
              src={URL.createObjectURL(formData.imageFile)}
              alt="Preview"
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-xl text-gray-500">
              No image selected
            </div>
          )}
          <span className="absolute top-2 left-2 bg-white/90 px-3 py-1 rounded-full text-sm font-semibold flex items-center">
            {formData.category || "General"}
          </span>
        </div>
        <div className="flex flex-col w-full md:w-1/4 gap-4">
          <div>
            <span className="font-semibold">Country:</span>{" "}
            {formData.country || "N/A"}
          </div>
          <div>
            <span className="font-semibold">Funding Goal:</span> $
            {formData.fundingGoal || 0}
          </div>
          <div>
            <span className="font-semibold">End Date:</span>{" "}
            {formData.endDate || "TBD"}
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mt-6 break-words">
            <h2 className="text-2xl font-bold mb-4">About This Project</h2>
            <p>
            {formData.longDescription || "No detailed description available."}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-4 w-full py-3 rounded-xl font-semibold text-lg bg-color-b text-white"
          >
            {loading ? "Submitting..." : "Submit Project"}
          </button>
        </div>
      </div>
      
    </div>,
  ];

  return (
    <div className="flex flex-col items-center min-h-screen p-4 md:p-6">
      <h1 className="text-3xl font-titan mb-6">Create a New Project</h1>
      <div
        className="flex flex-col md:flex-row w-full justify-start items-start gap-4 md:gap-10 overflow-x-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {stepboxRefs.map((ref, idx) => (
          <div
            key={idx}
            ref={stepwrapperRefs[idx]}
            className="flex-shrink-0 w-full md:w-40 relative cursor-pointer"
            onClick={() => setActiveStep(idx + 1)}
          >
            <div
              ref={steplineRefs[idx]}
              className={`w-0.5 absolute top-0 left-1/2 transform -translate-x-1/2 ${
                idx === 4 && activeStep === 5
                  ? "border-l-2 border-dashed border-color-e"
                  : "bg-color-e"
              }`}
            ></div>
            <div
              ref={ref}
              className={`create border-3 bg-color-d w-full flex relative z-10 rounded-xl`}
            >
              <p className="absolute text-color-b font-bold sm:text-xl md:text-3xl lg:text-5xl top-2 left-2">
                {idx + 1}
              </p>
              {activeStep === idx + 1 && (
                <div className="w-full mt-4 px-2 md:px-4">
                  {stepContents[idx]}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {message && (
        <p className="text-center mt-4 font-semibold text-gray-700">{message}</p>
      )}
    </div>
  );
}