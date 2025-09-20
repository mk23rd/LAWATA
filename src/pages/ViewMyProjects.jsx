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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-color-b border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Loading Your Projects</h2>
            <p className="text-gray-600">Please wait while we fetch your projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-titan bg-gradient-to-r from-color-b to-blue-600 bg-clip-text text-transparent mb-4">
            My Projects
          </h1>
          <p className="text-lg text-gray-600">Manage and track your crowdfunding projects</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
              </div>
              <div className="p-3 bg-color-b/10 rounded-xl">
                <FiTrendingUp className="w-6 h-6 text-color-b" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-3xl font-bold text-green-600">
                  {projects.filter(p => p.status?.toLowerCase() === 'active').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FiClock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Raised</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${projects.reduce((sum, p) => sum + (p.fundedMoney || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiDollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Backers</p>
                <p className="text-3xl font-bold text-purple-600">
                  {projects.reduce((sum, p) => sum + (p.backers || 0), 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FiUsers className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: "all", label: "All Projects", count: projects.length },
            { id: "pending", label: "Pending", count: projects.filter(p => p.status?.toLowerCase() === 'pending').length },
            { id: "active", label: "Active", count: projects.filter(p => p.status?.toLowerCase() === 'active').length },
            { id: "approved", label: "Approved", count: projects.filter(p => p.status?.toLowerCase() === 'approved').length },
            { id: "rejected", label: "Rejected", count: projects.filter(p => p.status?.toLowerCase() === 'rejected').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                filter === tab.id
                  ? "bg-color-b text-white shadow-lg"
                  : "bg-white/80 text-gray-600 hover:bg-white hover:shadow-md"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiPlus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {filter === "all" ? "No Projects Yet" : `No ${filter} Projects`}
            </h3>
            <p className="text-gray-600 mb-8">
              {filter === "all" 
                ? "You haven't created any projects yet. Start your first project today!" 
                : `You don't have any ${filter} projects at the moment.`
              }
            </p>
            {filter === "all" && (
              <button className="px-8 py-4 bg-gradient-to-r from-color-b to-blue-600 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project, index) => {
              const progress = getProgressPercentage(project.fundedMoney, project.fundingGoal);
              const daysLeft = project.endDate ? Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
              
              return (
                <div
                  key={project.id}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-500 group animate-fade-in-up cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(`/my-project-info/${project.id}`)}
                >
                  {/* Project Image */}
                  <div className="relative h-48 overflow-hidden">
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <FiImage className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(project.status)}`}>
                        {project.status || 'Unknown'}
                      </span>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                        <FiTag className="w-3 h-3 mr-1" />
                        {project.category || 'General'}
                      </span>
                    </div>
                  </div>

                  {/* Project Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-color-b transition-colors">
                      {project.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {project.shortDescription || 'No description available'}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-color-b to-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-color-b">${project.fundingGoal?.toLocaleString() || 0}</p>
                        <p className="text-xs text-gray-600">Goal</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{project.backers || 0}</p>
                        <p className="text-xs text-gray-600">Backers</p>
                      </div>
                    </div>

                    {/* Days Left */}
                    {daysLeft > 0 && (
                      <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
                        <FiClock className="w-4 h-4 mr-1" />
                        {daysLeft} days left
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/my-project-info/${project.id}`);
                        }}
                        className="flex-1 py-2 px-4 bg-color-b text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center"
                      >
                        <FiEye className="w-4 h-4 mr-1" />
                        View Details
                      </button>
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="py-2 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="py-2 px-4 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
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
