import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, Timestamp, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, DollarSign, Tag, Target, Users } from 'lucide-react';
import { getAuth } from 'firebase/auth';

import Comment from '../components/comment';

const ProjectDetails = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [currentUserData, setCurrentUserData] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  // Real-time project listener
  useEffect(() => {
    const projectRef = doc(db, 'projects', id);

    const unsubscribe = onSnapshot(
      projectRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...docSnap.data() });
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
    if (isFullyFunded) {
      navigate(`/rewards/${id}`);
    } else {
      navigate(`/support/${id}`);
    }
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
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Project Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The project you are looking for does not exist.'}</p>
          <Link 
            to="/browse"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-colors inline-block"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const fundedPercentage = calculateFundingPercentage(project.fundedMoney, project.fundingGoal);
  const isFullyFunded = fundedPercentage >= 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Link 
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Projects
        </Link>

        {/* Project Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="relative h-64 md:h-96">
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
              }}
            />
            <div className="absolute top-4 left-4">
              <span className="bg-white/90 backdrop-blur-sm text-blue-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                <Tag size={14} className="mr-1" />
                {project.category || 'General'}
              </span>
            </div>
            {isFullyFunded && (
              <div className="absolute top-4 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  🎉 Fully Funded!
                </span>
              </div>
            )}
          </div>

          <div className="p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{project.title || 'Untitled Project'}</h1>
            <p className="text-gray-600 text-lg mb-6">{project.shortDescription}</p>

            {/* Funding Progress */}
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <div className="flex justify-between text-lg text-gray-700 mb-4">
                <div className="flex items-center">
                  <DollarSign size={20} className="mr-2 text-green-600" />
                  <span className="font-semibold">{formatFunding(project.fundedMoney || 0)} raised</span>
                </div>
                <div className="flex items-center">
                  <Target size={20} className="mr-2 text-blue-600" />
                  <span className="font-semibold">of {formatFunding(project.fundingGoal)}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div 
                  className={`h-4 rounded-full transition-all duration-1000 ${
                    isFullyFunded ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                  }`}
                  style={{ width: `${fundedPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{Math.round(fundedPercentage)}% funded</span>
                <span>{project.fundingGoal - (project.fundedMoney || 0) > 0 ? 
                  formatFunding(project.fundingGoal - (project.fundedMoney || 0)) + ' to go' : 
                  'Goal reached!'
                }</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center text-gray-700 bg-gray-50 p-4 rounded-lg flex-1 min-w-[180px]">
                <Clock size={20} className="mr-3 text-blue-600" />
                <div>
                  <div className="font-semibold">{project.duration || 'N/A'} days left</div>
                  <div className="text-sm text-gray-500">Duration</div>
                </div>
              </div>
              <div className="flex items-center text-gray-700 bg-gray-50 p-4 rounded-lg flex-1 min-w-[180px]">
                <Calendar size={20} className="mr-3 text-cyan-600" />
                <div>
                  <div className="font-semibold">{project.endDate || 'TBD'}</div>
                  <div className="text-sm text-gray-500">End Date</div>
                </div>
              </div>
              <div className="flex items-center text-gray-700 bg-gray-50 p-4 rounded-lg flex-1 min-w-[180px]">
                <Users size={20} className="mr-3 text-purple-600" />
                <div>
                  <div className="font-semibold">{project.backers || 0} supporters</div>
                  <div className="text-sm text-gray-500">Backers</div>
                </div>
              </div>
            </div>

            {/* Support Button */}
            <div className="flex justify-center mt-6">
              <button
                  onClick={handleClick}
                  className={`py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 ${
                    isFullyFunded
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                  }`}
                >
                  {isFullyFunded ? "View Rewards" : "Support This Project"}
              </button>
            </div>

          </div>
        </div>

        {/* Project Description */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 break-words">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-6">About This Project</h2>
          <div className="text-gray-700 whitespace-pre-wrap break-words">
            {project.longDescription || 'No detailed description available.'}
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 p-6">
          <h2 className="text-xl font-bold mb-4">Comments</h2>

          
          {(project.comments || []).map((instance) => (
            <Comment 
              key={crypto.randomUUID()}
              username={instance.username}
              createdAt={formatFirebaseTimestamp(instance.createdAt)}
              pfpImage={instance.commenterPfp}
              comment={instance.comment}
            />
          ))
          }
        

          <div className="flex items-center gap-2 mt-4">
            <input 
              type="text" 
              name="comment" 
              placeholder="Write a comment..."  
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button 
              type="button" 
              onClick={handleComment}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
