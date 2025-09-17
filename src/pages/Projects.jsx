import React, { useState } from "react";
import CreateProjectForm from "./CreateProjectForm";
import ViewMyProjects from "./ViewMyProjects";
import Community from "./Community";

const Projects = () => {
  const [activeTab, setActiveTab] = useState("view"); // default to view projects
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // for mobile toggle

  return (
    <div className="flex min-h-screen bg-color-d">
      {/* Sidebar */}
      <div
        className={`fixed md:relative z-50 top-0 left-0 h-full md:h-auto w-64 bg-color-d border-r-3 shadow-md border-color-b transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 md:translate-x-0`}
      >
        <h2 className="text-2xl font-bold text-color-b p-6 border-b-2 border-color-b">
          Projects
        </h2>
        <nav className="flex flex-col p-4 gap-4">
          <button
            onClick={() => { setActiveTab("view"); setIsSidebarOpen(false); }}
            className={`px-4 py-2 rounded-lg font-semibold text-left ${
              activeTab === "view"
                ? "bg-color-b text-white"
                : "text-color-b hover:bg-blue-100"
            }`}
          >
            View Projects
          </button>
          <button
            onClick={() => { setActiveTab("create"); setIsSidebarOpen(false); }}
            className={`px-4 py-2 rounded-lg font-semibold text-left ${
              activeTab === "create"
                ? "bg-color-b text-white"
                : "text-color-b hover:bg-blue-100"
            }`}
          >
            Create Project
          </button>
          <button
            onClick={() => { setActiveTab("community"); setIsSidebarOpen(false); }}
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

      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-color-b text-white p-2 rounded-md shadow-md"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        ☰
      </button>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {activeTab === "view" && <ViewMyProjects />}
        {activeTab === "create" && <CreateProjectForm />}
        {activeTab === "community" && <Community />}
      </div>
    </div>
  );
};

export default Projects;
