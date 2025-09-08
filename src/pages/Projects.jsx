import React, { useState } from "react";
import CreateProjectForm from "./CreateProjectForm";
import ViewMyProjects from "./ViewMyProjects"; // 🔹 Import your CreateProjectForm
import { Link } from "react-router-dom";

// Placeholder for View Projects (you can replace this with your actual view projects component)
const ViewProjects = () => <div>Your projects will be displayed here</div>;

const Projects = () => {
  const [activeTab, setActiveTab] = useState("view"); // default to view projects

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-blue-200 shadow-md flex flex-col">
        <h2 className="text-2xl font-bold text-blue-700 p-6 border-b border-blue-200">
          Projects
        </h2>
        <nav className="flex flex-col p-4 gap-4">
          <button
            onClick={() => setActiveTab("view")}
            className={`px-4 py-2 rounded-lg font-semibold text-left ${
              activeTab === "view"
                ? "bg-blue-600 text-white"
                : "text-blue-700 hover:bg-blue-100"
            }`}
          >
            View Projects
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 rounded-lg font-semibold text-left ${
              activeTab === "create"
                ? "bg-blue-600 text-white"
                : "text-blue-700 hover:bg-blue-100"
            }`}
          >
            Create Project
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {activeTab === "view" ? <ViewMyProjects /> : <CreateProjectForm />}
      </div>
    </div>
  );
};

export default Projects;
