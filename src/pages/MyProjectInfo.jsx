import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, Timestamp, collection, query, where, getDocs, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, DollarSign, Tag, Target, Users } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import Navbar from "../components/NavBar";

const MyProjectInfo = () => {
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
      async (docSnap) => {
        if (docSnap.exists()) {
          const projectData = { id: docSnap.id, ...docSnap.data() };
          setProject(projectData);
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

  };





  const formatFunding = (amount) => {
    return amount?.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) || '$0';
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
            to="/projects"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-colors inline-block"
          >
            Back to projects
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-color-d pt-20">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Project Header */}
        <div className="mb-12">
          {/* Title + Short Description */}
          <div className="text-center px-4 mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {project.title || 'Untitled Project'}
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {project.shortDescription}
            </p>
          </div>

          {/* Image + Info Row */}
          <div className="flex gap-10">
            {/* Left: Image (3/4) */}
            <div className="relative w-3/4 h-64 md:h-[32rem]">
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  e.target.src =
                    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
                }}
              />
              <div className="absolute top-4 left-4">
                <span className="bg-white/90 backdrop-blur-sm text-blue-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                  <Tag size={14} className="mr-1" />
                  {project.category || 'General'}
                </span>
              </div>
              
            </div>

            {/* Right: Info (1/4) */}
            <div className="flex flex-col w-1/4 gap-10">
              {/* Funding Progress */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xl text-gray-700 mb-2">
                  
                  <span>of {formatFunding(project.fundingGoal)}</span>
                </div>

            
              </div>

              {/* Stats */}
              <div className="flex flex-col gap-8">
                <div className="flex items-center text-gray-700 text-2xl rounded-lg">
                  <Clock size={25} className="mr-2 text-blue-600" />
                  <div>
                    <div className="font-semibold">
                      {project.duration || 'N/A'} days left
                    </div>
                    <div className="text text-gray-500">Duration</div>
                  </div>
                </div>
                
              </div>

              {/* Support Button */}
              <div className="">
                <Link 
            to="/projects"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-colors inline-block"
          >
            Back to projects
          </Link>
              </div>
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

        
      </div>
    </div>
  );
};

export default MyProjectInfo;