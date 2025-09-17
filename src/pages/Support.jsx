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

const Support = () => {
  const [amount, setAmount] = useState("");
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    // Optional: check profile completeness server-side too, but here we gate UI
    // Since AuthContext now provides profile state, we can fetch it on demand if needed.
    // For simplicity, redirect to manage profile where missing.
    // We'll lazily read user doc inside transaction anyway.

  const numericAmount = parseFloat(amount);
  if (!numericAmount || numericAmount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

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
      // Gate: profile completeness check
      const userData = userSnap.data();
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

      const projectData = projectSnap.data();

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

      // ---- ALL WRITES AFTER ----
      transaction.update(projectRef, {
        fundedMoney: increment(numericAmount),
      });

      transaction.update(userRef, {
        roles: arrayUnion("Funder"),
        totalFunded: newTotalFunded,
        fundings,
      });

      const transactionsCol = collection(db, "transactions");
      const newTransRef = doc(transactionsCol); // auto id
      transaction.set(newTransRef, {
        equityBought: 0,
        fundedMoney: numericAmount,
        funding: true,
        investing: false,
        projectId: id,
        transactionTime: serverTimestamp(),
        userId: currentUser.uid,
      });
    });

    alert(`🎉 You successfully supported with $${numericAmount}!`);
    // notification to the donated
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
    //notification to the donatator
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

      
  } catch (err) {
    console.error("Error processing support:", err);
    alert(err.message || "Something went wrong. Please try again.");
  }
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
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all"
                >
                  ${value}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-lg transition-all"
          >
            Confirm Support
          </button>
        </form>
      </div>
    </div>
  );
};

export default Support;
