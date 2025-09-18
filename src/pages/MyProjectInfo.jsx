import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { getAuth } from 'firebase/auth';
import { 
  FiArrowLeft, 
  FiDollarSign, 
  FiUsers, 
  FiCalendar, 
  FiClock, 
  FiTag, 
  FiTrendingUp,
  FiEdit,
  FiShare2,
  FiEye,
  FiUser,
  FiMapPin,
  FiChevronDown
} from 'react-icons/fi';
import Navbar from '../components/NavBar';

export default function MyProjectInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [funders, setFunders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedFunders, setExpandedFunders] = useState({});
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchProjectAndFunders = async () => {
      if (!user || !id) return;
      
      setLoading(true);
      try {
        // Fetch project details
        const projectRef = doc(db, 'projects', id);
        const projectSnap = await getDoc(projectRef);
        
        if (!projectSnap.exists()) {
          setError('Project not found');
          return;
        }
        
        const projectData = { id: projectSnap.id, ...projectSnap.data() };
        
        // Check if current user owns this project
        if (projectData.createdBy?.uid !== user.uid) {
          setError('You do not have permission to view this project');
          return;
        }
        
        setProject(projectData);
        
        // Fetch funders data from transactions
        const transactionsQuery = query(
          collection(db, 'transactions'),
          where('projectId', '==', id),
          where('funding', '==', true)
        );
        
        const transactionsSnap = await getDocs(transactionsQuery);
        const fundersData = [];
        
        // Get unique funders and their contributions
        const funderMap = new Map();
        
        for (const transactionDoc of transactionsSnap.docs) {
          const transaction = transactionDoc.data();
          const userId = transaction.userId;
          
          // Fetch user details
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            // Build a safe display name and location
            const nameFromFirstLast = [userData?.firstName, userData?.lastName].filter(Boolean).join(' ').trim();
            const safeName = (userData?.displayName && userData.displayName.trim())
              || nameFromFirstLast
              || userData?.username
              || userData?.email
              || 'Anonymous';

            const hasCityOrCountry = !!(userData?.location && (userData.location.city || userData.location.country));
            const safeLocation = hasCityOrCountry
              ? [userData.location.city, userData.location.country].filter(Boolean).join(', ')
              : 'Unknown';
            
            if (funderMap.has(userId)) {
              // Add to existing funder's contributions
              const existingFunder = funderMap.get(userId);
              existingFunder.totalAmount += transaction.fundedMoney;
              existingFunder.contributions.push({
                amount: transaction.fundedMoney,
                date: transaction.transactionTime,
                id: transactionDoc.id
              });
            } else {
              // Create new funder entry
              funderMap.set(userId, {
                id: userId,
                name: safeName,
                email: userData.email,
                profileImage: userData.profileImageUrl || 'https://via.placeholder.com/40',
                location: safeLocation,
                totalAmount: transaction.fundedMoney,
                contributions: [{
                  amount: transaction.fundedMoney,
                  date: transaction.transactionTime,
                  id: transactionDoc.id
                }],
                firstContribution: transaction.transactionTime
              });
            }
          }
        }
        
        // Convert map to array and sort by total amount
        const fundersArray = Array.from(funderMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
        setFunders(fundersArray);
        
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('Failed to load project information');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndFunders();
  }, [id, user]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      let date;
      if (timestamp.seconds) {
        // Firestore timestamp
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getProgressPercentage = () => {
    if (!project?.fundingGoal || !project?.fundedMoney) return 0;
    return Math.min((project.fundedMoney / project.fundingGoal) * 100, 100);
  };

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

  // Toggle a single funder's contribution history
  const toggleFunder = (funderId) => {
    setExpandedFunders((prev) => ({
      ...prev,
      [funderId]: !prev[funderId],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Navbar />
        <div className="pt-20 flex justify-center items-center min-h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-color-b border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Loading Project Details</h2>
            <p className="text-gray-600">Please wait while we fetch your project information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Navbar />
        <div className="pt-20 flex justify-center items-center min-h-[80vh]">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md border border-white/20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => navigate('/view-my-projects')}
              className="bg-gradient-to-r from-color-b to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Back to My Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = getProgressPercentage();
  const daysLeft = project.endDate ? Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar />
      
      {/* Header */}
      <div className="pt-20 pb-4">
        <div className="max-w-7xl mx-auto px-4">
          <button
            onClick={() => navigate('/view-my-projects')}
            className="flex items-center space-x-2 text-gray-600 hover:text-color-b transition-colors group mb-6"
          >
            <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to My Projects</span>
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-titan bg-gradient-to-r from-color-b to-blue-600 bg-clip-text text-transparent mb-2">
                {project.title}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(project.status)}`}>
                  {project.status || 'Unknown'}
                </span>
                <span className="flex items-center">
                  <FiTag className="w-4 h-4 mr-1" />
                  {project.category || 'General'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white/80 text-gray-700 rounded-xl hover:bg-white transition-colors flex items-center">
                <FiEdit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button className="px-4 py-2 bg-white/80 text-gray-700 rounded-xl hover:bg-white transition-colors flex items-center">
                <FiShare2 className="w-4 h-4 mr-2" />
                Share
              </button>
              <Link 
                to={`/projectDet/${project.id}`}
                className="px-4 py-2 bg-color-b text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center"
              >
                <FiEye className="w-4 h-4 mr-2" />
                View Public
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Funding Progress</p>
                <p className="text-3xl font-bold text-color-b">{progress.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-color-b/10 rounded-xl">
                <FiTrendingUp className="w-6 h-6 text-color-b" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Amount Raised</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(project.fundedMoney)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FiDollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Funders</p>
                <p className="text-3xl font-bold text-blue-600">{funders.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Days Left</p>
                <p className="text-3xl font-bold text-purple-600">{daysLeft > 0 ? daysLeft : 'Ended'}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FiClock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex space-x-1 bg-white/50 backdrop-blur-sm rounded-2xl p-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'funders', label: `Funders (${funders.length})` },
            { id: 'analytics', label: 'Analytics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-white text-color-b shadow-lg'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Project Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Project Image and Description */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                <div className="relative h-64">
                  {project.imageUrl ? (
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-lg">No Image</span>
                    </div>
                  )}
                </div>
                
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Project Description</h3>
                  <p className="text-gray-600 mb-4">{project.shortDescription}</p>
                  <div className="prose prose-gray max-w-none">
                    <p className="whitespace-pre-wrap">{project.longDescription || 'No detailed description available.'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Funding Progress */}
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Funding Progress</h3>
                
                <div className="mb-6">
                  <div className="flex justify-between text-lg font-semibold text-gray-800 mb-2">
                    <span>{formatCurrency(project.fundedMoney)}</span>
                    <span className="text-gray-500">of {formatCurrency(project.fundingGoal)}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                    <div
                      className="bg-gradient-to-r from-color-b to-blue-600 h-4 rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{progress.toFixed(1)}% funded</span>
                    <span>
                      {project.fundingGoal - (project.fundedMoney || 0) > 0
                        ? formatCurrency(project.fundingGoal - (project.fundedMoney || 0)) + ' to go'
                        : 'Goal reached!'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <FiUsers className="w-6 h-6 text-color-b mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">{funders.length}</p>
                    <p className="text-sm text-gray-600">Funders</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <FiCalendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">{daysLeft || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Days Left</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'funders' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-8 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <FiUsers className="w-6 h-6 text-color-b mr-3" />
                Project Funders ({funders.length})
              </h3>
              <p className="text-gray-600 mt-2">People who have supported your project</p>
            </div>
            
            <div className="p-8">
              {funders.length === 0 ? (
                <div className="text-center py-12">
                  <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-600 mb-2">No Funders Yet</h4>
                  <p className="text-gray-500">Your project hasn't received any funding yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {funders.map((funder, index) => (
                    <div key={funder.id} className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <img
                            src={funder.profileImage}
                            alt={funder.name}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/48';
                            }}
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900">{funder.name}</h4>
                            <div className="flex items-center text-sm text-gray-600">
                              <FiMapPin className="w-4 h-4 mr-1" />
                              {funder.location}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-2xl font-bold text-color-b">{formatCurrency(funder.totalAmount)}</p>
                          <p className="text-sm text-gray-600">{funder.contributions.length} contribution{funder.contributions.length > 1 ? 's' : ''}</p>
                          <button
                            onClick={() => toggleFunder(funder.id)}
                            className="mt-2 inline-flex items-center text-sm text-color-b hover:text-blue-700 transition-colors"
                            aria-expanded={!!expandedFunders[funder.id]}
                            aria-controls={`contrib-${funder.id}`}
                          >
                            <FiChevronDown className={`w-4 h-4 mr-1 transition-transform ${expandedFunders[funder.id] ? 'rotate-180' : ''}`} />
                            {expandedFunders[funder.id] ? 'Hide' : 'Show'} contributions
                          </button>
                        </div>
                      </div>
                      
                      {/* Contributions Details */}
                      {expandedFunders[funder.id] && (
                        <div id={`contrib-${funder.id}`} className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="font-medium text-gray-800 mb-3">Contribution History</h5>
                          <div className="space-y-2">
                            {funder.contributions.map((contribution, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">{formatDate(contribution.date)}</span>
                                <span className="font-semibold text-gray-800">{formatCurrency(contribution.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FiTrendingUp className="w-6 h-6 text-color-b mr-3" />
              Project Analytics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                <h4 className="font-semibold text-gray-800 mb-2">Average Contribution</h4>
                <p className="text-3xl font-bold text-blue-600">
                  {funders.length > 0 ? formatCurrency((project.fundedMoney || 0) / funders.length) : '$0'}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                <h4 className="font-semibold text-gray-800 mb-2">Funding Rate</h4>
                <p className="text-3xl font-bold text-green-600">{progress.toFixed(1)}%</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                <h4 className="font-semibold text-gray-800 mb-2">Total Contributions</h4>
                <p className="text-3xl font-bold text-purple-600">
                  {funders.reduce((total, funder) => total + funder.contributions.length, 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
