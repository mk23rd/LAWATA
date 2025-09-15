import React, { useState } from "react";
import CreateProjectForm from "./CreateProjectForm";
import ViewMyProjects from "./ViewMyProjects";
import Community from "./Community"; // 🔹 Import the Community component

const Projects = () => {
  const [activeTab, setActiveTab] = useState("view"); // default to view projects

  return (
    <div className="flex min-h-screen bg-color-d">
      {/* Sidebar */}
      <div className="w-64 bg-color-d border-r-3 shadow-md flex flex-col border-color-b">
        <h2 className="text-2xl font-bold text-color-b p-6 border-b-2 border-color-b">
          Projects
        </h2>
        <nav className="flex flex-col p-4 gap-4">
          <button
            onClick={() => setActiveTab("view")}
            className={`px-4 py-2 rounded-lg font-semibold text-left ${
              activeTab === "view"
                ? "bg-color-b text-white"
                : "text-color-b hover:bg-blue-100"
            }`}
          >
            View Projects
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 rounded-lg font-semibold text-left ${
              activeTab === "create"
                ? "bg-color-b text-white"
                : "text-color-b hover:bg-blue-100"
            }`}
          >
            Create Project
          </button>
          <button
            onClick={() => setActiveTab("community")}
            className={`px-4 py-2 rounded-lg font-semibold text-left ${
              activeTab === "community"
                ? "bg-color-b text-white"
                : "text-color-b hover:bg-blue-100"
            }`}
          >
            Community
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {activeTab === "view" && <ViewMyProjects />}
        {activeTab === "create" && <CreateProjectForm />}
        {activeTab === "community" && <Community />}
      </div>
    </div>
  );
};

export default Projects;
