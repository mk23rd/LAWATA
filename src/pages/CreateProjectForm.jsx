import React, { useState } from "react";
import { db } from "../firebase/firebase-config";
import { collection, addDoc, Timestamp, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FiUser, FiTag, FiAlignLeft, FiDollarSign, FiCalendar, FiImage } from "react-icons/fi";

export default function CreateProjectForm() {
  const navigate = useNavigate();
  const totalSteps = 6;
  const [step, setStep] = useState(1);
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

    // Step validation
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

      // Redirect to ViewMyProjects page
      navigate("/view-my-projects");
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to submit project.");
    }

    setLoading(false);
  };

  // Steps (same as your existing code)
  const Step1 = (
    <div className="space-y-4">
      <div className="relative">
        <FiUser className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          name="title"
          placeholder="Project Title"
          value={formData.title || ""}
          onChange={handleChange}
          className="w-full pl-10 p-2 border rounded-lg"
        />
      </div>
      <div className="relative">
        <FiTag className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category || ""}
          onChange={handleChange}
          className="w-full pl-10 p-2 border rounded-lg"
        />
      </div>
    </div>
  );

  const Step2 = (
    <div className="space-y-4">
      <div className="relative">
        <FiAlignLeft className="absolute top-2 left-3 text-gray-400" />
        <textarea
          name="shortDescription"
          placeholder="Short Description"
          value={formData.shortDescription || ""}
          onChange={handleChange}
          rows="2"
          className="w-full pl-10 p-2 border rounded-lg"
        />
      </div>
      <div className="relative">
        <FiAlignLeft className="absolute top-2 left-3 text-gray-400" />
        <textarea
          name="longDescription"
          placeholder="Long Description"
          value={formData.longDescription || ""}
          onChange={handleChange}
          rows="5"
          className="w-full pl-10 p-2 border rounded-lg"
        />
      </div>
    </div>
  );

  const Step3 = (
    <div className="relative">
      <FiDollarSign className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
      <input
        type="number"
        name="fundingGoal"
        placeholder="Funding Goal (USD)"
        value={formData.fundingGoal || ""}
        onChange={handleChange}
        className="w-full pl-10 p-2 border rounded-lg"
      />
    </div>
  );

  const Step4 = (
    <div className="relative">
      <label className="block text-gray-700 font-medium mb-1">Milestone: End Date</label>
      <FiCalendar className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
      <input
        type="date"
        name="endDate"
        value={formData.endDate || ""}
        onChange={handleChange}
        className="w-full pl-10 p-2 border rounded-lg"
      />
    </div>
  );

  const Step5 = (
    <div className="relative">
      <label className="block text-gray-700 font-medium mb-1">Upload Project Image</label>
      <FiImage className="absolute top-3 left-3 text-gray-400" />
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="w-full pl-10 p-2 border rounded-lg"
      />
    </div>
  );

  const Step6 = (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold text-lg">Preview</h3>
      <p><strong>Title:</strong> {formData.title}</p>
      <p><strong>Category:</strong> {formData.category}</p>
      <p><strong>Short Description:</strong> {formData.shortDescription}</p>
      <p><strong>Long Description:</strong> {formData.longDescription}</p>
      <p><strong>Funding Goal:</strong> ${formData.fundingGoal}</p>
      <p><strong>End Date:</strong> {formData.endDate}</p>
      {formData.imageFile && (
        <div>
          <strong>Image Preview:</strong>
          <img
            src={URL.createObjectURL(formData.imageFile)}
            alt="Preview"
            className="mt-2 w-48 rounded-lg border"
          />
        </div>
      )}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1: return Step1;
      case 2: return Step2;
      case 3: return Step3;
      case 4: return Step4;
      case 5: return Step5;
      case 6: return Step6;
      default: return Step1;
    }
  };

  const stepsLabels = ["Title", "Description", "Funding", "Milestone", "Image", "Preview"];
  const progressPercent = (step / totalSteps) * 100;

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.title && formData.category;
      case 2: return formData.shortDescription && formData.longDescription;
      case 3: return formData.fundingGoal;
      case 4: return formData.endDate;
      case 5: return formData.imageFile;
      default: return true;
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Create a New Project</h1>

      <div className="w-full max-w-2xl mb-4">
        <div className="flex justify-between text-sm font-medium mb-1">
          {stepsLabels.map((label, index) => (
            <span key={label} className={step - 1 === index ? "text-blue-600 font-semibold" : "text-gray-700"}>
              {label}
            </span>
          ))}
        </div>
        <div className="relative h-2 rounded-full bg-gray-300">
          <div
            className="absolute h-2 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-2xl bg-white border-4 border-blue-500 shadow-lg rounded-2xl p-6 space-y-6">
        {renderStep()}

        <div className="flex justify-between mt-4">
          {step > 1 && <button onClick={() => setStep(step - 1)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400">Previous</button>}
          {step < 6 && <button onClick={() => setStep(step + 1)} disabled={!isStepValid()} className={`px-4 py-2 rounded-xl ml-auto ${isStepValid() ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>Next</button>}
          {step === 6 && <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 ml-auto">{loading ? "Submitting..." : "Submit Project"}</button>}
        </div>

        {message && <p className="text-center mt-4 font-semibold text-gray-700">{message}</p>}
      </div>
    </div>
  );
}
