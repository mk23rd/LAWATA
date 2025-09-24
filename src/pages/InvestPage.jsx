import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, DollarSign, TrendingUp, Shield, AlertCircle, Calculator } from 'lucide-react';
import Navbar from "../components/NavBar";

const InvestPage = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [equityPercentage, setEquityPercentage] = useState(0);
  const [processing, setProcessing] = useState(false);
  
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, profileComplete } = useAuth();

  // Get project data passed from ProjectDetails or fetch from database
  useEffect(() => {
    const fetchProject = async () => {
      try {
        // Check if project data was passed via navigation state
        if (location.state?.project) {
          setProject(location.state.project);
          setLoading(false);
          return;
        }

        // Otherwise fetch from database
        const projectRef = doc(db, 'projects', id);
        const projectSnap = await getDoc(projectRef);
        
        if (projectSnap.exists()) {
          const projectData = { id: projectSnap.id, ...projectSnap.data() };
          setProject(projectData);
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
  }, [id, location.state]);

  // Calculate equity percentage based on investment amount
  useEffect(() => {
    if (investmentAmount && project?.equity?.equityPercentage && project?.fundedMoney) {
      const amount = parseFloat(investmentAmount);
      const fundedMoney = project.fundedMoney || 0;
      const totalEquityOffered = project.equity.equityPercentage;
      const availableInvestmentAmount = (fundedMoney * totalEquityOffered) / 100;
      
      if (amount > 0 && availableInvestmentAmount > 0) {
        // Calculate what percentage of the total equity this investment represents
        // Based on the equity percentage of the funded money
        const investmentPercentage = (amount / availableInvestmentAmount) * totalEquityOffered;
        setEquityPercentage(Math.min(investmentPercentage, totalEquityOffered));
      } else {
        setEquityPercentage(0);
      }
    }
  }, [investmentAmount, project]);

  const handleInvestment = async () => {
    if (!currentUser) {
      alert("Please sign in to invest.");
      navigate(`/signing?redirectTo=/invest/${id}`);
      return;
    }

    if (!profileComplete) {
      alert("Please complete your profile to invest.");
      navigate(`/manage-profile?redirectTo=/invest/${id}`);
      return;
    }

    const amount = parseFloat(investmentAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid investment amount.");
      return;
    }

    if (amount < 100) {
      alert("Minimum investment amount is $100.");
      return;
    }

    // Check if investment amount exceeds available investment amount
    const availableInvestmentAmount = ((project.fundedMoney || 0) * (project.equity?.equityPercentage || 0)) / 100;
    if (amount > availableInvestmentAmount) {
      alert(`Investment amount cannot exceed ${formatCurrency(availableInvestmentAmount)} (${project.equity?.equityPercentage || 0}% of funded money).`);
      return;
    }

    setProcessing(true);
    try {
      // Create investment transaction
      const transactionData = {
        projectId: project.id,
        investorId: currentUser.uid,
        investorEmail: currentUser.email,
        amount: amount,
        equityPercentage: equityPercentage,
        type: 'investment',
        status: 'pending',
        createdAt: Timestamp.now(),
        projectTitle: project.title,
        projectCreator: project.createdBy?.name || 'Unknown'
      };

      // Add to transactions collection
      await addDoc(collection(db, 'investments'), transactionData);

      // Update project's funded money (if this counts as funding)
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        fundedMoney: (project.fundedMoney || 0) + amount,
        backers: (project.backers || 0) + 1
      });

      alert(`Investment of $${amount.toLocaleString()} submitted successfully! You will receive ${equityPercentage.toFixed(2)}% equity when approved.`);
      navigate('/myInvestments');
    } catch (err) {
      console.error('Error processing investment:', err);
      alert('Failed to process investment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount?.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) || '$0';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-color-b border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Loading Investment Page</h2>
          <p className="text-gray-600">Preparing investment details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md border border-white/20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Investment Not Available</h2>
          <p className="text-gray-600 mb-6">{error || 'This project is not available for investment.'}</p>
          <button 
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-color-b to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if equity is approved
  const isEquityApproved = project.equity?.equityStatus === 'Approved';
  
  if (!isEquityApproved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Navbar />
        <div className="pt-20 flex justify-center items-center min-h-[80vh]">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md border border-white/20">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Investment Not Available</h2>
            <p className="text-gray-600 mb-6">This project's equity offering has not been approved yet.</p>
            <button 
              onClick={() => navigate(`/projectDet/${id}`)}
              className="bg-gradient-to-r from-color-b to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Back to Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar />

      {/* Back Button */}
      <div className="pt-20 pb-4">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate(`/projectDet/${id}`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-color-b transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Project</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 max-w-4xl">
        {/* Investment Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
          <div className="p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Invest in {project.title}</h1>
                <p className="text-gray-600">Equity Investment Opportunity</p>
              </div>
            </div>

            {/* Project Summary */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Equity Offered</p>
                  <p className="text-2xl font-bold text-color-b">{project.equity?.equityPercentage || 0}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Available for Investment</p>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(((project.fundedMoney || 0) * (project.equity?.equityPercentage || 0)) / 100)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Current Funding</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(project.fundedMoney || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Calculator className="w-6 h-6 text-color-b mr-3" />
            Investment Calculator
          </h2>

          <div className="space-y-6">
            {/* Investment Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Amount (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="Enter investment amount (min $100)"
                  max={((project.fundedMoney || 0) * (project.equity?.equityPercentage || 0)) / 100}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-color-b focus:ring-4 focus:ring-color-b/20 transition-all duration-300 text-lg"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Minimum: $100 | Maximum: {formatCurrency(((project.fundedMoney || 0) * (project.equity?.equityPercentage || 0)) / 100)}
              </p>
            </div>

            {/* Equity Calculation Display */}
            {investmentAmount && parseFloat(investmentAmount) > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Investment Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Investment Amount</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(parseFloat(investmentAmount))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Equity Percentage</p>
                    <p className="text-xl font-bold text-green-600">{equityPercentage.toFixed(2)}%</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Investment Details:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• You will own {equityPercentage.toFixed(2)}% of the company</li>
                    <li>• Investment amount is based on {project.equity?.equityPercentage || 0}% of current funded money</li>
                    <li>• Investment is subject to approval by project creator</li>
                    <li>• Equity will be transferred upon successful project completion</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Investment Button */}
            <button
              onClick={handleInvestment}
              disabled={!investmentAmount || parseFloat(investmentAmount) < 100 || processing}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
                !investmentAmount || parseFloat(investmentAmount) < 100 || processing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
              }`}
            >
              {processing ? 'Processing Investment...' : `Invest ${formatCurrency(parseFloat(investmentAmount) || 0)}`}
            </button>

            {/* Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Investment Disclaimer:</p>
                  <p>
                    This is a high-risk investment. You may lose all or part of your investment. 
                    Please carefully consider your financial situation and risk tolerance before investing. 
                    This investment is not guaranteed and past performance does not indicate future results.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestPage;
