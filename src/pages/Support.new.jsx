import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  runTransaction,
  collection,
  arrayUnion,
  serverTimestamp,
  increment,
  addDoc,
  Timestamp,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

// Slider styles for the range input
const sliderStyles = `
  input[type="range"] {
    -webkit-appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: #e5e7eb;
    outline: none;
    transition: background 0.2s ease;
  }

  input[type="range"]:focus {
    background: #d1d5db;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #111827;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    transition: all 0.1s ease;
    margin-top: -6px;
  }
  
  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }
  
  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #111827;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    transition: all 0.1s ease;
  }
  
  input[type="range"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  input[type="range"]::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    cursor: pointer;
    background: #e5e7eb;
    border-radius: 2px;
  }
  
  input[type="range"]::-moz-range-track {
    width: 100%;
    height: 4px;
    cursor: pointer;
    background: #e5e7eb;
    border-radius: 2px;
  }
`;

const Support = () => {
  const [amount, setAmount] = useState("");
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, profileComplete } = useAuth();

  const templates = [100, 500, 1000, 3000, 5000, 10000];

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "projects", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Project not found");
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleTemplateClick = (value) => setAmount(value);
  const handleInputChange = (e) => setAmount(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("Please sign in to proceed.");
      navigate(`/signing?redirectTo=/support/${id}`);
      return;
    }
    if (!profileComplete) {
      toast.warning("Please complete your profile to proceed.");
      navigate(`/manage-profile?redirectTo=/support/${id}`);
      return;
    }

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setProcessing(true);
    setPaymentStatus(null);

    try {
      // Store milestone data before transaction
      let milestonesReached = [];
      let previousFundedMoney = 0;
      let allPreviousFunders = [];

      await runTransaction(db, async (transaction) => {
        // Transaction logic remains the same
        // ...
      });

      // Notification logic remains the same
      // ...

      setPaymentStatus('success');
      
      // Show success message
      const milestoneMessage = milestonesReached.length > 0 
        ? ` 🎯 This contribution helped reach ${milestonesReached.map(m => m.percentage + '%').join(', ')} milestone(s)!`
        : '';
      
      toast.success(`🎉 You successfully supported with $${numericAmount}!${milestoneMessage}`, {
        autoClose: 5000
      });

      setTimeout(() => {
        setAmount("");
        setPaymentStatus(null);
      }, 1500);

    } catch (err) {
      console.error("Error processing support:", err);
      setPaymentStatus('error');
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const getButtonContent = () => {
    if (processing) {
      return (
        <div className="flex items-center justify-center">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </div>
      );
    }
    
    if (paymentStatus === 'success') {
      return (
        <div className="flex items-center justify-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          Payment Successful!
        </div>
      );
    }
    
    if (paymentStatus === 'error') {
      return (
        <div className="flex items-center justify-center">
          <XCircle className="w-4 h-4 mr-2" />
          Try Again
        </div>
      );
    }
    
    return "Confirm Support";
  };

  const getButtonStyles = () => {
    if (processing) {
      return "text-gray-600 bg-gray-300 cursor-wait";
    }
    
    if (paymentStatus === 'success') {
      return "bg-green-600 text-white";
    }
    
    if (paymentStatus === 'error') {
      return "bg-red-600 text-white";
    }
    
    return "bg-gray-900 hover:bg-gray-800 text-white";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20">
        <Loader2 className="w-6 h-6 mb-3 text-gray-900 animate-spin" />
        <p className="text-sm text-gray-600">Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20">
        <XCircle className="w-6 h-6 mb-3 text-red-600" />
        <p className="mb-4 text-sm text-gray-900">{error}</p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20">
        <p className="mb-4 text-sm text-gray-600">No project data available</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
        >
          Return Home
        </button>
      </div>
    );
  }

  const isOwner = currentUser && project.createdBy?.uid === currentUser.uid;
  const progress = Math.min(((project.fundedMoney ?? 0) / project.fundingGoal) * 100, 100);
  const remaining = Math.max(project.fundingGoal - (project.fundedMoney ?? 0), 0);
  const maxSliderAmount = Math.max(remaining, 1);

  return (
    <>
      <style>{sliderStyles}</style>
      <div className="min-h-screen bg-white pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Main Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Project Info Section */}
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h2>
                  <p className="text-sm text-gray-600">{project.shortDescription || 'Support this project'}</p>
                </div>

                {/* Progress Section */}
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Funding Progress</span>
                      <span className="text-sm font-semibold text-gray-900">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 overflow-hidden bg-gray-100 rounded-full">
                      <div 
                        className="h-full bg-gray-900 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="p-3 bg-white border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Raised</p>
                      <p className="text-lg font-semibold text-gray-900">${(project.fundedMoney ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Goal</p>
                      <p className="text-lg font-semibold text-gray-900">${project.fundingGoal.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Remaining</p>
                      <p className="text-base font-semibold text-gray-900">${remaining.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Backers</p>
                      <p className="text-lg font-semibold text-gray-900">{project.backers || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Project Image */}
                {project.imageUrl && (
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <img 
                      src={project.imageUrl} 
                      alt={project.title}
                      className="object-cover w-full h-48"
                    />
                  </div>
                )}
              </div>

              {/* Support Form Section */}
              <div>
                {isOwner ? (
                  <div className="py-8 text-center">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 bg-red-50 rounded-full">
                      <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="mb-1 text-lg font-semibold text-gray-900">Cannot Support Own Project</h3>
                    <p className="text-sm text-gray-600">You cannot support your own project.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">Choose Your Support</h3>
                      
                      {/* Quick Select Buttons */}
                      <div className="mb-5">
                        <p className="mb-2 text-xs text-gray-500">Quick Select Amount</p>
                        <div className="grid grid-cols-3 gap-2">
                          {templates.map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => handleTemplateClick(value)}
                              disabled={processing}
                              className={`py-2.5 px-2 text-sm font-medium transition-colors rounded-lg ${
                                amount === value.toString()
                                  ? "bg-gray-900 text-white"
                                  : processing
                                  ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                  : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              ${value.toLocaleString()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Amount Input */}
                      <div className="mb-5">
                        <label className="block mb-1.5 text-xs text-gray-500">
                          Or Enter Custom Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 text-gray-500 transform -translate-y-1/2 top-1/2">$</span>
                          <input
                            type="number"
                            min="1"
                            max={maxSliderAmount}
                            value={amount}
                            onChange={handleInputChange}
                            disabled={processing}
                            className={`w-full py-2.5 pl-8 pr-3 text-base font-medium border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 ${
                              processing ? "bg-gray-50 cursor-not-allowed" : "bg-white"
                            }`}
                            placeholder="100"
                          />
                        </div>
                      </div>

                      {/* Slider */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs text-gray-500">Adjust Amount</label>
                          <span className="text-xs font-medium text-gray-900">${(amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="px-1">
                          <input
                            type="range"
                            min="1"
                            max={maxSliderAmount}
                            value={amount || 0}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={processing}
                            className="w-full"
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-400">
                          <span>$1</span>
                          <span>${maxSliderAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={processing || paymentStatus === 'success' || !amount}
                      className={`w-full py-2.5 text-sm font-medium transition-colors rounded-lg ${
                        processing || paymentStatus === 'success' || !amount
                          ? "text-gray-600 bg-gray-300 cursor-not-allowed"
                          : "text-white bg-gray-900 hover:bg-gray-800"
                      }`}
                    >
                      {getButtonContent()}
                    </button>

                    {/* Security Note */}
                    <div className="flex items-center justify-center gap-2 pt-3 text-xs text-gray-500">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span>Secure payment processing</span>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Support;
