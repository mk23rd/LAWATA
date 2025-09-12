import React, { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { db } from "../firebase/firebase-config";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
// import { FiUser, FiTag, FiAlignLeft, FiDollarSign, FiCalendar, FiImage } from "react-icons/fi";
import imgLogo from '../assets/images/img-logo.svg'

export default function CreateProjectForm() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    shortDescription: "",
    longDescription: "",
    fundingGoal: "",
    endDate: "",
    imageFile: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
          name: user.displayName || "Anonymous",
        },
      };

      await addDoc(collection(db, "projects"), projectData);
      setMessage("✅ Project submitted successfully!");
      
      // Reset form
      setStep(1);
      setFormData({
        title: "",
        category: "",
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
  const stepwrapperRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const steplineRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const stepboxRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    stepwrapperRefs.forEach((step, idx) => {
      if (idx + 1 === activeStep) {
        gsap.to(step.current, { width: "75%", duration: 0.5, ease: "power2.out", y: 0 });
      } else {
        gsap.to(step.current, { width: "5%", duration: 0.5, ease: "power2.out", y: (idx + 1) * 20 });
      }
    });

    steplineRefs.forEach((step, idx) => {
      if (idx + 1 === activeStep) {
        gsap.to(step.current, { height: "90vh", y: 0, duration: 0.5, ease: "power2.out" });
      } else {
        gsap.to(step.current, { height: "50vh", duration: 0.5, ease: "power2.out" });
      }
    });

    stepboxRefs.forEach((step, idx) => {
      if (!step.current) return;
      const isActive = idx + 1 === activeStep;

      gsap.to(step.current, {
        height: isActive ? "80vh" : "40vh",
        padding: isActive ? "1rem" : "0.5rem",
        duration: 0.5,
        ease: "power2.out",
      });

      step.current.style.display = "flex";
      step.current.style.flexDirection = "column";
      step.current.style.justifyContent = "flex-start";
      step.current.style.alignItems = "flex-start";

      // Animate number position
      const numberEl = step.current.querySelector("p");
      if (numberEl) {
        gsap.to(numberEl, {
          top: isActive ? "1rem" : "50%",
          left: isActive ? "1rem" : "50%",
          x: isActive ? 0 : "-50%",
          y: isActive ? 0 : "-50%",
          duration: 0.5,
          ease: "power2.out",
        });
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
    <div className="space-y-4 w-full">
      <div className="relative">
        <FiUser className="absolute top-1/2 left-3 transform -translate-y-1/2 text-color-e" />
        <input type="text" name="title" placeholder="Project Title" value={formData.title} onChange={handleChange} className="text-color-e w-full pl-10 p-2 border rounded-lg" />
      </div>
      <div className="relative">
        <FiTag className="absolute top-1/2 left-3 transform -translate-y-1/2 text-color-e" />
        <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleChange} className="text-color-e w-full pl-10 p-2 border rounded-lg" />
      </div>
    </div>,

    <div className="space-y-4 w-full">
      <div className="relative">
        <FiAlignLeft className="absolute top-2 left-3 text-color-e" />
        <textarea name="shortDescription" placeholder="Short Description" value={formData.shortDescription} onChange={handleChange} rows="2" className="w-full pl-10 p-2 border rounded-lg" />
      </div>
      <div className="relative">
        <FiAlignLeft className="absolute top-2 left-3 text-color-e" />
        <textarea name="longDescription" placeholder="Long Description" value={formData.longDescription} onChange={handleChange} rows="5" className="w-full pl-10 p-2 border rounded-lg" />
      </div>
    </div>,

    <div className="relative w-full">
      <FiDollarSign className="absolute top-1/2 left-3 transform -translate-y-1/2 text-color-e" />
      <input type="number" name="fundingGoal" placeholder="Funding Goal (USD)" value={formData.fundingGoal} onChange={handleChange} className="w-full pl-10 p-2 border rounded-lg" />
    </div>,

    <div className="relative w-full">
      <label className="block text-color-e font-medium mb-1">Campaign End Date</label>
      <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full pl-10 p-2 border rounded-lg" />
    </div>,

    // Step 5 (Image Upload)
    <div
      className="relative w-full h-100 flex flex-col items-center justify-center rounded-xl cursor-pointer p-6"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          setFormData((prev) => ({ ...prev, imageFile: e.dataTransfer.files[0] }));
        }
      }}
      onClick={() => document.getElementById("imageInput").click()} // whole box still clickable
    >
      <img src={imgLogo} alt="" className="w-20 mb-4" />
      <p className="text-color-e text-xl font-medium mb-2">Drag and Drop</p>
      <p className="text-color-e text-xl font-medium mb-4">OR</p>

      {/* Hidden file input */}
      <input
        id="imageInput"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // prevent triggering the whole box click
          document.getElementById("imageInput").click();
        }}
        className="px-6 py-2 bg-color-b text-color-d rounded-lg hover:bg-color-e"
      >
        Upload Image
      </button>

      {/* Preview */}
      {formData.imageFile && (
        <img
          src={URL.createObjectURL(formData.imageFile)}
          alt="Preview"
          className="mt-4 w-48 rounded-lg border"
        />
      )}
    </div>,

    <div className="space-y-2 w-full">
      <h3 className="font-semibold text-lg">Preview</h3>
      <p><strong>Title:</strong> {formData.title}</p>
      <p><strong>Category:</strong> {formData.category}</p>
      <p><strong>Short Description:</strong> {formData.shortDescription}</p>
      <p><strong>Long Description:</strong> {formData.longDescription}</p>
      <p><strong>Funding Goal:</strong> ${formData.fundingGoal}</p>
      <p><strong>End Date:</strong> {formData.endDate}</p>
      {formData.imageFile && <img src={URL.createObjectURL(formData.imageFile)} alt="Preview" className="mt-2 w-48 rounded-lg border" />}
      {activeStep === 6 && (
        <button onClick={handleSubmit} disabled={loading} className="mt-4 px-6 py-3 bg-color-b text-color-d rounded-xl hover:bg-color-e">
          {loading ? "Submitting..." : "Submit Project"}
        </button>
      )}
    </div>,
  ];

  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <h1 className="text-3xl font-titan text-gray-800 mb-6">Create a New Project</h1>

      <div className="flex w-full justify-center items-center gap-10">
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
              className={`w-0.5 absolute ${idx === 4 && activeStep === 5 ? "border-l-2 border-dashed border-color-e" : "bg-color-e"}`}
              style={{ height: idx + 1 === activeStep ? "90vh" : "50vh" }}
            ></div>

            {/* Step box */}
            <div
              ref={ref}
              className={`create border-3 bg-color-d h-60 w-full font-titan flex relative z-10 mx-auto flex-none cursor-pointer
                ${idx === 4 && activeStep === 5 ? "border-dashed rounded-xl" : "border-solid rounded-none"}`}
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
                <div style={{ marginTop: "4rem", width: "100%" }}>
                  {stepContents[idx]}
                </div>
              )}
            </div>
          </div>
        ))}


      </div>

      {message && <p className="text-center mt-4 font-semibold text-gray-700">{message}</p>}
    </div>
  );
}
