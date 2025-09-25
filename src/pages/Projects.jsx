import React, { useState } from "react";
import CreateProjectForm from "./CreateProjectForm";
import ViewMyProjects from "./ViewMyProjects";
import Community from "./Community";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMenu, FiX, FiPlus, FiEye, FiUsers, FiChevronRight } from "react-icons/fi";
import MyInvestments from "./MyInvestments";

const Projects = () => {
  const [activeTab, setActiveTab] = useState("view"); // default to view projects
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // for mobile toggle
  const navigate = useNavigate();
  const { currentUser, profileComplete , isInvestor } = useAuth();

const tabs = isInvestor 
    ? [
        {
          id: "view",
          label: "View Projects",
          icon: FiEye,
          description: "Browse all projects"
        },
        {
          id: "create",
          label: "Create Project",
          icon: FiPlus,
          description: "Start your own project",
          requiresAuth: true
        },
        {
          id: "community",
          label: "Community",
          icon: FiUsers,
          description: "Connect with others"
        },
        {
          id: "investments",
          label: "Investments",
          icon: FiEye,
          description: "Check out your Investments"
        },
      ]
    : [
        {
          id: "view",
          label: "View Projects",
          icon: FiEye,
          description: "Browse all projects"
        },
        {
          id: "create",
          label: "Create Project",
          icon: FiPlus,
          description: "Start your own project",
          requiresAuth: true
        },
        {
          id: "community",
          label: "Community",
          icon: FiUsers,
          description: "Connect with others"
        },    
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl bg-color-b text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isSidebarOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
          <h1 className="text-xl font-bold text-gray-800">Projects</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`fixed md:relative z-50 top-0 left-0 h-full md:h-auto w-80 bg-white/90 backdrop-blur-sm border-r border-gray-200/50 shadow-2xl transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-all duration-500 ease-in-out md:translate-x-0`}
        >
          {/* Sidebar Header */}
          <div className="p-8 border-b border-gray-200/50">
            <h2 className="text-3xl font-titan bg-gradient-to-r from-color-b to-blue-600 bg-clip-text text-transparent">
              Projects Hub
            </h2>
            <p className="text-gray-600 mt-2">Manage and explore projects</p>
          </div>

          {/* Navigation */}
          <nav className="p-6 space-y-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.requiresAuth && !currentUser) {
                      alert("Please sign in to proceed.");
                      navigate(`/signing?redirectTo=/projects`);
                      return;
                    }
                    if (tab.requiresAuth && !profileComplete) {
                      alert("Please complete your profile to proceed.");
                      navigate(`/manage-profile?redirectTo=/projects`);
                      return;
                    }
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl font-semibold text-left transition-all duration-300 group ${
                    isActive
                      ? "bg-gradient-to-r from-color-b to-blue-600 text-white shadow-lg scale-105"
                      : "text-gray-700 hover:bg-white/80 hover:shadow-lg hover:scale-105"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${
                      isActive ? "bg-white/20" : "bg-gray-100 group-hover:bg-color-b/10"
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isActive ? "text-white" : "text-gray-600 group-hover:text-color-b"
                      }`} />
                    </div>
                    <div>
                      <div className="font-semibold">{tab.label}</div>
                      <div className={`text-sm ${
                        isActive ? "text-white/80" : "text-gray-500"
                      }`}>
                        {tab.description}
                      </div>
                    </div>
                  </div>
                  <FiChevronRight className={`w-5 h-5 transition-transform duration-300 ${
                    isActive ? "rotate-90 text-white" : "text-gray-400 group-hover:text-color-b"
                  }`} />
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4">
              <h3 className="font-semibold text-gray-800 mb-1">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-3">Check out our guide to get started</p>
              <button className="w-full py-2 px-4 bg-color-b text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium">
                View Guide
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          <div className="h-full">
            {activeTab === "view" && <ViewMyProjects />}
            {activeTab === "create" && <CreateProjectForm />}
            {activeTab === "community" && <Community />}
            {activeTab === "investments" && <MyInvestments />}
            
       
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
