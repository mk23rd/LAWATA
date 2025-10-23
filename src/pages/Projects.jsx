import React, { useState } from "react";
import CreateProjectForm from "./CreateProjectForm";
import ViewMyProjects from "./ViewMyProjects";
import Community from "./Community";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMenu, FiX, FiPlus, FiEye, FiUsers, FiChevronRight, FiBookmark, FiGift, FiUser } from "react-icons/fi";
import UserFunding from "./MyInvestments";
import Bookmarks from "./Bookmarks";
import Rewards from "./Rewards";
import ManageProfile from "./ManageProfile_new";

const Projects = () => {
  const [activeTab, setActiveTab] = useState("view"); // default to view projects
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // for mobile toggle
  const navigate = useNavigate();
  const { currentUser, profileComplete , isInvestor } = useAuth();

const tabs = [
    
    {
      id: "view",
      label: "View Projects",
      icon: FiEye,
      description: "Browse all projects"
    },
    {
      id: "profile",
      label: "Profile Management",
      icon: FiUser,
      description: "Manage your profile",
      requiresAuth: true
    },
    {
      id: "create",
      label: "Create Project",
      icon: FiPlus,
      description: "Start your own project",
      requiresAuth: true
    },
    {
      id: "bookmarks",
      label: "Bookmarks",
      icon: FiBookmark,
      description: "Saved projects"
    },
    {
      id: "community",
      label: "Community",
      icon: FiUsers,
      description: "Connect with others"
    },
    {
      id: "investments",
      label: "My Fundings",
      icon: FiEye,
      description: "Track your contributions"
    },
    {
      id: "rewards",
      label: "My Rewards",
      icon: FiGift,
      description: "View claimed rewards",
      requiresAuth: true
    },
    
  ];

  return (
    <div className="min-h-screen bg-white pt-20 md:pt-24">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-20 z-40">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg bg-gray-900 text-white"
          >
            {isSidebarOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
          <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`fixed z-50 top-16 md:top-20 left-0 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] w-80 bg-white border-r border-gray-200 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 md:translate-x-0 overflow-y-auto flex flex-col`}
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Projects Hub</h2>
            <p className="text-sm text-gray-600 mt-1">Manage and explore projects</p>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.requiresAuth && !currentUser) {
                      alert("Please sign in to proceed.");
                      navigate(`/signing?redirectTo=/manage`);
                      return;
                    }
                    if (tab.requiresAuth && !profileComplete) {
                      alert("Please complete your profile to proceed.");
                      navigate(`/manage-profile?redirectTo=/manage`);
                      return;
                    }
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium text-left transition-colors ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isActive ? "bg-white/20" : "bg-gray-200"
                    }`}>
                      <Icon className={`w-5 h-5 ${isActive ? "text-gray-900" : "text-gray-600"}`} />
                    </div>
                    <div>
                      <div className="font-medium">{tab.label}</div>
                      <div className={`text-xs ${isActive ? "text-white/80" : "text-gray-500"}`}>
                        {tab.description}
                      </div>
                    </div>
                  </div>
                  <FiChevronRight className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                </button>
              );
            })}
          </nav>

          
        </div>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-h-screen md:ml-80">
          <div className="h-full">
            {activeTab === "view" && <ViewMyProjects />}
            {activeTab === "create" && <CreateProjectForm />}
            {activeTab === "bookmarks" && <Bookmarks />}
            {activeTab === "community" && <Community />}
            {activeTab === "investments" && <UserFunding />}
            {activeTab === "rewards" && <Rewards />}
            {activeTab === "profile" && <ManageProfile />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
