import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase-config';
import { Clock, Calendar, DollarSign, Tag, Target, Search, Filter, TrendingUp, Users, Star, Heart, Share2, Eye } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';

import Arrow from "../assets/images/arrow-left.svg";
import Navbar from "../components/NavBar";

const Browse = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [userData, setUserData] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  
  const toggleMenu = () => setMenuOpen(!menuOpen);

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
        setFilteredProjects(projectsData);
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

  // Filter and sort projects
  useEffect(() => {
    let filtered = [...projects];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(project => project.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt?.seconds * 1000) - new Date(a.createdAt?.seconds * 1000));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt?.seconds * 1000) - new Date(b.createdAt?.seconds * 1000));
        break;
      case 'most_funded':
        filtered.sort((a, b) => (b.fundedMoney || 0) - (a.fundedMoney || 0));
        break;
      case 'least_funded':
        filtered.sort((a, b) => (a.fundedMoney || 0) - (b.fundedMoney || 0));
        break;
      case 'ending_soon':
        filtered.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
        break;
      default:
        break;
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, selectedCategory, sortBy]);

  const calculateFundingPercentage = (fundedMoney, fundingGoal) => {
    if (!fundedMoney || !fundingGoal || fundingGoal === 0) return 0;
    return Math.min((fundedMoney / fundingGoal) * 100, 100);
  };

  const formatFunding = (amount) => {
    return amount?.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }) || '$0';
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-20 flex justify-center items-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-color-b border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Loading Projects</h2>
        <p className="text-gray-600">Discovering amazing projects for you...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-20 flex justify-center items-center">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md text-center border border-white/20">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-2xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops!</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-gradient-to-r from-color-b to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  const categories = ['all', 'cars', 'cloth', 'books'];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most_funded', label: 'Most Funded' },
    { value: 'least_funded', label: 'Least Funded' },
    { value: 'ending_soon', label: 'Ending Soon' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-color-b/5 to-blue-600/5"></div>
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-titan bg-gradient-to-r from-color-b via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 animate-fade-in-up">
            Discover Amazing Projects
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 animate-fade-in-up animation-delay-200">
            Support innovative ideas and bring creative projects to life through our crowdfunding platform
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-12 animate-fade-in-up animation-delay-300">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold text-gray-800">{projects.length} Projects Live</span>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-color-b" />
                <span className="text-lg font-semibold text-gray-800">Trending Now</span>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="text-lg font-semibold text-gray-800">Active Community</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects, categories, or creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-color-b focus:ring-4 focus:ring-color-b/20 transition-all duration-300 text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-color-b text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-4 pr-10 focus:border-color-b focus:ring-4 focus:ring-color-b/20 transition-all duration-300 cursor-pointer"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="container mx-auto px-4 pb-16">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl max-w-md mx-auto border border-white/20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🌱</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">No Projects Found</h2>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Be the first to launch an amazing project!'
                }
              </p>
              <button 
                onClick={() => navigate('/projects')}
                className="bg-gradient-to-r from-color-b to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Create Project
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProjects.map((project, index) => {
              const fundedPercentage = calculateFundingPercentage(project.fundedMoney, project.fundingGoal);
              const isFullyFunded = fundedPercentage >= 100;
              const daysLeft = project.endDate ? Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

              return (
                <Link 
                  to={`/projectDet/${project.id}`} 
                  key={project.id} 
                  className="group bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Project Image */}
                  <div className="relative overflow-hidden h-48">
                    <img 
                      src={project.imageUrl} 
                      alt={project.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3'; }} 
                    />
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-sm text-color-b px-3 py-1 rounded-full text-sm font-semibold flex items-center shadow-lg">
                        <Tag size={14} className="mr-1" />
                        {project.category || 'General'}
                      </span>
                    </div>

                    {/* Status Badges */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      {isFullyFunded && (
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                          🎉 Funded!
                        </span>
                      )}
                      {daysLeft > 0 && daysLeft <= 7 && !isFullyFunded && (
                        <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                          ⏰ Ending Soon
                        </span>
                      )}
                    </div>

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                        <Eye className="w-6 h-6 text-color-b" />
                      </div>
                    </div>
                  </div>

                  {/* Project Content */}
                  <div className="p-6">
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{Math.round(fundedPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            isFullyFunded 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : 'bg-gradient-to-r from-color-b to-blue-600'
                          }`}
                          style={{ width: `${fundedPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-color-b transition-colors">
                      {project.title || 'Untitled Project'}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {project.shortDescription || 'No description available'}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-color-b">{formatFunding(project.fundedMoney || 0)}</p>
                        <p className="text-xs text-gray-500">Raised</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{project.backers || 0}</p>
                        <p className="text-xs text-gray-500">Backers</p>
                      </div>
                    </div>

                    {/* Days Left */}
                    {daysLeft > 0 && (
                      <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
                        <Clock className="w-4 h-4 mr-1" />
                        {daysLeft} days left
                      </div>
                    )}

                    {/* Action Button */}
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/projectDet/${project.id}`);
                      }}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                        isFullyFunded 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
                          : 'bg-gradient-to-r from-color-b to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white'
                      }`}
                    >
                      {isFullyFunded ? 'View Project' : 'Support Now'}
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;
