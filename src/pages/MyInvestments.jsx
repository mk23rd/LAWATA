import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { getAuth } from 'firebase/auth';
import Navbar from '../components/NavBar';
import { FiDollarSign, FiCalendar, FiTrendingUp } from 'react-icons/fi';

const MyInvestments = () => {
  const [fundings, setFundings] = useState({});
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchFundings = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setFundings(data.fundings || {});
        }
      } catch (err) {
        console.error("Error fetching user fundings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFundings();
  }, [user]);

  if (loading) return <p className="text-center mt-10">Loading your investments...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">My Investments</h1>

        {Object.keys(fundings).length === 0 ? (
          <p className="text-gray-600">You haven’t invested in any projects yet.</p>
        ) : (
          <div className="grid gap-6">
            {Object.entries(fundings).map(([projectId, projectData]) => (
              <div key={projectId} className="bg-white shadow rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold">
                    {projectData.projectTitle || "Unknown Project"}
                  </h2>
                  <div className="text-green-600 flex items-center gap-1 font-medium">
                    <FiTrendingUp /> Total: {projectData.totalFundedPerProject} birr
                  </div>
                </div>

                <div className="space-y-2">
                  {projectData.contributions?.map((contrib, idx) => (
                    <div key={idx} className="flex justify-between text-sm text-gray-700 border-b pb-1">
                      <span className="flex items-center gap-1">
                        <FiDollarSign /> {contrib.amount} birr
                      </span>
                      <span className="flex items-center gap-1">
                        <FiCalendar /> {new Date(contrib.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyInvestments;
