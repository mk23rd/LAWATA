import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase-config';
import { Clock, Calendar, DollarSign, Tag, Target } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';

import Arrow from "../assets/images/arrow-left.svg";

const Browse = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [userData, setUserData] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) setUserData(userDoc.data());
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
    };
    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-dropdown')) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch approved projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('status', '==', 'Approved'));
        const querySnapshot = await getDocs(q);
        const projectsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProjects(projectsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const calculateFundingPercentage = (fundedMoney, fundingGoal) => {
    if (!fundedMoney || !fundingGoal || fundingGoal === 0) return 0;
    return Math.min((fundedMoney / fundingGoal) * 100, 100);
  };

  const formatFunding = (amount) => {
    return amount?.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }) || '$0';
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 pt-20 flex justify-center items-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 pt-20 flex justify-center items-center">
      <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-4">Oops!</h2>
        <p className="mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold">
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-color-d">
      {/* Navbar (from Home) */}
      <nav className='fixed top-0 left-0 w-screen h-20 z-50 flex items-center bg-color-d'>
        <div className='w-1/6 h-full flex justify-center items-center'>
          <Link to='/' className='font-titan text-5xl text-color-b'>LAWATA</Link>
        </div>

        <div className='w-4/6 h-full flex justify-center items-center'>
          <div className='bg-color-e rounded-2xl w-2xl h-13 gap-40 flex items-center justify-evenly'>
            <Link to="/projects" className='text-color-d text-2xl hover:underline'>Create</Link>
            <Link to="/browse" className='text-color-d text-2xl hover:underline'>Browse Works</Link>
            <Link to="/about" className='text-color-d text-2xl hover:underline'>About</Link>
          </div>
        </div>

        <div className='w-1/6 h-full flex justify-center items-center user-dropdown'>
          <div className="relative">
            <button onClick={toggleDropdown} className='bg-color-e rounded-2xl w-35 h-10 flex items-center justify-center text-color-d font-medium hover:bg-opacity-90 transition-colors px-4 truncate'>
              {userData?.username || user?.email || 'User'}
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-color-e rounded-md shadow-lg z-10">
                <div className="py-1">
                  {user ? (
                    <>
                      <div className="px-4 py-2 text-sm text-color-d border-b border-color-d border-opacity-20">
                        <p className="font-medium truncate">{userData?.username || 'User'}</p>
                        <p className="truncate text-opacity-80">{user?.email}</p>
                      </div>
                      <button onClick={() => navigate("/profile")} className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10">Profile</button>
                      <button onClick={() => navigate("/projects")} className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10">Projects</button>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10">Logout</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => navigate("/signing", { state: { panel: "signup" } })} className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10">Sign Up</button>
                      <button onClick={() => navigate("/signing", { state: { panel: "login" } })} className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10">Login</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="container mx-auto px-4 pt-28 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-color-b bg-clip-text text-transparent">
          Discover Amazing Projects
        </h1>
        <p className="text-lg text-color-e max-w-2xl mx-auto">
          Support innovative ideas and bring creative projects to life
        </p>
        <div className="mt-6 bg-white rounded-full px-4 py-2 inline-flex items-center shadow-md">
          <span className="text-color-b font-semibold mr-2">●</span>
          <span className="text-color-e">{projects.length} projects live</span>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="container mx-auto px-4 pb-16 flex flex-wrap justify-center gap-8">
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl p-12 shadow-lg max-w-md mx-auto">
              <div className="text-6xl mb-4">🌱</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">No Projects Yet</h2>
              <p className="text-gray-600 mb-6">Be the first to launch an amazing project!</p>
              <button className="bg-color-b hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-colors">Create Project</button>
            </div>
          </div>
        ) : (
          projects.map(project => {
            const fundedPercentage = calculateFundingPercentage(project.fundedMoney, project.fundingGoal);
            const isFullyFunded = fundedPercentage >= 100;

            return (
              <Link to={`/projectDet/${project.id}`} key={project.id} className="bg-color-d rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group border border-color-b w-full max-w-sm">
                <div className="relative overflow-hidden h-48">
                  <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3'; }} />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-color-b px-2 py-0.5 rounded-full text-xs font-semibold flex items-center">
                      <Tag size={12} className="mr-1" />
                      {project.category || 'General'}
                    </span>
                  </div>
                  {isFullyFunded && <div className="absolute top-3 right-3"><span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">🎉 Fully Funded!</span></div>}
                </div>

                <div className="flex flex-col">
                  <div className="gap-2 flex flex-col">
                    <div className="w-full rounded-b-full h-2 mb-1">
                      <div className={`h-2.5 rounded-b-full full transition-all duration-1000 ${isFullyFunded ? 'bg-green-500' : 'bg-gradient-to-r from-color-b to-cyan-500'}`} style={{ width: `${fundedPercentage}%` }}></div>
                    </div>

                    <div className="px-3 flex justify-between text text-gray-700">
                      <div className="flex items-center"><DollarSign size={14} className="mr-1 text-green-600" />{formatFunding(project.fundedMoney || 0)} raised</div>
                      <div className="flex items-center"><Target size={14} className="mr-1 text-color-b" />of {formatFunding(project.fundingGoal)}</div>
                    </div>
                  </div>

                  <h3 className="mt-2 px-3 text-3xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-color-b transition-colors">{project.title || 'Untitled Project'}</h3>

                  <div className="px-3 mb-3 text-sm text-gray-600 opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-20 transition-all duration-300 overflow-hidden">
                    {project.shortDescription || 'No description available'}
                  </div>

                  <div className="px-3 flex items-center justify-between mb-3 text text-gray-600">
                    <div className="flex items-center"><Clock size={14} className="mr-1 text-color-b" />{project.duration || 'N/A'} days left</div>
                    <div className="flex items-center"><Calendar size={14} className="mr-1 text-cyan-600" />Ends: { project.endDate || 'TBD'}</div>
                  </div>

                  <div className='mx-3 mb-10 flex items-center justify-center'>
                    <button onClick={() => navigate(`/projectDet/${project.id}`)} className={`w-full py-2 px-4 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${isFullyFunded ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gradient-to-r from-color-b to-cyan-600 hover:from-color-b hover:to-cyan-700 text-white'}`}>{isFullyFunded ? 'View Project' : 'Support Now'}</button>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  );
};

export default Browse;
