import { useState, useEffect, useRef } from "react";
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
import { CheckCircle, XCircle, Loader2, Target, ChevronDown, Wallet, DollarSign, Users, Clock } from "lucide-react";
import { toast } from "react-toastify";
import RewardsList from "../components/project/RewardsList";
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
  const [walletProcessing, setWalletProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success', 'error', or null
  const [walletPaymentStatus, setWalletPaymentStatus] = useState(null); // 'success', 'error', or null
  const [showRewards, setShowRewards] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, profileComplete } = useAuth();
  const paymentProcessedRef = useRef(false);

  const templates = [100, 500, 1000, 3000, 5000, 10000];

  // Fetch project details
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

  // Refresh project data without showing loading state
  const refreshProjectData = async () => {
    try {
      const docRef = doc(db, "projects", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProject({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (err) {
      console.error("Error refreshing project data:", err);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  // Handle payment return from Chapa
  useEffect(() => {
    const handlePaymentReturn = async () => {
      if (paymentProcessedRef.current) {
        return;
      }
      const currentUrl = window.location.href;
      const decodedUrl = currentUrl.replace(/&amp;/g, '&');
      const url = new URL(decodedUrl);
      const params = new URLSearchParams(url.search);
      const txRef = params.get('tx_ref');
      const status = params.get('status');
      const supportAmount = params.get('amount');
      const rewardIndex = params.get('reward_index');
      const rewardTitle = params.get('reward_title');
      const rewardType = params.get('reward_type');
      
      if (status === 'success' && txRef && txRef.startsWith('sp-') && supportAmount) {
        paymentProcessedRef.current = true;
        try {
          // Reconstruct selected reward if it was in the URL
          let reconstructedReward = null;
          if (rewardIndex !== null && rewardTitle && rewardType && project.rewardsList) {
            const index = parseInt(rewardIndex);
            const originalReward = project.rewardsList[index];
            if (originalReward && originalReward.title === rewardTitle) {
              reconstructedReward = { ...originalReward, index };
            }
          }
          
          // Process the support transaction with the reconstructed reward
          await processSupport(parseFloat(supportAmount), reconstructedReward);
          
          // Clean URL
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (error) {
          console.error('Error processing payment return:', error);
          toast.error('Failed to process payment return');
        }
      }
    };
    
    if (currentUser && project) {
      handlePaymentReturn();
    }
  }, [currentUser, project]);

  const handleTemplateClick = (value) => setAmount(value);
  const handleInputChange = (e) => setAmount(e.target.value);

  // Process support transaction after successful payment
  const processSupport = async (numericAmount, rewardFromUrl = null) => {
    // Use reward from URL if provided, otherwise use current selectedReward state
    const rewardToProcess = rewardFromUrl || selectedReward;
    console.log('processSupport called with:', { numericAmount, selectedReward, rewardFromUrl, rewardToProcess });
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

        // Validate reward selection if applicable
        if (rewardToProcess) {
          const rewardFromProject = projectData.rewardsList?.[rewardToProcess.index];
          if (!rewardFromProject) {
            throw new Error("Selected reward no longer exists.");
          }
          
          const rewardAmount = parseFloat(rewardFromProject.amount) || 0;
          if (numericAmount < rewardAmount) {
            throw new Error(`Your contribution of $${numericAmount} is insufficient for the selected reward (requires $${rewardAmount}).`);
          }
          
          if (rewardFromProject.type === 'limited') {
            const remainingQuantity = rewardFromProject.quantity - (rewardFromProject.claimed || 0);
            if (remainingQuantity <= 0) {
              throw new Error("Selected reward is out of stock.");
            }
          }
        }

        // ---- PREPARE DATA LOCALLY ----
        // Determine if this is the user's first time funding this project
        const userFundings = userData.fundings ? { ...userData.fundings } : {};
        const isFirstContributionToProject = !userData.fundings || !userData.fundings[id];

        const nowISO = new Date().toISOString();

        if (userFundings[id]) {
          userFundings[id] = {
            ...userFundings[id],
            contributions: [
              ...(userFundings[id].contributions || []),
              { amount: numericAmount, date: nowISO },
            ],
            totalFundedPerProject:
              (userFundings[id].totalFundedPerProject ?? 0) + numericAmount,
          };
        } else {
          userFundings[id] = {
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

        // Prepare update data for user
        const updateData = {
          totalFunded: newTotalFunded,
          fundingCounter: newFundingCounter,
          fundings: userFundings,
        };

        // Add reward to user's myRewards if a reward was selected
        if (rewardToProcess) {
          const rewardData = {
            rewardId: rewardToProcess.id || `reward_${rewardToProcess.index}_${Date.now()}`,
            description: rewardToProcess.description,
            imageUrl: rewardToProcess.imageUrl,
            title: rewardToProcess.title,
            type: rewardToProcess.type,
            projectId: id,
            projectTitle: projectData.title,
            claimedAt: Timestamp.now(),
            amount: rewardToProcess.amount
          };

          // Initialize myRewards array if it doesn't exist, then add the new reward
          updateData.myRewards = arrayUnion(rewardData);
        }

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

        

        // Check which milestones are reached
        [25, 50, 75, 100].forEach(percentage => {
          if (milestones[percentage]) {
            const milestoneAmount = (fundingGoal * percentage) / 100;
            const previousPercentage = (previousFundedMoney / fundingGoal) * 100;
            const newPercentage = (newFundedMoney / fundingGoal) * 100;


            // If this milestone was just crossed
            if (previousPercentage < percentage && newPercentage >= percentage) {
             
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
        // Build project update (fundedMoney, and backers if first contribution)
        const projectUpdate = {
          fundedMoney: increment(numericAmount),
        };
        if (isFirstContributionToProject) {
          projectUpdate.backers = increment(1);
        }

        // Handle reward selection if a reward was chosen
        if (rewardToProcess && rewardToProcess.type === 'limited') {
          console.log('Processing reward selection:', rewardToProcess);
          // Update the specific reward quantity in the rewardsList array
          const rewardIndex = rewardToProcess.index;
          const updatedRewardsList = [...(projectData.rewardsList || [])];
          if (updatedRewardsList[rewardIndex]) {
            const currentQuantity = updatedRewardsList[rewardIndex].quantity || 0;
            const newQuantity = Math.max(0, currentQuantity - 1);
            console.log(`Updating reward ${rewardIndex}: ${currentQuantity} -> ${newQuantity}`);
            
            updatedRewardsList[rewardIndex] = {
              ...updatedRewardsList[rewardIndex],
              quantity: newQuantity
            };
            projectUpdate.rewardsList = updatedRewardsList;
          }
        }

        transaction.update(projectRef, projectUpdate);

        // Update user record
        transaction.update(userRef, updateData);

        // Create transaction record
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
        const supportMessage = rewardToProcess 
          ? `You donated ${numericAmount}$ to ${project.title} and claimed the reward: ${rewardToProcess.title}!`
          : `You donated ${numericAmount}$ to a project called ${project.title}.`;
          
        await addDoc(collection(db, "notifications"), {
          userId: currentUser.uid,
          projectId: project.id,
          projectTitle: project.title,
          message: supportMessage,
          type: "You_Funded_a_project",
          read: false,
          createdAt: Timestamp.now()
        });
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);
      }

      // Reward claimed notification if applicable
      if (rewardToProcess) {
        try {
          await addDoc(collection(db, "notifications"), {
            userId: currentUser.uid,
            projectId: project.id,
            projectTitle: project.title,
            message: `🎁 Reward Claimed! You've successfully claimed "${rewardToProcess.title}" from ${project.title}. Check your rewards in your profile!`,
            type: "Reward_Claimed",
            read: false,
            createdAt: Timestamp.now()
          });
        } catch (notifErr) {
          console.error("Failed to create reward notification:", notifErr);
        }
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

      // Refresh project data to show updated funding info
      await refreshProjectData();

      // Show success message
      const milestoneMessage = milestonesReached.length > 0 
        ? ` 🎯 This contribution helped reach ${milestonesReached.map(m => m.percentage + '%').join(', ')} milestone(s)!`
        : '';
      const rewardMessage = rewardToProcess 
        ? ` 🎁 Reward "${rewardToProcess.title}" claimed!`
        : '';
      toast.success(`🎉 You successfully supported with $${numericAmount}!${rewardMessage}${milestoneMessage}`, {
        autoClose: 5000
      });

      setTimeout(() => {
        setAmount("");
        setSelectedReward(null); // Clear selected reward
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

    // Basic validation before redirecting to payment
    try {
      const projectRef = doc(db, "projects", id);
      const userRef = doc(db, "users", currentUser.uid);
      
      const [projectSnap, userSnap] = await Promise.all([
        getDoc(projectRef),
        getDoc(userRef),
      ]);

      if (!projectSnap.exists()) {
        toast.error("Project not found");
        return;
      }
      if (!userSnap.exists()) {
        toast.error("User not found in database.");
        return;
      }

      const projectData = projectSnap.data();
      const userData = userSnap.data();

      // Prevent supporting own project
      if (projectData.createdBy?.uid === currentUser.uid) {
        toast.error("You cannot support your own project.");
        return;
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
        toast.error("Please complete your profile before supporting a project.");
        return;
      }

      const currentFunded = projectData.fundedMoney ?? 0;
      const fundingGoal = projectData.fundingGoal ?? Infinity;
      const remaining = fundingGoal - currentFunded;

      if (numericAmount > remaining) {
        toast.error(`You can only fund up to $${remaining}.`);
        return;
      }

    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Failed to validate request. Please try again.");
      return;
    }

    // Create Chapa payment form
    const tempForm = document.createElement('form');
    tempForm.method = 'POST';
    tempForm.action = 'https://api.chapa.co/v1/hosted/pay';
    
    const txRef = `sp-${Date.now()}-${currentUser.uid.substring(0, 8)}`;
    const baseUrl = window.location.origin;
    const returnParams = new URLSearchParams({
      status: 'success',
      tx_ref: txRef,
      amount: numericAmount
    });

    // Add selected reward info to return params if a reward is selected
    if (selectedReward) {
      returnParams.set('reward_index', selectedReward.index);
      returnParams.set('reward_title', selectedReward.title);
      returnParams.set('reward_type', selectedReward.type);
    }
    
    const fields = {
      'public_key': CHAPA_PUBLIC_KEY,
      'tx_ref': txRef,
      'amount': numericAmount,
      'currency': 'ETB',
      'email': currentUser.email || '',
      'first_name': currentUser.displayName?.split(' ')[0] || 'User',
      'last_name': currentUser.displayName?.split(' ')[1] || '',
      'title': `Support: ${project.title}`,
      'description': `Supporting ${project.title} with $${numericAmount}`,
      'logo': 'https://your-logo-url.com/logo.png',
      'return_url': `${baseUrl}/support/${id}?${returnParams.toString()}`,
      'callback_url': `${baseUrl}/api/verify-payment`,
      'meta[title]': 'project-support',
      'meta[user_id]': currentUser.uid,
      'meta[project_id]': id,
      'meta[amount]': numericAmount
    };
    
    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      tempForm.appendChild(input);
    });
    
    document.body.appendChild(tempForm);
    tempForm.submit();
    document.body.removeChild(tempForm);
  };

  // Handle wallet payment
  const handleWalletPayment = async (e) => {
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

    setWalletProcessing(true);
    setWalletPaymentStatus(null);

    try {
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

        // Check wallet balance
        const walletBalance = userData.walletBalance || 0;
        if (walletBalance < numericAmount) {
          throw new Error(`Insufficient wallet balance. You have $${walletBalance.toLocaleString()} but need $${numericAmount.toLocaleString()}.`);
        }

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

        // Validate reward selection if applicable
        if (selectedReward) {
          const rewardFromProject = projectData.rewardsList?.[selectedReward.index];
          if (!rewardFromProject) {
            throw new Error("Selected reward no longer exists.");
          }
          
          const rewardAmount = parseFloat(rewardFromProject.amount) || 0;
          if (numericAmount < rewardAmount) {
            throw new Error(`Your contribution of $${numericAmount} is insufficient for the selected reward (requires $${rewardAmount}).`);
          }
          
          if (rewardFromProject.type === 'limited') {
            const remainingQuantity = rewardFromProject.quantity - (rewardFromProject.claimed || 0);
            if (remainingQuantity <= 0) {
              throw new Error("Selected reward is out of stock.");
            }
          }
        }

        // ---- ALL WRITES AFTER ----
        // Update user's wallet balance
        transaction.update(userRef, {
          walletBalance: increment(-numericAmount)
        });
      });

      // Process the support transaction (similar to processSupport but without affecting main button states)
      await processWalletSupport(numericAmount, selectedReward);
      
      setWalletPaymentStatus('success');
      toast.success(`🎉 Payment successful! $${numericAmount} deducted from your wallet.`, {
        autoClose: 3000
      });

      setTimeout(() => {
        setAmount("");
        setSelectedReward(null);
        setWalletPaymentStatus(null);
      }, 1500);

    } catch (err) {
      console.error("Error processing wallet payment:", err);
      setWalletPaymentStatus('error');
      toast.error(err.message || "Wallet payment failed. Please try again.");

      setTimeout(() => {
        setWalletPaymentStatus(null);
      }, 1500);
    } finally {
      setWalletProcessing(false);
    }
  };

  // Process wallet support transaction (similar to processSupport but independent)
  const processWalletSupport = async (numericAmount, selectedReward) => {
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

        // ---- PREPARE DATA LOCALLY ----
        // Determine if this is the user's first time funding this project
        const userFundings = userData.fundings ? { ...userData.fundings } : {};
        const isFirstContributionToProject = !userData.fundings || !userData.fundings[id];

        const nowISO = new Date().toISOString();

        if (userFundings[id]) {
          userFundings[id] = {
            ...userFundings[id],
            contributions: [
              ...(userFundings[id].contributions || []),
              { amount: numericAmount, date: nowISO },
            ],
            totalFundedPerProject:
              (userFundings[id].totalFundedPerProject ?? 0) + numericAmount,
          };
        } else {
          userFundings[id] = {
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

        // Prepare update data for user
        const updateData = {
          totalFunded: newTotalFunded,
          fundingCounter: newFundingCounter,
          fundings: userFundings,
        };

        // Add reward to user's myRewards if a reward was selected
        if (selectedReward) {
          const rewardData = {
            rewardId: selectedReward.id || `reward_${selectedReward.index}_${Date.now()}`,
            description: selectedReward.description,
            imageUrl: selectedReward.imageUrl,
            title: selectedReward.title,
            type: selectedReward.type,
            projectId: id,
            projectTitle: projectData.title,
            claimedAt: Timestamp.now(),
            amount: selectedReward.amount
          };

          // Initialize myRewards array if it doesn't exist, then add the new reward
          updateData.myRewards = arrayUnion(rewardData);
        }

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
        const currentFunded = projectData.fundedMoney ?? 0;
        const fundingGoal = projectData.fundingGoal ?? Infinity;
        const newFundedMoney = currentFunded + numericAmount;
        const milestones = projectData.milestones || {};

        // Check which milestones are reached
        [25, 50, 75, 100].forEach(percentage => {
          if (milestones[percentage]) {
            const milestoneAmount = (fundingGoal * percentage) / 100;
            const previousPercentage = (previousFundedMoney / fundingGoal) * 100;
            const newPercentage = (newFundedMoney / fundingGoal) * 100;

            // If this milestone was just crossed
            if (previousPercentage < percentage && newPercentage >= percentage) {
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

        // ---- ALL WRITES AFTER ----
        // Build project update (fundedMoney, and backers if first contribution)
        const projectUpdate = {
          fundedMoney: increment(numericAmount),
        };
        if (isFirstContributionToProject) {
          projectUpdate.backers = increment(1);
        }

        // Handle reward selection if a reward was chosen
        if (selectedReward && selectedReward.type === 'limited') {
          // Update the specific reward quantity in the rewardsList array
          const rewardIndex = selectedReward.index;
          const updatedRewardsList = [...(projectData.rewardsList || [])];
          if (updatedRewardsList[rewardIndex]) {
            const currentQuantity = updatedRewardsList[rewardIndex].quantity || 0;
            const newQuantity = Math.max(0, currentQuantity - 1);
            
            updatedRewardsList[rewardIndex] = {
              ...updatedRewardsList[rewardIndex],
              quantity: newQuantity
            };
            projectUpdate.rewardsList = updatedRewardsList;
          }
        }

        transaction.update(projectRef, projectUpdate);

        // Update user record
        transaction.update(userRef, updateData);

        // Create transaction record
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
        } catch (err) {
          console.error("Error fetching previous funders:", err);
        }
      }

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
        const supportMessage = selectedReward 
          ? `You donated ${numericAmount}$ to ${project.title} and claimed the reward: ${selectedReward.title}!`
          : `You donated ${numericAmount}$ to a project called ${project.title}.`;
          
        await addDoc(collection(db, "notifications"), {
          userId: currentUser.uid,
          projectId: project.id,
          projectTitle: project.title,
          message: supportMessage,
          type: "You_Funded_a_project",
          read: false,
          createdAt: Timestamp.now()
        });
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);
      }

      // Reward claimed notification if applicable
      if (selectedReward) {
        try {
          await addDoc(collection(db, "notifications"), {
            userId: currentUser.uid,
            projectId: project.id,
            projectTitle: project.title,
            message: `🎁 Reward Claimed! You've successfully claimed "${selectedReward.title}" from ${project.title}. Check your rewards in your profile!`,
            type: "Reward_Claimed",
            read: false,
            createdAt: Timestamp.now()
          });
        } catch (notifErr) {
          console.error("Failed to create reward notification:", notifErr);
        }
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

      // Refresh project data to show updated funding info
      await refreshProjectData();

    } catch (err) {
      console.error("Error processing wallet support:", err);
      throw err; // Re-throw to be handled by the calling function
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
    
    return "Pay with Chapa";
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

  const getWalletButtonContent = () => {
    if (walletProcessing) {
      return (
        <div className="flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Processing...
        </div>
      );
    }
    
    if (walletPaymentStatus === 'success') {
      return (
        <div className="flex items-center justify-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Payment Successful!
        </div>
      );
    }
    
    if (walletPaymentStatus === 'error') {
      return (
        <div className="flex items-center justify-center">
          <XCircle className="w-5 h-5 mr-2" />
          Payment Failed
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center">
        <Wallet className="w-5 h-5 mr-2" />
        Pay with Wallet
      </div>
    );
  };

  const getWalletButtonStyles = () => {
    if (walletProcessing) {
      return "bg-purple-500 text-white cursor-wait";
    }
    
    if (walletPaymentStatus === 'success') {
      return "bg-green-500 text-white";
    }
    
    if (walletPaymentStatus === 'error') {
      return "bg-red-500 text-white";
    }
    
    return "bg-purple-500 hover:bg-purple-600 text-white";
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
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Wallet Balance Display */}
          {currentUser && (
            <div className="flex justify-end mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">Wallet Balance:</span>
                  <span className="text-base font-bold text-gray-900">
                    ${((currentUser?.walletBalance) || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
  
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Project</h1>
            <p className="text-gray-600">Choose your support amount and help bring this project to life</p>
          </div>
  
          {/* Main Content Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Project Info Section */}
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h2>
                  <p className="text-sm text-gray-600">{project.shortDescription || 'Support this amazing project'}</p>
                </div>
  
                {/* Progress Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Funding Progress</span>
                    <span className="text-sm font-bold text-gray-900">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div 
                      className="bg-gray-900 h-1.5 rounded-full transition-all" 
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
  
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Raised</p>
                        <p className="text-2xl font-bold text-gray-900">${(project.fundedMoney ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Goal</p>
                        <p className="text-2xl font-bold text-gray-900">${project.fundingGoal.toLocaleString()}</p>
                      </div>
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Target className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Remaining</p>
                        <p className="text-xl font-bold text-gray-900">${remaining.toLocaleString()}</p>
                      </div>
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Clock className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Backers</p>
                        <p className="text-2xl font-bold text-gray-900">{project.backers || 0}</p>
                      </div>
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Users className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>
                  </div>
                </div>
  
                {/* Project Image */}
                {project.imageUrl && (
                  <div className="rounded-lg overflow-hidden border border-gray-200">
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Cannot Support Own Project</h3>
                    <p className="text-sm text-gray-600">You cannot support your own project.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">Choose Your Support</h3>
                      
                      {/* Quick Select Buttons */}
                      <div className="mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-3">Quick Select Amount</p>
                        <div className="grid grid-cols-3 gap-3">
                          {templates.map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => handleTemplateClick(value)}
                              disabled={processing}
                              className={`py-2.5 px-3 rounded-lg font-medium transition-all text-sm ${
                                amount === value.toString()
                                  ? "bg-gray-900 text-white"
                                  : processing
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                              }`}
                            >
                              <div className="text-xs mb-1">$</div>
                              <div className="text-base">{value.toLocaleString()}</div>
                            </button>
                          ))}
                        </div>
                      </div>
  
                      {/* Custom Amount Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Or Enter Custom Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg font-medium">$</span>
                          <input
                            type="number"
                            min="1"
                            max={maxSliderAmount}
                            value={amount}
                            onChange={handleInputChange}
                            disabled={processing}
                            className={`w-full pl-10 pr-4 py-2.5 text-lg font-medium border border-gray-200 rounded-lg focus:border-color-b focus:ring-1 focus:ring-color-b transition-all ${
                              processing ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                            }`}
                            placeholder="100"
                          />
                        </div>
                      </div>
  
                      {/* Slider */}
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
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
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #111827 0%, #111827 ${((amount || 0) / maxSliderAmount) * 100}%, #E5E7EB ${((amount || 0) / maxSliderAmount) * 100}%, #E5E7EB 100%)`
                            }}
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>$1</span>
                            <span className="font-medium text-gray-900">${(amount || 0).toLocaleString()}</span>
                            <span>${maxSliderAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
  
                    {/* Reward Selection */}
                    {project.rewardsList && project.rewardsList.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Select a Reward (Optional)</h4>
                        <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                          {project.rewardsList.map((reward, index) => {
                            const numericAmount = parseFloat(amount) || 0;
                            const rewardAmount = parseFloat(reward.amount) || 0;
                            const remainingQuantity = reward.type === 'limited' ? (reward.quantity - (reward.claimed || 0)) : Infinity;
                            const isEligible = numericAmount >= rewardAmount && remainingQuantity > 0;
                            const isSelected = selectedReward?.index === index;
                            
                            return (
                              <div
                                key={index}
                                onClick={() => {
                                  if (isEligible && !processing) {
                                    setSelectedReward(isSelected ? null : { ...reward, index });
                                  }
                                }}
                                className={`relative p-3 border rounded-lg transition-all cursor-pointer ${
                                  isSelected
                                    ? "border-color-b bg-blue-50"
                                    : isEligible
                                    ? "border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm"
                                    : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {reward.imageUrl && (
                                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                      <img
                                        src={reward.imageUrl}
                                        alt={reward.title}
                                        className={`w-full h-full object-cover ${
                                          isEligible ? "" : "grayscale"
                                        }`}
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h5 className={`font-medium text-sm truncate ${
                                      isEligible ? "text-gray-900" : "text-gray-400"
                                    }`}>
                                      {reward.title}
                                    </h5>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-xs font-medium ${
                                        isEligible ? "text-green-600" : "text-gray-400"
                                      }`}>
                                        ${rewardAmount.toLocaleString()}
                                      </span>
                                      {reward.type === 'limited' && (
                                        <span className={`text-xs ${
                                          isEligible ? "text-gray-500" : "text-gray-400"
                                        }`}>
                                          {remainingQuantity} left
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <div className="w-5 h-5 bg-color-b rounded-full flex items-center justify-center flex-shrink-0">
                                      <CheckCircle className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                {!isEligible && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 rounded-lg">
                                    <span className="text-xs text-gray-500 font-medium">
                                      {numericAmount < rewardAmount
                                        ? `Requires $${rewardAmount.toLocaleString()}`
                                        : "Out of Stock"
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {selectedReward && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">
                                Selected: {selectedReward.title}
                              </span>
                            </div>
                            <p className="text-xs text-blue-700 mt-1">
                              {selectedReward.description}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
  
                    {/* Payment Buttons */}
                    <div className="flex gap-3">
                      {/* Chapa Payment Button */}
                      <button
                        type="submit"
                        disabled={processing || paymentStatus === 'success'}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                          processing 
                            ? "bg-gray-400 text-white cursor-wait"
                            : paymentStatus === 'success'
                            ? "bg-green-600 text-white"
                            : paymentStatus === 'error'
                            ? "bg-red-600 text-white"
                            : "bg-gray-900 text-white hover:bg-gray-800"
                        }`}
                      >
                        {processing ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Processing...
                          </div>
                        ) : paymentStatus === 'success' ? (
                          <div className="flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Payment Successful!
                          </div>
                        ) : paymentStatus === 'error' ? (
                          <div className="flex items-center justify-center">
                            <XCircle className="w-4 h-4 mr-2" />
                            Payment Failed
                          </div>
                        ) : (
                          "Pay with Chapa"
                        )}
                      </button>

                      {/* Wallet Payment Button */}
                      <button
                        type="button"
                        onClick={handleWalletPayment}
                        disabled={walletProcessing || walletPaymentStatus === 'success'}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                          walletProcessing 
                            ? "bg-purple-400 text-white cursor-wait"
                            : walletPaymentStatus === 'success'
                            ? "bg-green-600 text-white"
                            : walletPaymentStatus === 'error'
                            ? "bg-red-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                        }`}
                      >
                        {walletProcessing ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Processing...
                          </div>
                        ) : walletPaymentStatus === 'success' ? (
                          <div className="flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Payment Successful!
                          </div>
                        ) : walletPaymentStatus === 'error' ? (
                          <div className="flex items-center justify-center">
                            <XCircle className="w-4 h-4 mr-2" />
                            Payment Failed
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <Wallet className="w-4 h-4 mr-2" />
                            Pay with Wallet
                          </div>
                        )}
                      </button>
                    </div>
  
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
  
          {/* Rewards Section */}
          {project.rewardsList && project.rewardsList.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
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
            </div>
          )}
  
        </div>
      </div>
    </>
  );
};

export default Support;