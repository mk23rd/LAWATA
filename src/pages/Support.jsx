import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  increment,
  arrayUnion,
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
  const { currentUser } = useAuth();

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
      alert("You must be logged in to support a project.");
      return;
    }

    const numericAmount = parseFloat(amount);
    const remainingAmount = project.fundingGoal - (project.fundedMoney ?? 0);

    if (!numericAmount || numericAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (numericAmount > remainingAmount) {
      alert(`You can only fund up to $${remainingAmount}.`);
      return;
    }

    try {
      const now = new Date();

      // 1️⃣ Update project fundedMoney
      const projectRef = doc(db, "projects", id);
      await updateDoc(projectRef, {
        fundedMoney: (project.fundedMoney ?? 0) + numericAmount,
      });

      // 2️⃣ Update user roles and totalFunded
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        roles: arrayUnion("Funder"),
        totalFunded: increment(numericAmount), // total across all projects
      });

      // 3️⃣ Update funders collection with map-based structure
      const funderRef = doc(db, "funders", currentUser.uid);
      const funderSnap = await getDoc(funderRef);

      if (funderSnap.exists()) {
        const funderData = funderSnap.data();
        let projectsFunded = funderData.projectsFunded || {};
        let totalFunded = funderData.totalFunded ?? 0;

        if (projectsFunded[id]) {
          // Project already exists
          projectsFunded[id].contributions.push({
            amount: numericAmount,
            date: now.toISOString(),
          });
          projectsFunded[id].totalFundedPerProject =
            (projectsFunded[id].totalFundedPerProject ?? 0) + numericAmount;
        } else {
          // New project entry
          projectsFunded[id] = {
            projectTitle: project.title,
            totalFundedPerProject: numericAmount,
            contributions: [{ amount: numericAmount, date: now.toISOString() }],
          };
        }

        totalFunded += numericAmount;

        await updateDoc(funderRef, { projectsFunded, totalFunded });
      } else {
        // First time funding
        await setDoc(funderRef, {
          userId: currentUser.uid,
          username: currentUser.displayName ?? currentUser.email ?? "Anonymous",
          totalFunded: numericAmount,
          projectsFunded: {
            [id]: {
              projectTitle: project.title,
              totalFundedPerProject: numericAmount,
              contributions: [{ amount: numericAmount, date: now.toISOString() }],
            },
          },
        });
      }

      alert(`🎉 You successfully supported with $${numericAmount}!`);
      navigate(`/projects/${id}`);
    } catch (err) {
      console.error("Error processing support:", err);
      alert("Something went wrong. Please try again.");
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
