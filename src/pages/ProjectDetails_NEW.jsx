import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, Timestamp, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, DollarSign, Target, Users, Share2, Bookmark, MessageCircle, ChevronDown, Flag, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { useAuth } from "../context/AuthContext";
import { toast } from 'react-toastify';
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
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, profileComplete } = useAuth();
  const auth = getAuth();

  // Real-time project listener
  useEffect(() => {
    const projectRef = doc(db, 'projects', id);
    const unsubscribe = onSnapshot(
      projectRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const projectData = { id: docSnap.id, ...docSnap.data() };
          setProject(projectData);
          
          // Build announcements array
          if (projectData.announcements && typeof projectData.announcements === 'object') {
            const items = Object.entries(projectData.announcements).map(([annId, value]) => ({
              id: annId, ...(value || {}),
            }));
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
                return { ...comment, resolvedPfp: imageUrl };
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
    return () => unsubscribe();
  }, [id]);

  // Fetch current user data and check bookmark status
  useEffect(() => {
    const fetchCurrentUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUserData(userData);
            const bookmarks = userData.bookmarkedProjects || [];
            setIsBookmarked(bookmarks.includes(id));
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
  }, [id, auth]);

  // Preload images
  useEffect(() => {
    if (project && project.secondaryImages) {
      const allImages = [project.imageUrl, ...project.secondaryImages].filter(Boolean);
      allImages.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [project]);

  // Handle bookmark toggle
  const handleBookmark = async () => {
    if (!currentUser) {
      toast.warning("Please sign in to bookmark projects.");
      return;
    }
    if (bookmarkLoading) return;
    setBookmarkLoading(true);
    try {
      const user = auth.currentUser;
      const userDocRef = doc(db, 'users', user.uid);
      if (isBookmarked) {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const bookmarks = userDoc.data().bookmarkedProjects || [];
          const updatedBookmarks = bookmarks.filter(projectId => projectId !== id);
          await updateDoc(userDocRef, { bookmarkedProjects: updatedBookmarks });
          setIsBookmarked(false);
          toast.success("Bookmark removed");
        }
      } else {
        await updateDoc(userDocRef, { bookmarkedProjects: arrayUnion(id) });
        setIsBookmarked(true);
        toast.success("Project bookmarked!");
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      toast.error("Failed to update bookmark");
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Handle report
  const handleReport = () => {
    if (!currentUser) {
      toast.warning("Please sign in to report projects.");
      return;
    }
    toast.info("Report feature coming soon. Thank you for helping keep our community safe!");
  };

  const handleClick = () => {
    const fundedPercentage = calculateFundingPercentage(project.fundedMoney, project.fundingGoal);
    const isFullyFunded = fundedPercentage >= 100;
    if (!currentUser) {
      toast.warning("Please sign in to proceed.");
      navigate(`/signing?redirectTo=${isFullyFunded ? `/rewards/${id}` : `/support/${id}`}`);
      return;
    }
    if (!profileComplete) {
      toast.warning("Please complete your profile to proceed.");
      navigate(`/manage-profile?redirectTo=${isFullyFunded ? `/rewards/${id}` : `/support/${id}`}`);
      return;
    }
    navigate(isFullyFunded ? `/rewards/${id}` : `/support/${id}`);
  };

  const handleInvestClick = () => {
    if (!currentUser) {
      toast.warning("Please sign in to invest.");
      navigate(`/signing?redirectTo=/invest/${id}`);
      return;
    }
    if (!profileComplete) {
      toast.warning("Please complete your profile to invest.");
      navigate(`/manage-profile?redirectTo=/invest/${id}`);
      return;
    }
    navigate(`/invest/${id}`, { state: { project } });
  };

  const calculateFundingPercentage = (fundedMoney, fundingGoal) => {
    if (!fundedMoney || !fundingGoal || fundingGoal === 0) return 0;
    return Math.min((fundedMoney / fundingGoal) * 100, 100);
  };

  const formatFirebaseTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    try {
      if (timestamp.seconds !== undefined) {
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      return timestamp;
    } catch (error) {
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
      const user = auth.currentUser;
      if (!user) {
        toast.warning("You must be logged in to comment.");
        return;
      }
      const username = currentUserData?.displayName || user.displayName || user.email || "Anonymous";
      const commenterPfp = currentUserData?.profileImageUrl || user.photoURL || "https://via.placeholder.com/40";
      const projectRef = doc(db, "projects", id);
      const commentObj = {
        username, commenterPfp, comment: newComment,
        createdAt: Timestamp.now(), userId: user.uid
      };
      await updateDoc(projectRef, { comments: arrayUnion(commentObj) });
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
      toast.error("Failed to add comment.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-20 flex justify-center items-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-color-b border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-white pt-20 flex justify-center items-center">
        <div className="text-center max-w-md">
          <p className="text-gray-600 mb-4">{error || 'Project not found'}</p>
          <button onClick={() => navigate('/browse')} className="text-color-b hover:underline font-medium">
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const fundedPercentage = calculateFundingPercentage(project.fundedMoney, project.fundingGoal);
  const isFullyFunded = fundedPercentage >= 100;
  const daysLeft = project.endDate ? Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
  const allImages = [project.imageUrl, ...(project.secondaryImages || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Back Button */}
      <div className="pt-24 pb-4 px-6">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      </div>

      <div className="px-6 pb-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Carousel */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="relative aspect-video bg-gray-100">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-color-b border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <img
                  src={allImages[currentImageIndex] || project.imageUrl}
                  alt={project.title}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={() => setImageLoading(false)}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3';
                    setImageLoading(false);
                  }}
                />
                
                {/* Carousel Controls */}
                {allImages.length > 1 && !imageLoading && (
                  <>
                    <button
                      onClick={() => {
                        setImageLoading(true);
                        setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/90 text-gray-900 hover:bg-white transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setImageLoading(true);
                        setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/90 text-gray-900 hover:bg-white transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {allImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setImageLoading(true);
                            setCurrentImageIndex(index);
                          }}
                          className={`h-1.5 rounded-full transition-all ${
                            index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75 w-1.5'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Project Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Category Badge */}
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium mb-3">
                {project.category || 'General'}
              </span>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {project.title || 'Untitled Project'}
              </h1>
              
              <p className="text-gray-600 mb-4 leading-relaxed">
                {project.shortDescription}
              </p>

              {/* Creator Info */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {project.createdBy?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created by</p>
                  <p className="text-sm font-medium text-gray-900">{project.createdBy?.name || 'Anonymous'}</p>
                </div>
              </div>

              {/* Long Description */}
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-3">About This Project</h2>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {project.longDescription || 'No detailed description available.'}
                </div>
              </div>
            </div>

            {/* Milestones Section */}
            {project.milestones && project.milestones.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-gray-600" />
                  <h2 className="text-base font-semibold text-gray-900">Milestones</h2>
                </div>
                <div className="space-y-3">
                  {project.milestones.map((milestone, index) => (
                    <div key={milestone.id || index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {milestone.title || `Milestone ${index + 1}`}
                            </h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              milestone.milestoneStatus === "Complete" 
                                ? "bg-green-100 text-green-700" 
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {milestone.milestoneStatus || "Incomplete"}
                            </span>
                          </div>
                          {milestone.description && (
                            <p className="text-gray-600 text-xs mb-1">{milestone.description}</p>
                          )}
                          {milestone.date && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(milestone.date).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric'
                              })}
                            </div>
                          )}
                        </div>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          milestone.milestoneStatus === "Complete" ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Announcements */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowAnnouncements(!showAnnouncements)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gray-600" />
                  <h2 className="text-base font-semibold text-gray-900">Announcements ({announcements.length})</h2>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showAnnouncements ? 'rotate-180' : ''}`} />
              </button>
              {showAnnouncements && (
                <div className="p-4 border-t border-gray-200">
                  {announcements.length === 0 ? (
                    <p className="text-sm text-gray-500">No announcements yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {announcements.map((a) => (
                        <div key={a.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="text-sm font-medium text-gray-900">{a.title || 'Announcement'}</h3>
                            <span className="text-xs text-gray-500">{formatFirebaseTimestamp(a.date)}</span>
                          </div>
                          <p className="text-xs text-gray-600 whitespace-pre-wrap">{a.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowComments(!showComments)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gray-600" />
                  <h2 className="text-base font-semibold text-gray-900">Comments ({commentsWithProfileImages.length})</h2>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showComments ? 'rotate-180' : ''}`} />
              </button>
              {showComments && (
                <div className="p-4 border-t border-gray-200">
                  <div className="space-y-4 mb-4">
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
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add a comment..."  
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:border-color-b focus:ring-1 focus:ring-color-b transition-all text-sm"
                    />
                    <button 
                      onClick={handleComment}
                      className="px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all text-sm"
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Funding Stats */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
              {/* Action Buttons */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={handleBookmark}
                  disabled={bookmarkLoading}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    bookmarkLoading 
                      ? 'bg-gray-100 text-gray-400 cursor-wait' 
                      : isBookmarked 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-900 hover:text-white'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''} ${bookmarkLoading ? 'animate-pulse' : ''}`} />
                </button>
                <button
                  onClick={handleReport}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                >
                  <Flag className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Funding Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-2xl font-bold text-gray-900">{formatFunding(project.fundedMoney || 0)}</span>
                  <span className="text-sm text-gray-500">of {formatFunding(project.fundingGoal)}</span>
                </div>
                
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div
                    className="h-2 rounded-full bg-gray-900 transition-all"
                    style={{ width: `${fundedPercentage}%` }}
                  />
                </div>

                <p className="text-xs text-gray-500">{Math.round(fundedPercentage)}% funded</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Users className="w-3 h-3 text-gray-500" />
                    <p className="text-xs text-gray-500">Backers</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{project.backers || 0}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <p className="text-xs text-gray-500">Days Left</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{daysLeft > 0 ? daysLeft : '0'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {project.equity?.equityStatus === 'Approved' && !isFullyFunded ? (
                <div className="space-y-2">
                  <button
                    onClick={handleClick}
                    className="w-full py-3 px-4 rounded-lg font-medium transition-all bg-gray-900 text-white hover:bg-gray-800 text-sm"
                  >
                    Support This Project
                  </button>
                  <button
                    onClick={handleInvestClick}
                    className="w-full py-3 px-4 rounded-lg font-medium transition-all bg-green-600 text-white hover:bg-green-700 text-sm"
                  >
                    Invest for Equity ({project.equity?.equityPercentage || 0}%)
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleClick}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all text-sm ${
                    isFullyFunded
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isFullyFunded ? 'View Rewards' : 'Support This Project'}
                </button>
              )}

              {/* Project Details */}
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Duration</span>
                  <span className="text-gray-900 font-medium">{project.duration || 0} months</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Start Date</span>
                  <span className="text-gray-900 font-medium">{project.projectStartDate || 'TBD'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">End Date</span>
                  <span className="text-gray-900 font-medium">{project.endDate || 'TBD'}</span>
                </div>
                {project.riskLevel && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Risk Level</span>
                    <span className={`font-medium ${
                      project.riskLevel === 'High' ? 'text-red-600' : 
                      project.riskLevel === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {project.riskLevel}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Project</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={window.location.href} 
                readOnly 
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied!");
                  setShowShareModal(false);
                }}
                className="px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 text-sm"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
