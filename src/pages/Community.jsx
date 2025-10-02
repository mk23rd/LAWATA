import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase-config";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  doc,
  updateDoc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { toast } from 'react-toastify';
import { FiCheck, FiAlertCircle, FiBell } from 'react-icons/fi';

// Community hub for announcements
const Community = () => {
  // Announcement State
  // Title and body for the outgoing announcement
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  // Approved projects owned by the creator (announcement target)
  const [approvedProjects, setApprovedProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const auth = getAuth();

  // Send Announcement
  const handleSendAnnouncement = async () => {
    if (!selectedProjectId) {
      toast.warning("Please choose an approved project.");
      return;
    }
    if (!announcementTitle || !announcementContent) {
      toast.warning("Please fill in both title and content.");
      return;
    }

    try {
      const user = auth.currentUser;
      const projectRef = doc(db, "projects", selectedProjectId);
      const announcementId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;

      const data = {
        title: announcementTitle,
        content: announcementContent,
        date: serverTimestamp(),
        // Persist the author for traceability in the UI
        createdBy: user ? { uid: user.uid, email: user.email || null } : null,
      };

      await updateDoc(projectRef, {
        [`announcements.${announcementId}`]: data,
      });

      toast.success("Announcement posted successfully!");
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setSelectedProjectId("");
    } catch (error) {
      console.error("Error sending announcement:", error);
      toast.error("Failed to send announcement");
    }
  };

  // Load current user's approved projects for the dropdown
  useEffect(() => {
    const loadApproved = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const projectsQ = query(
          collection(db, "projects"),
          where("createdBy.uid", "==", user.uid),
          // Support either 'approved' or 'Approved' just in case
          where("status", "in", ["approved", "Approved"]) 
        );
        const snap = await getDocs(projectsQ);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setApprovedProjects(list);
      } catch (err) {
        console.error("Failed to load approved projects:", err);
      }
    };
    loadApproved();
  }, [auth]);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Announcements
          </h1>
          <p className="text-gray-600">Share updates with your project supporters</p>
        </div>

        {/* Announcement Form */}
        <div className="max-w-3xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FiBell className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Create Announcement</h3>
                </div>

                <div className="space-y-4">
                  {/* Approved Projects Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Project *</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-color-b focus:ring-1 focus:ring-color-b transition-all text-sm bg-white"
                    >
                      <option value="">Choose a project</option>
                      {approvedProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title || "Untitled Project"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                    <input
                      type="text"
                      placeholder="Enter announcement title"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-color-b focus:ring-1 focus:ring-color-b transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                    <textarea
                      placeholder="Share your update..."
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-color-b focus:ring-1 focus:ring-color-b transition-all resize-none text-sm"
                      rows="6"
                    />
                  </div>

                  <button
                    onClick={handleSendAnnouncement}
                    disabled={!selectedProjectId || !announcementTitle || !announcementContent}
                    className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Publish Announcement
                  </button>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
