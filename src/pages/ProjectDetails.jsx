import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, Timestamp, onSnapshot, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, DollarSign, Target, Users, Share2, Bookmark, MessageCircle, ChevronDown, Flag, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { useAuth } from "../context/AuthContext";
import { toast } from 'react-toastify';
import Comment from '../components/Comment';
import Navbar from "../components/NavBar";
import MilestoneRoadmap from '../components/MilestoneRoadmap';
import RewardsList from '../components/project/RewardsList';

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
  const [showRewards, setShowRewards] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [showUserReportModal, setShowUserReportModal] = useState(false);
  const [userToReport, setUserToReport] = useState(null);
  
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

  
  const handleReport = () => {
    if (!currentUser) {
      toast.warning("Please sign in to report projects.");
      return;
    }
    setShowReportModal(true);
  };


  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      toast.warning("Please select a reason for reporting.");
      return;
    }
    
    setReportSubmitting(true);
    try {
      await addDoc(collection(db, "reports"), {
        type: "proj-report",
        projectId: id,
        projectTitle: project.title,
        projectCreatorId: project.createdBy?.uid,
        projectCreatorName: project.createdBy?.name,
        reportedBy: currentUser.uid,
        reportedByName: currentUserData?.displayName || currentUser.displayName || currentUser.email,
        reason: reportReason,
        details: reportDetails,
        createdAt: Timestamp.now(),
        status: "pending"
      });
      
      toast.success("Report submitted successfully. Thank you for helping keep our community safe!");
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
    } catch (err) {
      console.error("Error submitting report:", err);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setReportSubmitting(false);
    }
  };

  
  const handleUserReport = (user) => {
    if (!currentUser) {
      toast.warning("Please sign in to report users.");
      return;
    }
    setUserToReport(user);
    setShowUserReportModal(true);
  };


  const handleSubmitUserReport = async () => {
    if (!reportReason.trim()) {
      toast.warning("Please select a reason for reporting.");
      return;
    }
    
    setReportSubmitting(true);
    try {
      await addDoc(collection(db, "reports"), {
        type: "user-report",
        reportedUserId: userToReport.userId,
        reportedUserName: userToReport.username,
        projectId: id,
        projectTitle: project.title,
        reportedBy: currentUser.uid,
        reportedByName: currentUserData?.displayName || currentUser.displayName || currentUser.email,
        reason: reportReason,
        details: reportDetails,
        createdAt: Timestamp.now(),
        status: "pending"
      });
      
      toast.success("Report submitted successfully. Thank you for helping keep our community safe!");
      setShowUserReportModal(false);
      setReportReason('');
      setReportDetails('');
      setUserToReport(null);
    } catch (err) {
      console.error("Error submitting user report:", err);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setReportSubmitting(false);
    }
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
        return date.toLocaleDateString('en-CA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
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

  console.log(project)

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
                {project.createdBy?.profileImageUrl ? (
                  <img 
                    src={project.createdBy.profileImageUrl} 
                    alt={project.createdBy?.name || 'Creator'}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center ${project.createdBy?.profileImageUrl ? 'hidden' : ''}`}>
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

              {/* Rewards Section */}
              {project.rewardsList && project.rewardsList.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowRewards(!showRewards)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-600" />
                      <h2 className="text-base font-semibold text-gray-900">Rewards ({project.rewardsList.length})</h2>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showRewards ? 'rotate-180' : ''}`} />
                  </button>
                  {showRewards && (
                    <div className="p-4 border-t border-gray-200">
                      <RewardsList rewards={project.rewardsList} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Milestones Section */}
            {/* Milestones Section - Visual Roadmap */}
            {project.milestones && Object.keys(project.milestones).length > 0 && (
              <MilestoneRoadmap 
                milestones={project.milestones} 
                fundedPercentage={fundedPercentage} 
              />
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
                  <div className="space-y-3 mb-4">
                    {commentsWithProfileImages.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                    ) : (
                      commentsWithProfileImages.map((instance, index) => (
                        <Comment 
                          key={`${instance.userId}-${instance.createdAt?.seconds || index}`}
                          username={instance.username}
                          createdAt={formatFirebaseTimestamp(instance.createdAt)}
                          pfpImage={instance.resolvedPfp}
                          comment={instance.comment}
                          userId={instance.userId}
                          currentUserId={currentUser?.uid}
                          onReport={handleUserReport}
                        />
                      ))
                    )}
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
                    className = {(fundedPercentage==100) ? "h-2 rounded-full bg-green-600 transition-all" : "h-2 rounded-full bg-color-b transition-all"}
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
                      : 'bg-color-b text-white hover:bg-blue-500'
                  }`}
                >
                  {isFullyFunded ? 'View Rewards' : 'Support This Project'}
                </button>
              )}

              {/* Project Details */}
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Start Date</span>
                  <span className="text-gray-900 font-medium">{formatFirebaseTimestamp(project.createdAt) || 'TBD'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">End Date</span>
                  <span className="text-gray-900 font-medium">{project.endDate || 'TBD'}</span>
                </div>
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

      {/* Project Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Flag className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Report Project</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Help us keep our community safe by reporting projects that violate our guidelines.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Reason for reporting <span className="text-red-600">*</span>
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm"
                  disabled={reportSubmitting}
                >
                  <option value="">Select a reason</option>
                  <option value="spam">Spam or misleading</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="scam">Potential scam or fraud</option>
                  <option value="copyright">Copyright violation</option>
                  <option value="offensive">Offensive or harmful content</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Please provide any additional information that might help us review this report..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm resize-none"
                  disabled={reportSubmitting}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDetails('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all text-sm"
                disabled={reportSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={reportSubmitting || !reportReason.trim()}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Report Modal */}
      {showUserReportModal && userToReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowUserReportModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Flag className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Report User</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Reporting <span className="font-semibold">{userToReport.username}</span> for violating community guidelines.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Reason for reporting <span className="text-red-600">*</span>
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm"
                  disabled={reportSubmitting}
                >
                  <option value="">Select a reason</option>
                  <option value="harassment">Harassment or bullying</option>
                  <option value="spam">Spam</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="hate-speech">Hate speech</option>
                  <option value="impersonation">Impersonation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Please provide any additional information that might help us review this report..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm resize-none"
                  disabled={reportSubmitting}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowUserReportModal(false);
                  setReportReason('');
                  setReportDetails('');
                  setUserToReport(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all text-sm"
                disabled={reportSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitUserReport}
                disabled={reportSubmitting || !reportReason.trim()}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
