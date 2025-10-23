import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase-config";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiGift, FiCalendar, FiDollarSign, FiExternalLink, FiPackage, FiHeart } from "react-icons/fi";
import { toast } from "react-toastify";

const Rewards = () => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRewards = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const userRewards = userData.myRewards || [];
          
          // Sort rewards by claimed date (newest first)
          const sortedRewards = userRewards.sort((a, b) => {
            const dateA = a.claimedAt?.toDate?.() || new Date(a.claimedAt);
            const dateB = b.claimedAt?.toDate?.() || new Date(b.claimedAt);
            return dateB - dateA;
          });
          
          setRewards(sortedRewards);
        } else {
          setError("User data not found");
        }
      } catch (err) {
        console.error("Error fetching rewards:", err);
        setError("Failed to load rewards");
        toast.error("Failed to load rewards");
      } finally {
        setLoading(false);
      }
    };

    fetchUserRewards();
  }, [currentUser]);

  const formatDate = (timestamp) => {
    try {
      const date = timestamp?.toDate?.() || new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  const getRewardTypeIcon = (type) => {
    return type === 'limited' ? FiPackage : FiGift;
  };

  const getRewardTypeBadge = (type) => {
    return type === 'limited' ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        <FiPackage className="w-3 h-3 mr-1" />
        Limited
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <FiGift className="w-3 h-3 mr-1" />
        Standard
      </span>
    );
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiGift className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your claimed rewards.</p>
          <button
            onClick={() => navigate('/signing?redirectTo=/manage')}
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your rewards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiGift className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Rewards</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <FiGift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Rewards</h1>
              <p className="text-gray-600">Rewards you've claimed from supporting projects</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiPackage className="w-4 h-4" />
              <span>{rewards.length} Total Rewards</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiDollarSign className="w-4 h-4" />
              <span>${rewards.reduce((sum, reward) => sum + (parseFloat(reward.amount) || 0), 0).toLocaleString()} Total Value</span>
            </div>
          </div>
        </div>

        {/* Rewards List */}
        {rewards.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiHeart className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Rewards Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't claimed any rewards yet. Support projects with rewards to start collecting!
            </p>
            <button
              onClick={() => navigate('/projects')}
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <FiExternalLink className="w-4 h-4" />
              Browse Projects
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward, index) => {
              const RewardIcon = getRewardTypeIcon(reward.type);
              
              return (
                <div
                  key={reward.rewardId || index}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group"
                >
                  {/* Reward Image */}
                  {reward.imageUrl && (
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      <img
                        src={reward.imageUrl}
                        alt={reward.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Reward Content */}
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <RewardIcon className="w-5 h-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                          {reward.title}
                        </h3>
                      </div>
                      {getRewardTypeBadge(reward.type)}
                    </div>
                    
                    {/* Description */}
                    {reward.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {reward.description}
                      </p>
                    )}
                    
                    {/* Project Info */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">From Project:</span>
                        <span className="font-medium text-gray-900 truncate ml-2">
                          {reward.projectTitle}
                        </span>
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <FiCalendar className="w-4 h-4" />
                        <span>{formatDate(reward.claimedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600 font-medium">
                        <FiDollarSign className="w-4 h-4" />
                        <span>${parseFloat(reward.amount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {/* View Project Button */}
                    <button
                      onClick={() => navigate(`/projectDet/${reward.projectId}`)}
                      className="w-full mt-4 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <FiExternalLink className="w-4 h-4" />
                      View Project
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rewards;
