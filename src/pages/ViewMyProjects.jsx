import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase-config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function ViewMyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      const q = query(collection(db, "projects"), where("createdBy.uid", "==", user.uid));
      const snapshot = await getDocs(q);
      const myProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(myProjects);
      setLoading(false);
    };
    fetchProjects();
  }, [user]);

  if (loading) return <p className="text-center mt-6">Loading your projects...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Projects</h1>
      {projects.length === 0 ? (
        <p>You haven't created any projects yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div key={project.id} className="border rounded-lg p-4 shadow hover:shadow-lg transition">
              <h2 className="font-semibold text-xl">{project.title}</h2>
              <p><strong>Category:</strong> {project.category}</p>
              <p><strong>Funding Goal:</strong> ${project.fundingGoal}</p>
              <p><strong>Status:</strong> {project.status}</p>
              {project.imageUrl && <img src={project.imageUrl} alt={project.title} className="mt-2 rounded-lg w-full h-48 object-cover" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
