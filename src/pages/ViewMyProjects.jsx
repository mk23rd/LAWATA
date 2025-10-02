import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase-config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FiImage, FiDollarSign, FiCalendar, FiTag, FiEye, FiEdit, FiTrash2, FiPlus, FiTrendingUp, FiUsers, FiClock } from "react-icons/fi";

export default function ViewMyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const q = query(collection(db, "projects"), where("createdBy.uid", "==", user.uid));
        const snapshot = await getDocs(q);
        const myProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProjects(myProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressPercentage = (fundedMoney, fundingGoal) => {
    if (!fundedMoney || !fundingGoal) return 0;
    return Math.min((fundedMoney / fundingGoal) * 100, 100);
  };

  const filteredProjects = projects.filter(project => {
    if (filter === "all") return true;
    return project.status?.toLowerCase() === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-color-b border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Projects</h1>
          <p className="text-gray-600">{projects.length} projects total</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <FiTrendingUp className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter(p => p.status?.toLowerCase() === 'active').length}
                </p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <FiClock className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Raised</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${projects.reduce((sum, p) => sum + (p.fundedMoney || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <FiDollarSign className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Backers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.reduce((sum, p) => sum + (p.backers || 0), 0)}
                </p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <FiUsers className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: "all", label: "All", count: projects.length },
            { id: "pending", label: "Pending", count: projects.filter(p => p.status?.toLowerCase() === 'pending').length },
            { id: "active", label: "Active", count: projects.filter(p => p.status?.toLowerCase() === 'active').length },
            { id: "approved", label: "Approved", count: projects.filter(p => p.status?.toLowerCase() === 'approved').length },
            { id: "declined", label: "Declined", count: projects.filter(p => p.status?.toLowerCase() === 'declined').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === tab.id
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">
              {filter === "all" ? "No projects yet" : `No ${filter} projects`}
            </p>
            {filter !== "all" && (
              <button 
                onClick={() => setFilter("all")}
                className="text-color-b hover:underline text-sm font-medium"
              >
                View all projects
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => {
              const progress = getProgressPercentage(project.fundedMoney, project.fundingGoal);
              const daysLeft = project.endDate ? Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
              
              return (
                <div
                  key={project.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-900 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/my-project-info/${project.id}`)}
                >
                  {/* Project Image */}
                  <div className="relative aspect-video overflow-hidden">
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <FiImage className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    
                  </div>

                  {/* Project Content */}
                  <div className="p-4">
                    {/* Status Badge */}
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${getStatusColor(project.status)}`}>
                      {project.status || 'Unknown'}
                    </span>

                    <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                      {project.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {project.shortDescription || 'No description available'}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-gray-900 h-1.5 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>${project.fundedMoney?.toLocaleString() || 0} raised</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{project.backers || 0} backers</span>
                      {daysLeft > 0 && (
                        <span className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {daysLeft}d left
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/my-project-info/${project.id}`);
                        }}
                        className="flex-1 py-2 text-sm font-medium text-gray-900 hover:underline"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-600 hover:text-gray-900"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-600 hover:text-red-600"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
