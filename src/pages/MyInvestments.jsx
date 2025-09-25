import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { getAuth } from 'firebase/auth';
import Navbar from '../components/NavBar';
import { DollarSign, Calendar, TrendingUp, PieChart, Wallet, ChevronDown, ChevronUp } from 'lucide-react';

const MyInvestments = () => {
  const [fundings, setFundings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('funding');
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Portfolio Dashboard</h1>
          <p className="text-gray-600">Track your investments and funding activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invested</p>
                <p className="text-2xl font-bold text-gray-900">{totalInvested.toLocaleString()} birr</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <PieChart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Portfolio Growth</p>
                <p className="text-2xl font-bold text-green-600">+12.5%</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('funding')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'funding'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Funding Activities
                </div>
              </button>
              <button
                onClick={() => setActiveTab('investment')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'investment'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Investment Portfolio
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'funding' && (
              <div>
                {Object.keys(fundings).length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No funding activities yet</h3>
                    <p className="text-gray-500">You haven't invested in any projects yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(fundings).map(([projectId, projectData]) => (
                      <div key={projectId} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                        {/* Project Header - Always Visible */}
                        <button
                          onClick={() => toggleProject(projectId)}
                          className="w-full p-6 text-left hover:bg-gray-100 transition-colors duration-200"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                    {projectData.projectTitle || "Unknown Project"}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {projectData.contributions?.length || 0} transactions • Project ID: {projectId}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="flex items-center gap-2 text-green-600 font-semibold text-lg">
                                      <TrendingUp className="h-5 w-5" />
                                      {projectData.totalFundedPerProject?.toLocaleString() || 0} birr
                                    </div>
                                    <p className="text-sm text-gray-500">Total Contribution</p>
                                  </div>
                                  <div className="ml-4">
                                    {expandedProjects[projectId] ? (
                                      <ChevronUp className="h-5 w-5 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="h-5 w-5 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Expandable Transaction Details */}
                        {expandedProjects[projectId] && projectData.contributions && projectData.contributions.length > 0 && (
                          <div className="border-t border-gray-200 bg-white p-6">
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Transaction History
                              </h4>
                              <div className="space-y-2">
                                {projectData.contributions.map((contrib, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-gray-50 rounded-md p-4 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <DollarSign className="h-4 w-4 text-green-600" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900">
                                          {contrib.amount?.toLocaleString() || 0} birr
                                        </p>
                                        <p className="text-xs text-gray-500">Transaction #{idx + 1}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                                        <Calendar className="h-4 w-4" />
                                        {contrib.date ? new Date(contrib.date).toLocaleDateString() : 'Unknown date'}
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        {contrib.date ? new Date(contrib.date).toLocaleTimeString() : ''}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Empty state for no transactions */}
                        {expandedProjects[projectId] && (!projectData.contributions || projectData.contributions.length === 0) && (
                          <div className="border-t border-gray-200 bg-white p-6">
                            <div className="text-center py-4">
                              <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm">No transaction details available</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'investment' && (
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Investment Portfolio</h2>
                <div className="max-w-md mx-auto space-y-2 text-left">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Coming Soon Features:</h3>
                    <ul className="text-gray-600 space-y-1 text-sm">
                      <li>• Detailed portfolio analysis</li>
                      <li>• Investment performance metrics</li>
                      <li>• Risk assessment tools</li>
                      <li>• Return on investment tracking</li>
                      <li>• Market trends and insights</li>
                      <li>• Investment recommendations</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyInvestments;