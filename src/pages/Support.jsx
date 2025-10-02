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
import { db } from "../firebase/firebase-config";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

// Add slider styles
const sliderStyles = `
  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3B82F6, #1D4ED8);
    cursor: pointer;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
    transition: all 0.2s ease;
  }
  
  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
  }
  
  input[type="range"]::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3B82F6, #1D4ED8);
    cursor: pointer;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
    transition: all 0.2s ease;
  }
  
  input[type="range"]::-moz-range-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
  }
  
  input[type="range"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Support = () => {
  const [amount, setAmount] = useState("");
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success', 'error', or null
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
        // ---- ALL READS FIRST ----
        const projectRef = doc(db, "projects", id);
        const userRef = doc(db, "users", currentUser.uid);

        const [projectSnap, userSnap] = await Promise.all([
          transaction.get(projectRef),
          transaction.get(userRef),
        ]);

        if (!projectSnap.exists()) throw new Error("Project not found");
        if (!userSnap.exists()) throw new Error("User not found in database.");

        const projectData = projectSnap.data();
        const userData = userSnap.data();

        // Store previous funded amount for milestone checking
        previousFundedMoney = projectData.fundedMoney ?? 0;

        // Prevent supporting own project
        if (projectData.createdBy?.uid === currentUser.uid) {
          throw new Error("You cannot support your own project.");
        }

        // Gate: profile completeness check
        const hasProfile = Boolean(
          userData &&
          userData.phoneNumber &&
          userData.profileImageUrl &&
          userData.bio &&
          userData.location &&
          userData.location.city &&
          userData.location.country
        );
        if (!hasProfile) {
          throw new Error("Please complete your profile before supporting a project.");
        }

        const currentFunded = projectData.fundedMoney ?? 0;
        const fundingGoal = projectData.fundingGoal ?? Infinity;
        const remaining = fundingGoal - currentFunded;

        if (numericAmount > remaining) {
          throw new Error(`You can only fund up to $${remaining}.`);
        }

        // ---- PREPARE DATA LOCALLY ----
        const fundings = userData.fundings ? { ...userData.fundings } : {};
        const nowISO = new Date().toISOString();

        if (fundings[id]) {
          fundings[id] = {
            ...fundings[id],
            contributions: [
              ...(fundings[id].contributions || []),
              { amount: numericAmount, date: nowISO },
            ],
            totalFundedPerProject:
              (fundings[id].totalFundedPerProject ?? 0) + numericAmount,
          };
        } else {
          fundings[id] = {
            projectTitle: projectData.title || "Untitled",
            totalFundedPerProject: numericAmount,
            contributions: [{ amount: numericAmount, date: nowISO }],
          };
        }

        const newTotalFunded = (userData.totalFunded ?? 0) + numericAmount;
        const newFundingCounter = (userData.fundingCounter ?? 0) + 1;

        // Check if user should get Investor role
        const shouldAddInvestorRole =
          (newFundingCounter >= 100 || newTotalFunded >= 750000) &&
          !userData.roles?.includes("Investor");

        // Prepare update data
        const updateData = {
          totalFunded: newTotalFunded,
          fundingCounter: newFundingCounter,
          fundings,
        };

        // Add Investor role if conditions are met
        if (shouldAddInvestorRole) {
          updateData.roles = arrayUnion("Investor", "Funder");
          try {
            await addDoc(collection(db, "notifications"), {
              message: `Your Roles have been Promoted you now have access to Investment.`,
              type: "Roles_update",
              read: false,
              userId: currentUser.uid,
              createdAt: Timestamp.now()
            });
          } catch (notifErr) {
            console.error("Failed to create notification:", notifErr);
          }
        } else if (!userData.roles?.includes("Funder")) {
          // Add Funder role if not already present
          updateData.roles = arrayUnion("Funder");
        }

        // Check for milestone completion
        const newFundedMoney = currentFunded + numericAmount;
        const milestones = projectData.milestones || {};
        
        console.log('Checking milestones:', {
          previousFunded: previousFundedMoney,
          newFunded: newFundedMoney,
          goal: fundingGoal,
          milestones: milestones
        });
        
        // Check which milestones are reached
        [25, 50, 75, 100].forEach(percentage => {
          if (milestones[percentage]) {
            const milestoneAmount = (fundingGoal * percentage) / 100;
            const previousPercentage = (previousFundedMoney / fundingGoal) * 100;
            const newPercentage = (newFundedMoney / fundingGoal) * 100;
            
            console.log(`Milestone ${percentage}%:`, {
              previousPercentage,
              newPercentage,
              crossed: previousPercentage < percentage && newPercentage >= percentage
            });
            
            // If this milestone was just crossed
            if (previousPercentage < percentage && newPercentage >= percentage) {
              console.log(`✅ Milestone ${percentage}% reached!`);
              milestonesReached.push({
                percentage,
                description: milestones[percentage].description,
                amount: milestoneAmount
              });
              
              // Update milestone status to completed
              transaction.update(projectRef, {
                [`milestones.${percentage}.status`]: 'completed',
                [`milestones.${percentage}.completedAt`]: serverTimestamp()
              });
            }
          }
        });
        
        console.log('Milestones reached:', milestonesReached);

        // ---- ALL WRITES AFTER ----
        transaction.update(projectRef, {
          fundedMoney: increment(numericAmount),
        });

        transaction.update(userRef, updateData);

        const transactionsCol = collection(db, "transactions");
        const newTransRef = doc(transactionsCol);
        transaction.set(newTransRef, {
          equityBought: 0,
          fundedMoney: numericAmount,
          funding: true,
          status: 'completed',
          type: 'funding',
          projectId: id,
          transactionTime: serverTimestamp(),
          userId: currentUser.uid,
        });
      });

      // Fetch all previous funders for milestone notifications
      if (milestonesReached.length > 0) {
        try {
          const transactionsQuery = query(
            collection(db, 'transactions'),
            where('projectId', '==', id),
            where('funding', '==', true)
          );
          const transactionsSnap = await getDocs(transactionsQuery);
          const funderIds = new Set();
          
          transactionsSnap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.userId && data.userId !== currentUser.uid) {
              funderIds.add(data.userId);
            }
          });
          
          allPreviousFunders = Array.from(funderIds);
          console.log('Previous funders found:', allPreviousFunders.length);
        } catch (err) {
          console.error("Error fetching previous funders:", err);
        }
      }

      setPaymentStatus('success');

      // Notification to the project creator
      try {
        await addDoc(collection(db, "notifications"), {
          userId: project.createdBy.uid,
          projectId: project.id,
          projectTitle: project.title,
          message: `Your Project ${project.title} was funded ${numericAmount}$ by ${currentUser.displayName || "a supporter"}.`,
          type: "Your_project_Funded",
          read: false,
          createdAt: Timestamp.now()
        });
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);
      }

      // Notification to the supporter
      try {
        await addDoc(collection(db, "notifications"), {
          userId: currentUser.uid,
          projectId: project.id,
          projectTitle: project.title,
          message: `You donated ${numericAmount}$ to a project called ${project.title}.`,
          type: "You_Funded_a_project",
          read: false,
          createdAt: Timestamp.now()
        });
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);
      }

      // Send milestone notifications if any milestones were reached
      if (milestonesReached.length > 0) {
        for (const milestone of milestonesReached) {
          // Notify project creator about milestone completion
          try {
            await addDoc(collection(db, "notifications"), {
              userId: project.createdBy.uid,
              projectId: project.id,
              projectTitle: project.title,
              message: `🎉 Milestone Reached! Your project "${project.title}" has reached ${milestone.percentage}% funding ($${milestone.amount.toFixed(2)})! ${milestone.description}`,
              type: "Milestone_Completed",
              read: false,
              createdAt: Timestamp.now()
            });
          } catch (notifErr) {
            console.error("Failed to create milestone notification for creator:", notifErr);
          }

          // Notify all previous funders about milestone completion
          for (const funderId of allPreviousFunders) {
            try {
              await addDoc(collection(db, "notifications"), {
                userId: funderId,
                projectId: project.id,
                projectTitle: project.title,
                message: `🎉 Great news! The project "${project.title}" you supported has reached ${milestone.percentage}% funding milestone! ${milestone.description}`,
                type: "Milestone_Completed",
                read: false,
                createdAt: Timestamp.now()
              });
            } catch (notifErr) {
              console.error(`Failed to create milestone notification for funder ${funderId}:`, notifErr);
            }
          }
        }
      }

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
      
      // Show error message
      toast.error(err.message || "Something went wrong. Please try again.");
      
      setTimeout(() => {
        setPaymentStatus(null);
      }, 1500);
    } finally {
      setProcessing(false);
    }
  };

  const getButtonContent = () => {
    if (processing) {
      return (
        <div className="flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Processing...
        </div>
      );
    }
    
    if (paymentStatus === 'success') {
      return (
        <div className="flex items-center justify-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Payment Successful!
        </div>
      );
    }
    
    if (paymentStatus === 'error') {
      return (
        <div className="flex items-center justify-center">
          <XCircle className="w-5 h-5 mr-2" />
          Payment Failed
        </div>
      );
    }
    
    return "Confirm Support";
  };

  const getButtonStyles = () => {
    if (processing) {
      return "bg-blue-500 text-white cursor-wait";
    }
    
    if (paymentStatus === 'success') {
      return "bg-green-500 text-white";
    }
    
    if (paymentStatus === 'error') {
      return "bg-red-500 text-white";
    }
    
    return "bg-green-500 hover:bg-green-600 text-white";
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen pt-20">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <p className="text-gray-600 text-lg">Loading project...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen pt-20">
        <XCircle className="w-5 h-5 mr-2" />
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );

  if (!project)
    return (
      <div className="flex justify-center items-center min-h-screen pt-20">
        <p className="text-gray-600 text-lg">No project data available</p>
      </div>
    );

  const isOwner = currentUser && project.createdBy?.uid === currentUser.uid;
  const progress = ((project.fundedMoney ?? 0) / project.fundingGoal) * 100;
  const remaining = project.fundingGoal - (project.fundedMoney ?? 0);
  const maxSliderAmount = Math.max(remaining, 1); // Use remaining amount as max, minimum 1

  return (
    <>
      <style>{sliderStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
    

        {/* Single Unified Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/40 p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Project Info Section */}
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{project.title}</h2>
                <p className="text-gray-600">{project.shortDescription || 'Support this amazing project'}</p>
              </div>

            {/* Progress Section */}
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Funding Progress</span>
                  <span className="text-sm font-bold text-color-b">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-color-b to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border-2 border-blue-200">
                  <p className="text-xs text-gray-600 mb-1">Raised</p>
                  <p className="text-2xl font-bold text-color-b">${(project.fundedMoney ?? 0).toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border-2 border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Goal</p>
                  <p className="text-2xl font-bold text-green-600">${project.fundingGoal.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border-2 border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">Remaining</p>
                  <p className="text-xl font-bold text-purple-600">${remaining.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 border-2 border-orange-200">
                  <p className="text-xs text-gray-600 mb-1">Backers</p>
                  <p className="text-2xl font-bold text-orange-600">{project.backers || 0}</p>
                </div>
              </div>
            </div>

              {/* Project Image */}
              {project.imageUrl && (
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <img 
                    src={project.imageUrl} 
                    alt={project.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
            </div>

            {/* Support Form Section */}
            <div>
            {isOwner ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Cannot Support Own Project</h3>
                <p className="text-gray-600">You cannot support your own project.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Choose Your Support</h3>
                  
                  {/* Quick Select Buttons */}
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-600 mb-3">Quick Select Amount</p>
                    <div className="grid grid-cols-3 gap-3">
                      {templates.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleTemplateClick(value)}
                          disabled={processing}
                          className={`relative py-4 px-3 rounded-2xl font-bold transition-all transform hover:scale-105 ${
                            amount === value.toString()
                              ? "bg-gradient-to-r from-color-b to-blue-600 text-white shadow-lg scale-105"
                              : processing
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 hover:shadow-lg border-2 border-gray-200 hover:border-color-b"
                          }`}
                        >
                          <div className="text-xs mb-1">$</div>
                          <div className="text-xl">{value.toLocaleString()}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Or Enter Custom Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl font-bold">$</span>
                      <input
                        type="number"
                        min="1"
                        max={maxSliderAmount}
                        value={amount}
                        onChange={handleInputChange}
                        disabled={processing}
                        className={`w-full pl-10 pr-4 py-4 text-xl font-bold border-2 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-color-b focus:outline-none transition-all ${
                          processing ? "bg-gray-100 cursor-not-allowed border-gray-200" : "bg-white border-gray-300"
                        }`}
                        placeholder="100"
                      />
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-600 mb-3">
                      Adjust Amount with Slider
                    </label>
                    <div className="relative">
                      <input
                        type="range"
                        min="1"
                        max={maxSliderAmount}
                        value={amount || 0}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={processing}
                        className="w-full h-3 bg-gradient-to-r from-blue-200 to-blue-300 rounded-full appearance-none cursor-pointer slider-thumb"
                        style={{
                          background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((amount || 0) / maxSliderAmount) * 100}%, #E5E7EB ${((amount || 0) / maxSliderAmount) * 100}%, #E5E7EB 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>$1</span>
                        <span className="font-bold text-color-b">${(amount || 0).toLocaleString()}</span>
                        <span>${maxSliderAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={processing || paymentStatus === 'success'}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg ${
                    getButtonStyles()
                  }`}
                >
                  {getButtonContent()}
                </button>

                {/* Security Note */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-4">
                  <CheckCircle className="w-4 h-4 text-green-500" />
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