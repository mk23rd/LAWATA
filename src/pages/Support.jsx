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
  Timestamp
} from "firebase/firestore";
import { db } from "../firebase/firebase-config";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

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
      alert("Please sign in to proceed.");
      navigate(`/signing?redirectTo=/support/${id}`);
      return;
    }
    if (!profileComplete) {
      alert("Please complete your profile to proceed.");
      navigate(`/manage-profile?redirectTo=/support/${id}`);
      return;
    }

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setProcessing(true);
    setPaymentStatus(null);

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

        // 🚨 Prevent supporting own project
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

      // Show success message after a brief delay
      setTimeout(() => {
        alert(`🎉 You successfully supported with $${numericAmount}!`);
        setAmount("");
        setPaymentStatus(null);
      }, 1500);

    } catch (err) {
      console.error("Error processing support:", err);
      setPaymentStatus('error');
      
      // Show error message after a brief delay
      setTimeout(() => {
        alert(err.message || "Something went wrong. Please try again.");
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
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600 text-lg">Loading project...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );

  if (!project)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600 text-lg">No project data available</p>
      </div>
    );

  const isOwner = currentUser && project.createdBy?.uid === currentUser.uid;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
          Support Project: {project.title}
        </h1>

        <p className="text-center text-gray-600 mb-2">
          Current Funding: ${project.fundedMoney ?? 0}
        </p>
        <p className="text-center text-gray-600 mb-6">
          Remaining Amount: ${project.fundingGoal - (project.fundedMoney ?? 0)}
        </p>

        {isOwner && (
          <p className="text-center text-red-500 font-medium mb-4">
            You cannot support your own project.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-600 font-medium mb-2">
              Enter Amount
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={handleInputChange}
              disabled={isOwner || processing}
              className={`w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                isOwner || processing ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              placeholder="Enter amount (e.g. 100)"
            />
          </div>

          <div>
            <p className="text-gray-600 font-medium mb-2">Quick Select</p>
            <div className="grid grid-cols-3 gap-3">
              {templates.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleTemplateClick(value)}
                  disabled={isOwner || processing}
                  className={`py-2 px-3 rounded-xl font-semibold transition-all ${
                    isOwner || processing
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700"
                  }`}
                >
                  ${value}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isOwner || processing || paymentStatus === 'success'}
            className={`w-full py-3 rounded-xl font-semibold text-lg transition-all ${
              isOwner
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : getButtonStyles()
            }`}
          >
            {isOwner ? "Not Allowed" : getButtonContent()}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Support;