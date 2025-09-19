import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, Timestamp, collection, query, where, getDocs, onSnapshot, getDoc, orderBy } from 'firebase/firestore';

import { db } from '../firebase/firebase-config';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, DollarSign, Tag, Target, Users, Share2, Heart, Bookmark, MessageCircle, TrendingUp, Award, Shield, Star, ChevronDown } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { useAuth } from "../context/AuthContext";

import Comment from '../components/comment';
import Navbar from "../components/NavBar";

const ProjectDetails = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [currentUserData, setCurrentUserData] = useState(null);
  const [commentsWithProfileImages, setCommentsWithProfileImages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, profileComplete } = useAuth();

  // Real-time project listener (also derives announcements from project doc)
  useEffect(() => {
    const projectRef = doc(db, 'projects', id);

    const unsubscribe = onSnapshot(
      projectRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const projectData = { id: docSnap.id, ...docSnap.data() };
          setProject(projectData);
          // Build announcements array from map if present
          if (projectData.announcements && typeof projectData.announcements === 'object') {
            const items = Object.entries(projectData.announcements).map(([annId, value]) => ({
              id: annId,
              ...(value || {}),
            }));
            // Sort by date desc if available
            items.sort((a, b) => {
              const da = a.date?.seconds ? a.date.seconds : (a.date ? new Date(a.date).getTime()/1000 : 0);
              const dbt = b.date?.seconds ? b.date.seconds : (b.date ? new Date(b.date).getTime()/1000 : 0);
              return dbt - da;
            });
            setAnnouncements(items);
          } else {
            setAnnouncements([]);
          }
          
          // Resolve profile images for comments
          if (projectData.comments && projectData.comments.length > 0) {
            const commentsWithImages = await Promise.all(
              projectData.comments.map(async (comment) => {
                let imageUrl = comment.commenterPfp || "https://via.placeholder.com/40";
                
                // If we have a reference to the user's profile, fetch the current image
                if (comment.userId) {
                  try {
                    const userDocRef = doc(db, "users", comment.userId);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (userDoc.exists() && userDoc.data().profileImageUrl) {
                      imageUrl = userDoc.data().profileImageUrl;
                    }
                  } catch (error) {
                    console.error("Error fetching user profile:", error);
                  }
                }
                
                return {
                  ...comment,
                  resolvedPfp: imageUrl
                };
              })
            );
            
            setCommentsWithProfileImages(commentsWithImages);
          } else {
            setCommentsWithProfileImages([]);
          }
          
          setLoading(false);
        } else {
          setError('Project not found');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching project:', err);
        setError('Failed to load project');
        setLoading(false);
      }
    );

    return () => unsubscribe(); // cleanup on unmount
  }, [id]);


  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUserData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('uid', '==', user.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
              setCurrentUserData(doc.data());
            });
          } else {
            setCurrentUserData({
              displayName: user.displayName || user.email || "Anonymous",
              profileImageUrl: user.photoURL || "https://via.placeholder.com/40",
            });
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchCurrentUserData();
  }, []);

  const handleClick = () => {
    const fundedPercentage = calculateFundingPercentage(project.fundedMoney, project.fundingGoal);
    const isFullyFunded = fundedPercentage >= 100;
    if (!currentUser) {
      alert("Please sign in to proceed.");
      navigate(`/signing?redirectTo=${isFullyFunded ? `/rewards/${id}` : `/support/${id}`}`);
      return;
    }
    if (!profileComplete) {
      alert("Please complete your profile to proceed.");
      navigate(`/manage-profile?redirectTo=${isFullyFunded ? `/rewards/${id}` : `/support/${id}`}`);
      return;
    }
    if (isFullyFunded) navigate(`/rewards/${id}`);
    else navigate(`/support/${id}`);
  };

  const calculateFundingPercentage = (fundedMoney, fundingGoal) => {
    if (!fundedMoney || !fundingGoal || fundingGoal === 0) return 0;
    const percentage = (fundedMoney / fundingGoal) * 100;
    return Math.min(percentage, 100);
  };

  const formatFirebaseTimestamp = (timestamp, includeTime = false) => {
    if (!timestamp) return '-';    
    try {
      if (timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
        const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
        
        if (includeTime) {
          return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        } else {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      } 
      return timestamp;
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid date';
    }
  };

  const formatFunding = (amount) => {
    return amount?.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) || '$0';
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        alert("You must be logged in to comment.");
        return;
      }

      const username = currentUserData?.displayName || user.displayName || user.email || "Anonymous";
      const commenterPfp = currentUserData?.profileImageUrl || user.photoURL || "https://via.placeholder.com/40";

      const projectRef = doc(db, "projects", id);
      const commentObj = {
        username: username,
        commenterPfp: commenterPfp,
        comment: newComment,
        createdAt: Timestamp.now(),
        userId: user.uid
      };

      await updateDoc(projectRef, {
        comments: arrayUnion(commentObj)
      });

      setNewComment(""); // clear input
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-color-b border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Loading Project</h2>
          <p className="text-gray-600">Fetching project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md border border-white/20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Project Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The project you are looking for does not exist.'}</p>
          <Link 
            to="/browse"
            className="bg-gradient-to-r from-color-b to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 inline-block"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const fundedPercentage = calculateFundingPercentage(project.fundedMoney, project.fundingGoal);
  const isFullyFunded = fundedPercentage >= 100;
  const daysLeft = project.endDate ? Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar />

      {/* Back Button */}
      <div className="pt-20 pb-4">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-color-b transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Browse</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 max-w-7xl">
        {/* Project Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
          {/* Hero Image */}
          <div className="relative h-64 md:h-96">
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
              }}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            
            {/* Badges */}
            <div className="absolute top-6 left-6 flex flex-col gap-2">
              <span className="bg-white/90 backdrop-blur-sm text-color-b px-4 py-2 rounded-full text-sm font-semibold flex items-center shadow-lg">
                <Tag size={16} className="mr-2" />
                {project.category || 'General'}
              </span>
              {isFullyFunded && (
                <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  🎉 Fully Funded!
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="absolute top-6 right-6 flex gap-2">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-3 rounded-full backdrop-blur-sm transition-all duration-300 ${
                  isLiked ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-red-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-3 rounded-full backdrop-blur-sm transition-all duration-300 ${
                  isBookmarked ? 'bg-color-b text-white' : 'bg-white/90 text-gray-600 hover:bg-color-b/10'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="p-3 rounded-full bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-gray-50 transition-all duration-300"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Project Info */}
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left: Title and Description */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  {project.title || 'Untitled Project'}
                </h1>
                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  {project.shortDescription}
                </p>

                {/* Creator Info */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-color-b to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {project.createdBy?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Created by</p>
                    <p className="text-gray-600">{project.createdBy?.name || 'Anonymous'}</p>
                  </div>
                </div>
              </div>

              {/* Right: Funding Stats */}
              <div className="lg:w-96">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                  {/* Funding Progress */}
                  <div className="mb-6">
                    <div className="flex justify-between text-2xl font-bold text-gray-800 mb-2">
                      <span>{formatFunding(project.fundedMoney || 0)}</span>
                      <span className="text-gray-500">of {formatFunding(project.fundingGoal)}</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-1000 ${
                          isFullyFunded
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : 'bg-gradient-to-r from-color-b to-blue-600'
                        }`}
                        style={{ width: `${fundedPercentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-lg text-gray-600">
                      <span>{Math.round(fundedPercentage)}% funded</span>
                      <span>
                        {project.fundingGoal - (project.fundedMoney || 0) > 0
                          ? formatFunding(project.fundingGoal - (project.fundedMoney || 0)) + ' to go'
                          : 'Goal reached!'}
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-white rounded-xl">
                      <Users className="w-6 h-6 text-color-b mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-800">{project.backers || 0}</p>
                      <p className="text-sm text-gray-600">Backers</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl">
                      <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-800">{daysLeft || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Days Left</p>
                    </div>
                  </div>

                  {/* Support Button */}
                  <button
                    onClick={handleClick}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
                      isFullyFunded
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                        : 'bg-gradient-to-r from-color-b to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white'
                    }`}
                  >
                    {isFullyFunded ? 'View Rewards' : 'Support This Project'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Description */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <Award className="w-8 h-8 text-color-b mr-3" />
            About This Project
          </h2>
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {project.longDescription || 'No detailed description available.'}
          </div>
        </div>

        {/* Announcements Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
          <div className="p-8 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              📢
              <span className="ml-3">Announcements ({announcements.length})</span>
            </h2>
            <button
              onClick={() => setShowAnnouncements((s) => !s)}
              className="inline-flex items-center text-gray-600 hover:text-gray-800"
              aria-expanded={showAnnouncements}
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${showAnnouncements ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {showAnnouncements && (
            <div className="p-8">
              {announcements.length === 0 ? (
                <p className="text-gray-600">No announcements yet.</p>
              ) : (
                <div className="space-y-6">
                  {announcements.map((a) => (
                    <div key={a.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{a.title || 'Announcement'}</h3>
                        <span className="text-sm text-gray-500">{formatFirebaseTimestamp(a.date, true)}</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{a.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="w-6 h-6 text-color-b mr-3" />
              Comments ({commentsWithProfileImages.length})
            </h2>
            <button
              onClick={() => setShowComments((s) => !s)}
              className="inline-flex items-center text-gray-600 hover:text-gray-800"
              aria-expanded={showComments}
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${showComments ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showComments && (
            <div className="p-8">
              {/* Comments List */}
              <div className="space-y-6 mb-8">
                {commentsWithProfileImages.map((instance, index) => (
                  <Comment 
                    key={`${instance.userId}-${instance.createdAt?.seconds || index}`}
                    username={instance.username}
                    createdAt={formatFirebaseTimestamp(instance.createdAt)}
                    pfpImage={instance.resolvedPfp}
                    comment={instance.comment}
                  />
                ))}
              </div>

              {/* Add Comment */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input 
                    type="text" 
                    name="comment" 
                    placeholder="Share your thoughts about this project..."  
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-color-b focus:ring-4 focus:ring-color-b/20 transition-all duration-300 text-gray-800 placeholder-gray-400"
                  />
                  <button 
                    type="button" 
                    onClick={handleComment}
                    className="px-8 py-3 bg-gradient-to-r from-color-b to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;