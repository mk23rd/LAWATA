import React, { useState } from "react";
import { db } from "../firebase/firebase-config";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // 🔹 Import Firebase Auth

export default function CreateProjectForm() {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    shortDescription: "",
    longDescription: "",
    fundingGoal: "",
    endDate: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  // Convert file to base64 string
  const toBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  // Upload image to ImgBB
  const uploadImage = async (file) => {
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY; 
    if (!apiKey) throw new Error("Missing ImgBB API key in .env");

    const base64Image = await toBase64(file);

    const formData = new FormData();
    formData.append("image", base64Image);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log("ImgBB response:", data);

    if (!data.success) {
      throw new Error("Image upload failed: " + JSON.stringify(data));
    }
    return data.data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setMessage("❌ You must be logged in to create a project.");
        setLoading(false);
        return;
      }

      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // Calculate campaign duration
      const today = new Date();
      const endDate = new Date(formData.endDate);
      const duration = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

      const projectData = {
        ...formData,
        fundingGoal: Number(formData.fundingGoal),
        imageUrl,
        duration,
        backers: 0,
        fundedMoney: 0,
        status: "Pending",
        createdAt: Timestamp.now(),

        // Add creator info
        createdBy: {
          uid: user.uid,
          email: user.email,
          name: user.username || "Anonymous",
        },
      };

      await addDoc(collection(db, "projects"), projectData);

      setMessage("✅ Project submitted successfully!");
      setFormData({
        title: "",
        category: "",
        shortDescription: "",
        longDescription: "",
        fundingGoal: "",
        endDate: "",
      });
      setImageFile(null);
    } catch (error) {
      console.error("Error adding project: ", error);
      setMessage("❌ Failed to submit project.");
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          Create a New Project
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            placeholder="Project Title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
            required
          />

          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
            required
          />

          <textarea
            name="shortDescription"
            placeholder="Short Description"
            value={formData.shortDescription}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
            rows="2"
            required
          />

          <textarea
            name="longDescription"
            placeholder="Long Description"
            value={formData.longDescription}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
            rows="5"
            required
          />

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border rounded-lg"
            required
          />

          <input
            type="number"
            name="fundingGoal"
            placeholder="Funding Goal (USD)"
            value={formData.fundingGoal}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
            required
          />

          <label className="block text-gray-700 font-medium">
            Campaign End Date:
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Project"}
          </button>
        </form>

        {message && (
          <p className="text-center mt-4 font-semibold text-gray-700">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
