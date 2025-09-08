import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, DollarSign, Tag, Target, Users } from 'lucide-react';

const ProjectDetails = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProject({
            id: docSnap.id,
            ...docSnap.data()
          });
        } else {
          setError('Project not found');
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const calculateFundingPercentage = (fundedMoney, fundingGoal) => {
    if (!fundedMoney || !fundingGoal || fundingGoal === 0) return 0;
    const percentage = (fundedMoney / fundingGoal) * 100;
    return Math.min(percentage, 100);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 pt-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading project details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 pt-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md">
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
        </div>
      </div>
    );
  }

  const fundedPercentage = calculateFundingPercentage(project.fundedMoney, project.fundingGoal);
  const isFullyFunded = fundedPercentage >= 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-16">
  <div className="max-w-6xl mx-auto px-4"> {/* Max width for readability */}
    
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
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'; }}
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

      <div className="p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
          {project.title || 'Untitled Project'}
        </h1>
        
        <p className="text-gray-600 text-base md:text-lg mb-4 md:mb-6">
          {project.shortDescription}
        </p>

        {/* Funding Progress */}
        <div className="bg-blue-50 rounded-xl p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between mb-3 text-gray-700 text-sm md:text-base">
            <div className="flex items-center mb-2 md:mb-0">
              <DollarSign size={18} className="mr-2 text-green-600" />
              <span className="font-semibold">{formatFunding(project.fundedMoney || 0)} raised</span>
            </div>
            <div className="flex items-center">
              <Target size={18} className="mr-2 text-blue-600" />
              <span className="font-semibold">of {formatFunding(project.fundingGoal)}</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ${isFullyFunded ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}
              style={{ width: `${fundedPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs md:text-sm text-gray-500">
            <span>{Math.round(fundedPercentage)}% funded</span>
            <span>{project.fundingGoal - (project.fundedMoney || 0) > 0 ? 
              formatFunding(project.fundingGoal - (project.fundedMoney || 0)) + ' to go' : 
              'Goal reached!'
            }</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg flex-1 min-w-[140px]">
            <Clock size={20} className="mr-3 text-blue-600" />
            <div>
              <div className="font-semibold">{project.duration || 'N/A'} days left</div>
              <div className="text-sm text-gray-500">Duration</div>
            </div>
          </div>
          <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg flex-1 min-w-[140px]">
            <Calendar size={20} className="mr-3 text-cyan-600" />
            <div>
              <div className="font-semibold">{project.endDate || 'TBD'}</div>
              <div className="text-sm text-gray-500">End Date</div>
            </div>
          </div>
          <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg flex-1 min-w-[140px]">
            <Users size={20} className="mr-3 text-purple-600" />
            <div>
              <div className="font-semibold">{project.backers || 0} supporters</div>
              <div className="text-sm text-gray-500">Backers</div>
            </div>
          </div>
        </div>

        <button className={`w-full py-3 md:py-4 px-6 md:px-8 rounded-xl font-semibold text-base md:text-lg transition-all duration-300 ${
          isFullyFunded 
            ? 'bg-green-500 hover:bg-green-600 text-white' 
            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white'
        }`}>
          {isFullyFunded ? 'View Rewards' : 'Support This Project'}
        </button>
      </div>
    </div>

    {/* Project Description */}
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-6">About This Project</h2>
      <div className="prose max-w-none text-gray-700">
        {project.longDescription || 'No detailed description available.'}
      </div>
    </div>

    {/* Rewards Section */}
    {project.rewards && project.rewards.length > 0 && (
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Support Rewards</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          {project.rewards.map((reward, index) => (
            <div key={index} className="border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-md w-full sm:w-[48%] md:w-[30%]">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{reward.title}</h3>
              <div className="text-2xl font-bold text-blue-600 mb-2">{formatFunding(reward.amount)}</div>
              <p className="text-gray-600 mb-2">{reward.description}</p>
              <div className="text-sm text-gray-500 mb-2">{reward.backers || 0} backers</div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium">
                Select Reward
              </button>
            </div>
          ))}
        </div>
      </div>
    )}

  </div>
</div>

  );
};

export default ProjectDetails;