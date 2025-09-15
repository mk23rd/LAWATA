import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase/firebase-config";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  orderBy
} from "firebase/firestore";

const Community = () => {
  const [activeTab, setActiveTab] = useState("dm"); // "dm" or "announcement"

  // DM State
  const [supporters, setSupporters] = useState([]);
  const [supportersNameInput, setSupportersNameInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSupporter, setSelectedSupporter] = useState(null);
  const [dmMessage, setDmMessage] = useState("");
  const [dmHistory, setDmHistory] = useState([]);
  const chatEndRef = useRef(null);

  // Announcement State
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");

  // Fetch supporters once
  useEffect(() => {
    const fetchSupporters = async () => {
      const snapshot = await getDocs(collection(db, "supporters"));
      const supportersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSupporters(supportersList);
    };
    fetchSupporters();
  }, []);

  // Update suggestions as user types
  useEffect(() => {
    if (!supportersNameInput.trim()) {
      setSuggestions([]);
      return;
    }
    const filtered = supporters.filter((s) =>
      s.name.toLowerCase().includes(supportersNameInput.toLowerCase())
    );
    setSuggestions(filtered);
  }, [supportersNameInput, supporters]);

  // Fetch DM history when supporter changes
  useEffect(() => {
    if (!selectedSupporter) return;

    const q = query(
      collection(db, "directMessages"),
      where("to", "==", selectedSupporter.id),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => doc.data());
      setDmHistory(messages);
    });

    return () => unsubscribe();
  }, [selectedSupporter]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [dmHistory]);

  // Select supporter
  const selectSupporter = (supporter) => {
    setSelectedSupporter(supporter);
    setSuggestions([]);
    setSupportersNameInput("");
  };

  // Send DM
  const handleSendDM = async () => {
    if (!dmMessage || !selectedSupporter) return;

    await addDoc(collection(db, "directMessages"), {
      to: selectedSupporter.id,
      toName: selectedSupporter.name,
      message: dmMessage,
      timestamp: serverTimestamp(),
    });
    setDmMessage("");
  };

  // Send Announcement
  const handleSendAnnouncement = async () => {
    if (!announcementTitle || !announcementContent) {
      alert("Please fill in both title and content.");
      return;
    }

    try {
      const supportersSnapshot = await getDocs(collection(db, "supporters"));
      const batchPromises = supportersSnapshot.docs.map((docSnap) =>
        addDoc(collection(db, "announcements"), {
          to: docSnap.id,
          toName: docSnap.data().name,
          title: announcementTitle,
          content: announcementContent,
          timestamp: serverTimestamp(),
        })
      );

      await Promise.all(batchPromises);
      alert("Announcement sent successfully!");
      setAnnouncementTitle("");
      setAnnouncementContent("");
    } catch (error) {
      console.error("Error sending announcement:", error);
      alert("Failed to send announcement");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Community</h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "dm" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("dm")}
        >
          Direct Messages
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "announcement" ? "bg-green-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("announcement")}
        >
          Announcements
        </button>
      </div>

      {/* DM Tab */}
      {activeTab === "dm" && (
        <div className="flex border rounded-lg overflow-hidden shadow-sm h-[500px]">
          {/* Supporter Name Input */}
          <div className="w-1/4 border-r p-4 relative">
            <h3 className="font-bold mb-4">Enter Supporter Name</h3>
            <input
              type="text"
              placeholder="Supporter name..."
              value={supportersNameInput}
              onChange={(e) => setSupportersNameInput(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <ul className="absolute top-24 left-4 right-4 bg-white border rounded shadow z-10 max-h-40 overflow-y-auto">
                {suggestions.map((s) => (
                  <li
                    key={s.id}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => selectSupporter(s)}
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Chat Window */}
          <div className="w-3/4 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {!selectedSupporter && (
                <div className="text-gray-400 text-center mt-20">
                  Enter a supporter name to start chatting.
                </div>
              )}
              {dmHistory.map((msg, idx) => {
                const isCurrentUser = false; // Replace with auth sender if needed
                return (
                  <div
                    key={idx}
                    className={`mb-2 flex ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`px-3 py-2 rounded-lg max-w-xs break-words ${
                        isCurrentUser ? "bg-blue-500 text-white" : "bg-white border"
                      }`}
                    >
                      <div className="text-sm">{msg.message}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {msg.toName} {msg.timestamp?.toDate?.()?.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            {selectedSupporter && (
              <div className="p-4 border-t flex gap-2">
                <input
                  type="text"
                  value={dmMessage}
                  onChange={(e) => setDmMessage(e.target.value)}
                  placeholder={`Message to ${selectedSupporter.name}...`}
                  className="flex-1 p-2 border rounded"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendDM();
                  }}
                />
                <button
                  onClick={handleSendDM}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Announcement Tab */}
      {activeTab === "announcement" && (
        <div className="max-w-2xl mx-auto p-6 mt-4 bg-white rounded-lg shadow-md space-y-4">
          <h3 className="text-xl font-semibold">Make Announcement</h3>
          <input
            type="text"
            placeholder="Announcement Title"
            value={announcementTitle}
            onChange={(e) => setAnnouncementTitle(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Announcement Content"
            value={announcementContent}
            onChange={(e) => setAnnouncementContent(e.target.value)}
            className="w-full p-2 border rounded h-32"
          />
          <button
            onClick={handleSendAnnouncement}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Send Announcement
          </button>
        </div>
      )}
    </div>
  );
};

export default Community;
