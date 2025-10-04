import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { getAuth } from 'firebase/auth';
import { FiDollarSign, FiCalendar, FiTrendingUp, FiPieChart, FiPackage, FiChevronDown, FiChevronUp, FiExternalLink, FiLoader } from 'react-icons/fi';

const UserFunding = () => {
  const [fundings, setFundings] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState({});
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchFundings = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setFundings(data.fundings || {});
        }
      } catch (err) {
        console.error("Error fetching user fundings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFundings();
  }, [user]);

  const toggleProject = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const totalInvested = Object.values(fundings).reduce((sum, project) => 
    sum + (project.totalFundedPerProject || 0), 0
  );

  const totalProjects = Object.keys(fundings).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center pt-6">
        <div className="text-center">
          <FiLoader className="w-16 h-16 text-color-b mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 text-lg">Loading your funding activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <br /><br /><br />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Fundings</h1>
          <p className="text-gray-600">Track your contributions and funding activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Total Funded</p>
                <p className="text-2xl font-bold text-gray-900">${totalInvested.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
                <FiDollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Funded Projects</p>
                <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
              </div>
              <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FiPieChart className="h-6 w-6 text-color-b" />
              </div>
            </div>
          </div>
        </div>

        {/* Funding Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiPackage className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Funding History</h2>
            </div>
            
            {Object.keys(fundings).length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiPackage className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Funding Activities Yet</h3>
                <p className="text-gray-600 mb-6">You haven't funded any projects yet. Start supporting amazing projects today!</p>
                <a href="/projects" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-color-b to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Browse Projects
                  <FiExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(fundings).map(([projectId, projectData]) => (
                  <div key={projectId} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:border-color-b hover:shadow-sm transition-all duration-200">
                    {/* Project Header - Always Visible */}
                    <button
                      onClick={() => toggleProject(projectId)}
                      className="w-full p-4 text-left hover:bg-gray-100 transition-colors duration-150"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-base font-semibold text-gray-900 mb-1">
                                {projectData.projectTitle || "Unknown Project"}
                              </h3>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <FiCalendar className="w-3 h-3" />
                                {projectData.contributions?.length || 0} transaction{projectData.contributions?.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-green-600 font-semibold text-lg">
                                  <FiTrendingUp className="h-4 w-4" />
                                  ${projectData.totalFundedPerProject?.toLocaleString() || 0}
                                </div>
                                <p className="text-xs text-gray-500">Total</p>
                              </div>
                              <div>
                                {expandedProjects[projectId] ? (
                                  <FiChevronUp className="h-5 w-5 text-color-b" />
                                ) : (
                                  <FiChevronDown className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Expandable Transaction Details */}
                    {expandedProjects[projectId] && projectData.contributions && projectData.contributions.length > 0 && (
                      <div className="border-t border-gray-200 bg-white p-4">
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-700 text-sm flex items-center gap-1">
                            <FiCalendar className="h-4 w-4" />
                            Transactions
                          </h4>
                          <div className="space-y-2">
                            {projectData.contributions.map((contrib, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FiDollarSign className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 text-sm">
                                      ${contrib.amount?.toLocaleString() || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">Transaction #{idx + 1}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-600">
                                    {contrib.date ? new Date(contrib.date).toLocaleDateString() : 'Unknown'}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {contrib.date ? new Date(contrib.date).toLocaleTimeString() : ''}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Project Link Button */}
                          <div className="pt-2 flex justify-end">
                            <a 
                              href={`/projectDet/${projectId}`} 
                              className="inline-flex items-center gap-1 text-color-b text-sm font-medium hover:underline"
                            >
                              View Details
                              <FiExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Empty state for no transactions */}
                    {expandedProjects[projectId] && (!projectData.contributions || projectData.contributions.length === 0) && (
                      <div className="border-t-2 border-gray-200 bg-white p-6">
                        <div className="text-center py-8">
                          <FiCalendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-600 font-medium mb-4">No transaction details available</p>
                          <a 
                            href={`/projectDet/${projectId}`} 
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-color-b to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            View Project Details
                            <FiExternalLink className="h-5 w-5" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserFunding;