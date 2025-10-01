// MyProjectInfo.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteField, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore'; // Added deleteDoc
import { db } from '../firebase/firebase-config';
import { getAuth } from 'firebase/auth';
import { 
  FiArrowLeft, 
  FiDollarSign, 
  FiUsers, 
  FiCalendar, 
  FiClock, 
  FiTag, 
  FiTrendingUp,
  FiEdit,
  FiShare2,
  FiEye,
  FiUser,
  FiMapPin,
  FiChevronDown,
  FiSave,
  FiX,
  FiTarget,
  FiFlag,
  FiPlay,
  FiStopCircle,
  FiPlus, // Added for adding images
  FiTrash2, // Added for removing images
  FiUpload,
  FiImage,
  FiCheck
} from 'react-icons/fi';
import Navbar from '../components/NavBar';

// --- Helper function for image upload (similar to CreateProjectForm) ---
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = (error) => reject(error);
  });

const uploadImage = async (file) => {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY; // Ensure you have this API key set
  if (!apiKey) throw new Error("Missing ImgBB API key");
  const base64Image = await toBase64(file);
  const formDataObj = new FormData();
  formDataObj.append("image", base64Image);
  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${apiKey}`,
    { method: "POST", body: formDataObj }
  );
  const data = await response.json();
  if (!data.success) throw new Error("Image upload failed");
  return data.data.url;
};
// --- End of helper functions ---

export default function MyProjectInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [funders, setFunders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedFunders, setExpandedFunders] = useState({});
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [checkingPending, setCheckingPending] = useState(false); // New state for checking
  const [isMilestonesExpanded, setIsMilestonesExpanded] = useState(true); // State for milestones collapse
  const [newSecondaryImageFiles, setNewSecondaryImageFiles] = useState([]); // Store File objects for upload
  const [previewSecondaryImageUrls, setPreviewSecondaryImageUrls] = useState([]); // Store preview URLs
  const [mainImageFile, setMainImageFile] = useState(null); // Store new main image File object
  const [previewMainImageUrl, setPreviewMainImageUrl] = useState(""); // Store preview URL for main image

  const auth = getAuth();
  const user = auth.currentUser;

  // Safe date formatting helper
  const safeFormatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    try {
      let date;
      if (dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        date = new Date(dateValue);
      }
      if (isNaN(date.getTime())) {
        return '';
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date for input:', error);
      return '';
    }
  };

  // Safe date conversion to ISO string
  const safeConvertToISOString = (dateValue) => {
    if (!dateValue) return null;
    try {
      let date;
      if (dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        date = new Date(dateValue);
      }
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    } catch (error) {
      console.error('Error converting date to ISO string:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchProjectAndFunders = async () => {
      if (!user || !id) return;
      setLoading(true);
      try {
        // Fetch project details
        const projectRef = doc(db, 'projects', id);
        const projectSnap = await getDoc(projectRef);
        if (!projectSnap.exists()) {
          setError('Project not found');
          return;
        }
        const projectData = { id: projectSnap.id, ...projectSnap.data() };
        // Check if current user owns this project
        if (projectData.createdBy?.uid !== user.uid) {
          setError('You do not have permission to view this project');
          return;
        }
        setProject(projectData);
        setEditForm({ 
          ...projectData,
          fundingGoal: projectData.fundingGoal || 0,
          title: projectData.title || '',
          shortDescription: projectData.shortDescription || '',
          longDescription: projectData.longDescription || '',
          category: projectData.category || '',
          endDate: safeFormatDateForInput(projectData.endDate),
          secondaryImages: [...projectData.secondaryImages || []], // Initialize edit form with secondary images
          milestones: { ...projectData.milestones || {} } // Initialize milestones
        });
        // Fetch funders data from transactions
        const transactionsQuery = query(
          collection(db, 'transactions'),
          where('projectId', '==', id),
          where('funding', '==', true)
        );
        const transactionsSnap = await getDocs(transactionsQuery);
        const fundersData = [];
        // Get unique funders and their contributions
        const funderMap = new Map();
        for (const transactionDoc of transactionsSnap.docs) {
          const transaction = transactionDoc.data();
          const userId = transaction.userId;
          // Fetch user details
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            // Build a safe display name and location
            const nameFromFirstLast = [userData?.firstName, userData?.lastName].filter(Boolean).join(' ').trim();
            const safeName = (userData?.displayName && userData.displayName.trim())
              || nameFromFirstLast
              || userData?.username
              || userData?.email
              || 'Anonymous';
            const hasCityOrCountry = !!(userData?.location && (userData.location.city || userData.location.country));
            const safeLocation = hasCityOrCountry
              ? [userData.location.city, userData.location.country].filter(Boolean).join(', ')
              : 'Unknown';
            if (funderMap.has(userId)) {
              // Add to existing funder's contributions
              const existingFunder = funderMap.get(userId);
              existingFunder.totalAmount += transaction.fundedMoney;
              existingFunder.contributions.push({
                amount: transaction.fundedMoney,
                date: transaction.transactionTime,
                id: transactionDoc.id
              });
            } else {
              // Create new funder entry
              funderMap.set(userId, {
                id: userId,
                name: safeName,
                email: userData.email,
                profileImage: userData.profileImageUrl || 'https://via.placeholder.com/40',
                location: safeLocation,
                totalAmount: transaction.fundedMoney,
                contributions: [{
                  amount: transaction.fundedMoney,
                  date: transaction.transactionTime,
                  id: transactionDoc.id
                }],
                firstContribution: transaction.transactionTime
              });
            }
          }
        }
        // Convert map to array and sort by total amount
        const fundersArray = Array.from(funderMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
        setFunders(fundersArray);
      } catch (err) {
        console.error('Error fetching project ', err);
        setError('Failed to load project information');
      } finally {
        setLoading(false);
      }
    };
    fetchProjectAndFunders();
  }, [id, user]);

  useEffect(() => {
    const checkPendingChanges = async () => {
      if (!project?.id) return;
      try {
        const pendingChangesQuery = query(
          collection(db, 'changeRequests'),
          where('projectId', '==', project.id),
          where('status', '==', 'pending')
        );
        const pendingChangesSnapshot = await getDocs(pendingChangesQuery);
        const hasPending = !pendingChangesSnapshot.empty;
        // Update project state to indicate pending changes
        setProject(prev => ({
          ...prev,
          hasPendingChanges: hasPending
        }));
      } catch (error) {
        console.error('Error checking pending changes:', error);
      }
    };
    checkPendingChanges();
  }, [project?.id]);

  // Handle main image file selection
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      // Revoke old preview URL if it exists
      if (previewMainImageUrl) URL.revokeObjectURL(previewMainImageUrl);

      const previewUrl = URL.createObjectURL(file); // Create preview URL
      setPreviewMainImageUrl(previewUrl);
      setMainImageFile(file); // Add File object to state
    }
  };

  // Handle secondary image file selection
  const handleSecondaryImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPreviews = [];
    const newFileObjects = [...newSecondaryImageFiles]; // Start with existing files

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file); // Create preview URL
        newPreviews.push(previewUrl);
        newFileObjects.push(file); // Add File object to the list to upload later
      }
    });

    // Update states
    setNewSecondaryImageFiles(newFileObjects);
    setPreviewSecondaryImageUrls(prev => [...prev, ...newPreviews]);
  };

  // Remove a new secondary image before saving
  const removeNewSecondaryImage = (indexToRemove) => {
    const newFiles = newSecondaryImageFiles.filter((_, index) => index !== indexToRemove);
    const newPreviews = previewSecondaryImageUrls.filter((_, index) => index !== indexToRemove);
    setNewSecondaryImageFiles(newFiles);
    setPreviewSecondaryImageUrls(newPreviews);

    // Revoke the old URL to free up memory
    URL.revokeObjectURL(previewSecondaryImageUrls[indexToRemove]);
  };

  // Remove an existing secondary image
  const removeExistingSecondaryImage = (indexToRemove) => {
    setEditForm(prev => {
      const updatedImages = [...prev.secondaryImages];
      updatedImages.splice(indexToRemove, 1);
      return { ...prev, secondaryImages: updatedImages };
    });
  };

  // Remove the new main image
  const removeNewMainImage = () => {
    if (previewMainImageUrl) URL.revokeObjectURL(previewMainImageUrl);
    setPreviewMainImageUrl("");
    setMainImageFile(null);
  };

  // Handle milestone description change
  const handleMilestoneChange = (percentage, value) => {
    setEditForm(prev => ({
      ...prev,
      milestones: {
        ...prev.milestones,
        [percentage]: { ...prev.milestones[percentage], description: value }
      }
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      let date;
      // Handle Firestore timestamp
      if (timestamp.seconds !== undefined) {
        date = new Date(timestamp.seconds * 1000);
      } 
      // Handle JavaScript Date object
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Handle ISO string or numeric timestamp
      else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
      }
      // If it's already a valid date, use it directly
      else {
        date = timestamp;
      }
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'Invalid date';
    }
  };

  const getProgressPercentage = () => {
    if (!project?.fundingGoal || !project?.fundedMoney) return 0;
    return Math.min((project.fundedMoney / project.fundingGoal) * 100, 100);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Toggle a single funder's contribution history
  const toggleFunder = (funderId) => {
    setExpandedFunders((prev) => ({
      ...prev,
      [funderId]: !prev[funderId],
    }));
  };

  // Announcements helpers
  const getAnnouncementsArray = () => {
    if (!project?.announcements || typeof project.announcements !== 'object') return [];
    const items = Object.entries(project.announcements).map(([id, value]) => ({ id, ...(value || {}) }));
    items.sort((a, b) => {
      const da = a.date?.seconds ? a.date.seconds : (a.date ? new Date(a.date).getTime()/1000 : 0);
      const dbt = b.date?.seconds ? b.date.seconds : (b.date ? new Date(b.date).getTime()/1000 : 0);
      return dbt - da;
    });
    return items;
  };

  const startEditAnnouncement = (a) => {
    setEditingAnnouncementId(a.id);
    setEditTitle(a.title || "");
    setEditContent(a.content || "");
  };

  const cancelEditAnnouncement = () => {
    setEditingAnnouncementId(null);
    setEditTitle("");
    setEditContent("");
  };

  const saveEditAnnouncement = async () => {
    if (!editingAnnouncementId || !project?.id) return;
    try {
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        [`announcements.${editingAnnouncementId}.title`]: editTitle,
        [`announcements.${editingAnnouncementId}.content`]: editContent,
      });
      // Optimistic local update
      setProject((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.announcements = { ...(prev.announcements || {}) };
        updated.announcements[editingAnnouncementId] = {
          ...(updated.announcements[editingAnnouncementId] || {}),
          title: editTitle,
          content: editContent,
        };
        return updated;
      });
      cancelEditAnnouncement();
    } catch (err) {
      console.error('Failed to save announcement:', err);
      alert('Failed to save announcement');
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    if (!project?.id) return;
    const confirmed = window.confirm('Delete this announcement? This cannot be undone.');
    if (!confirmed) return;
    try {
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        [`announcements.${announcementId}`]: deleteField(),
      });
      // Optimistic local update
      setProject((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        if (updated.announcements && updated.announcements[announcementId]) {
          const { [announcementId]: _, ...rest } = updated.announcements;
          updated.announcements = rest;
        }
        return updated;
      });
      if (editingAnnouncementId === announcementId) cancelEditAnnouncement();
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      alert('Failed to delete announcement');
    }
  };

  // Create a new announcement in project's announcements map
  const handleCreateAnnouncement = async () => {
    if (!project?.id) return;
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Please enter title and content');
      return;
    }
    try {
      const announcementId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
      const projectRef = doc(db, 'projects', project.id);
      const data = {
        title: newTitle.trim(),
        content: newContent.trim(),
        date: serverTimestamp(),
        createdBy: user ? { uid: user.uid, email: user.email || null } : null,
      };
      await updateDoc(projectRef, {
        [`announcements.${announcementId}`]: data,
      });
      // Optimistic local update
      setProject((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.announcements = { ...(updated.announcements || {}) };
        updated.announcements[announcementId] = {
          ...data,
          date: new Date().toISOString(),
        };
        return updated;
      });
      setNewTitle("");
      setNewContent("");
    } catch (err) {
      console.error('Failed to create announcement:', err);
      alert('Failed to create announcement');
    }
  };

  // Handle project edit form changes (excluding status, imageUrl, secondaryImages, milestones)
  const handleEditChange = (field, value) => {
    // Prevent editing status
    if (field === 'status') {
      console.warn("Status editing is disabled.");
      return;
    }
    // Prevent editing image fields directly through text inputs
    if (field === 'imageUrl' || field === 'secondaryImages') {
      console.warn(`Editing ${field} is handled separately.`);
      return;
    }
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Check for pending requests and enable editing if allowed
  const checkPendingAndEnableEditing = async () => {
    if (!project?.id || checkingPending) return; // Prevent multiple clicks during check
    setCheckingPending(true);
    try {
      const pendingChangesQuery = query(
        collection(db, 'changeRequests'),
        where('projectId', '==', project.id),
        where('status', '==', 'pending')
      );
      const pendingChangesSnapshot = await getDocs(pendingChangesQuery);
      if (!pendingChangesSnapshot.empty) {
        const requestIds = pendingChangesSnapshot.docs.map(doc => doc.id);
        const confirmDelete = window.confirm(
          `You have a pending change request for this project. Do you want to delete it to start a new edit?`
        );
        if (confirmDelete) {
          // Delete all pending requests for the project
          const deletePromises = requestIds.map(reqId => {
            const reqRef = doc(db, 'changeRequests', reqId);
            return deleteDoc(reqRef);
          });
          await Promise.all(deletePromises);
          console.log("Pending change request(s) deleted.");
          // Update local state to reflect removal
          setProject(prev => ({ ...prev, hasPendingChanges: false }));
        } else {
          console.log("Edit cancelled by user due to pending request.");
          setCheckingPending(false);
          return; // Exit if user doesn't confirm deletion
        }
      }
      // If no pending requests existed or they were successfully deleted, enable editing
      setIsEditing(true);
      setEditForm({ 
        ...project, 
        endDate: safeFormatDateForInput(project.endDate),
        secondaryImages: [...project.secondaryImages || []], // Reset secondary images to project's current state
        milestones: { ...project.milestones || {} } // Reset milestones to project's current state
      });
      setNewSecondaryImageFiles([]); // Clear any new files added during a previous edit attempt
      setPreviewSecondaryImageUrls([]); // Clear previews
      setMainImageFile(null); // Clear new main image file
      if (previewMainImageUrl) URL.revokeObjectURL(previewMainImageUrl); // Revoke old preview
      setPreviewMainImageUrl(""); // Clear main image preview
    } catch (error) {
      console.error('Error checking/deleting pending change request:', error);
      alert('An error occurred while checking for pending changes. Please try again.');
    } finally {
      setCheckingPending(false);
    }
  };

  // Handle image updates directly (for both main and secondary images)
  const handleImageUpdates = async () => {

    try {
      const projectRef = doc(db, 'projects', project.id);
      let updates = {};
      let needsUpdate = false;

      if (mainImageFile) {
        console.log("handleImageUpdates: New main image file detected, starting upload...");
        const uploadedMainImageUrl = await uploadImage(mainImageFile);
        console.log("handleImageUpdates: Main image uploaded successfully, URL:", uploadedMainImageUrl);
        updates.imageUrl = uploadedMainImageUrl;
        needsUpdate = true;
      } else {
        console.log("handleImageUpdates: No new main image file selected, skipping main image upload.");
      }

      
      let finalSecondaryImageUrls = [...editForm.secondaryImages];
      console.log("handleImageUpdates: Initial finalSecondaryImageUrls (from editForm):", finalSecondaryImageUrls);

      if (newSecondaryImageFiles.length > 0) {
        const uploadPromises = newSecondaryImageFiles.map(file => uploadImage(file));
        const uploadedUrls = await Promise.all(uploadPromises);
        finalSecondaryImageUrls = [...finalSecondaryImageUrls, ...uploadedUrls];
        needsUpdate = true;
      } 
      
      if (JSON.stringify(finalSecondaryImageUrls) !== JSON.stringify(project.secondaryImages)) {
        updates.secondaryImages = finalSecondaryImageUrls;
        needsUpdate = true;
      } 
     
      if (JSON.stringify(editForm.milestones) !== JSON.stringify(project.milestones)) {
        updates.milestones = editForm.milestones;
        needsUpdate = true;
      }

      if (needsUpdate) {

        await updateDoc(projectRef, updates);

        setProject(prev => {
          const updatedProject = {
            ...prev,
            ...updates // Apply the direct updates to the project state
          };
          return updatedProject;
        });
      }
    } catch (error) {
      console.error('Error within handleImageUpdates:', error);
      throw error; // Re-throw to be caught by handleEditSave
    }
  };

 
  const handleEditSave = async () => {
    // Validate funding goal if changed
    if (editForm.fundingGoal && editForm.fundingGoal < project.fundedMoney) {
      alert(`Funding goal cannot be less than already funded amount (${formatCurrency(project.fundedMoney)})`);
      return;
    }

    try {
      // First, handle image and milestone updates directly
      await handleImageUpdates();

      // Prepare changes object, excluding image fields, milestones, and status
      const changesToSubmit = {};
      Object.keys(editForm).forEach(key => {
        let originalValue = project[key];
        if (originalValue && originalValue.seconds) { 
          originalValue = safeConvertToISOString(originalValue);
        }
        // Exclude status, imageUrl, secondaryImages, and milestones from the change request
        if (key !== 'status' && key !== 'createdAt' && key !== 'imageUrl' && key !== 'secondaryImages' && key !== 'milestones') {
            if (JSON.stringify(editForm[key]) !== JSON.stringify(originalValue)) {
              changesToSubmit[key] = editForm[key];
            }
        }
      });

      // Check if any non-image changes were made
      const hasNonImageChanges = Object.keys(changesToSubmit).length > 0;

      if (!hasNonImageChanges) {
        setIsEditing(false);
        return;
      }

      // Create change request document for non-image fields
      const changeRequestRef = collection(db, 'changeRequests');
      const changeData = {
        projectId: project.id,
        userId: user.uid,
        changes: changesToSubmit,
        status: 'pending',
        createdAt: serverTimestamp(),
        originalValues: {
          title: project.title || '',
          shortDescription: project.shortDescription || '',
          longDescription: project.longDescription || '',
          fundingGoal: project.fundingGoal || 0,
          category: project.category || '',
          startDate: project.startDate || null,
          endDate: safeConvertToISOString(project.endDate),
          
        }        
      };

      // Add original values for other fields that might be changing
      Object.keys(changesToSubmit).forEach(key => {
        if (project.hasOwnProperty(key) && key !== 'status' && key !== 'createdAt') {
          let originalValue = project[key];
          if (originalValue && originalValue.seconds) {
            originalValue = safeConvertToISOString(originalValue);
          }
          changeData.originalValues[key] = originalValue;
        }
      });

      await addDoc(changeRequestRef, changeData);

      
      setProject(prev => ({ 
        ...prev, 
        ...changesToSubmit, // Apply only the changes submitted in the request
        endDate: editForm.endDate ? new Date(editForm.endDate) : null 
      }));

      setIsEditing(false);

       try {
        await addDoc(collection(db, "notifications"), {
          message: `Your request for Change on ${project.title} is being reviewed`,
          type: "ChnageReq", // Note: You had "ChnageReq" in your original snippet, assuming it's intentional
          read: false,
          userId: currentUser.uid, // Use the current user's ID
          createdAt: Timestamp.now()
        });
        console.log("Change request notification created successfully.");
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);

      }
      
      // alert('Change request for other fields submitted successfully! Image and milestone changes applied directly.');

      // Reset new image states after successful save
      setNewSecondaryImageFiles([]);
      setPreviewSecondaryImageUrls([]);
      setMainImageFile(null);
      if (previewMainImageUrl) URL.revokeObjectURL(previewMainImageUrl);
      setPreviewMainImageUrl("");

    } catch (error) {
      console.error('Error submitting change request or updating images:', error);
      alert('Failed to submit change request or update images');
    }
  };

  // console.log(project);


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Navbar />
        <div className="pt-20 flex justify-center items-center min-h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-color-b border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Loading Project Details</h2>
            <p className="text-gray-600">Please wait while we fetch your project information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Navbar />
        <div className="pt-20 flex justify-center items-center min-h-[80vh]">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md border border-white/20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => navigate('/projects')}
              className="bg-gradient-to-r from-color-b to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Back to My Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = getProgressPercentage();
  const daysLeft = project.endDate ? Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar />
      {/* Header */}
      <div className="pt-20 pb-4">
        <div className="max-w-7xl mx-auto px-4">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center space-x-2 text-gray-600 hover:text-color-b transition-colors group mb-6"
          >
            <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to My Projects</span>
          </button>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              {isEditing ? (
                <div className="relative">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => handleEditChange('title', e.target.value)}
                    className="text-4xl md:text-5xl font-titan bg-gradient-to-r from-slate-100 to-white/90 backdrop-blur-sm border-2 border-blue-200 focus:border-color-b focus:outline-none focus:ring-4 focus:ring-blue-100/50 w-full rounded-2xl px-6 py-4 shadow-lg transition-all duration-300 hover:shadow-xl placeholder:text-gray-400"
                    placeholder="Enter project title..."
                  />
                  <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                    <FiEdit className="w-3 h-3 inline mr-1" />
                    Editing
                  </div>
                </div>
              ) : (
                <h1 className="text-4xl md:text-5xl font-titan bg-gradient-to-r from-color-b to-blue-600 bg-clip-text text-transparent mb-2">
                  {project.title}
                </h1>
              )}
              <div className="flex items-center gap-4 text-gray-600 mt-4">
                {/* Status is no longer editable */}
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(project.status)}`}>
                  {project.status || 'Unknown'}
                </span>
                {/* Visual cue for pending changes */}
                {project.hasPendingChanges && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium border border-amber-200 flex items-center gap-1">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                    Pending Changes
                  </span>
                )}
                {isEditing ? (
                  <div className="relative">
                    <select
                      value={editForm.category}
                      onChange={(e) => handleEditChange('category', e.target.value)}
                      className="appearance-none bg-gradient-to-r from-slate-100 to-white/90 backdrop-blur-sm border-2 border-blue-200 focus:border-color-b focus:outline-none focus:ring-4 focus:ring-blue-100/50 px-4 py-2 pr-10 rounded-xl text-sm font-semibold shadow-lg transition-all duration-300 hover:shadow-xl"
                    >
                      <option value="">Select Category</option>
                      <option value="Technology">Technology</option>
                      <option value="Arts">Arts</option>
                      <option value="Education">Education</option>
                      <option value="Environment">Environment</option>
                      <option value="Health">Health</option>
                      <option value="Community">Community</option>
                      <option value="General">General</option>
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                  </div>
                ) : (
                  <span className="flex items-center bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold border border-white/40">
                    <FiTag className="w-4 h-4 mr-1" />
                    {project.category || 'General'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {isEditing ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleEditSave}
                    className="relative px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <FiSave className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Save Changes</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditForm({ 
                        ...project, 
                        endDate: safeFormatDateForInput(project.endDate),
                        secondaryImages: [...project.secondaryImages || []], // Reset images on cancel
                        milestones: { ...project.milestones || {} } // Reset milestones on cancel
                      });
                      setIsEditing(false);
                      setNewSecondaryImageFiles([]); // Clear new files on cancel
                      setPreviewSecondaryImageUrls([]); // Clear previews on cancel
                      setMainImageFile(null); // Clear new main image on cancel
                      if (previewMainImageUrl) URL.revokeObjectURL(previewMainImageUrl); // Revoke old preview on cancel
                      setPreviewMainImageUrl(""); // Clear main image preview on cancel
                    }}
                    className="relative px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <FiX className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Cancel</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={checkPendingAndEnableEditing}
                  disabled={checkingPending}
                  className={`relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 group overflow-hidden ${
                    checkingPending
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-white/80 to-white/90 hover:from-white/90 hover:to-white text-gray-700 backdrop-blur-sm border border-white/40'
                  }`}
                >
                  {checkingPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <FiEdit className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">Edit Project</span>
                    </>
                  )}
                </button>
              )}
              <Link 
                to={`/projectDet/${project.id}`}
                className="relative px-6 py-3 bg-gradient-to-r from-color-b to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <FiEye className="w-4 h-4 relative z-10" />
                <span className="relative z-10">View Public</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Funding Progress</p>
                <p className="text-3xl font-bold text-color-b">{progress.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-color-b/10 rounded-xl">
                <FiTrendingUp className="w-6 h-6 text-color-b" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Amount Raised</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(project.fundedMoney)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FiDollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Funders</p>
                <p className="text-3xl font-bold text-blue-600">{funders.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Days Left</p>
                <p className="text-3xl font-bold text-purple-600">{daysLeft > 0 ? daysLeft : 'Ended'}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FiClock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex space-x-1 bg-white/50 backdrop-blur-sm rounded-2xl p-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'funders', label: `Funders (${funders.length})` },
            { id: 'announcements', label: 'Announcements' },
            { id: 'analytics', label: 'Analytics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-white text-color-b shadow-lg'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Project Details & Milestones (Combined in the left column - spans 2 columns) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Project Image and Description */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                <div className="relative h-64">
                  {isEditing ? (
                    // Modern Editing Mode for Main Image
                    <div className="w-full h-full flex flex-col justify-center items-center p-6 bg-gradient-to-br from-slate-50 to-blue-50">
                      {previewMainImageUrl ? (
                        <div className="relative w-full h-full group">
                          <img
                            src={previewMainImageUrl}
                            alt="Main Preview"
                            className="w-full h-full object-cover rounded-2xl shadow-lg ring-4 ring-blue-100 transition-all duration-300 group-hover:ring-blue-200"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-2xl"></div>
                          <button
                            type="button"
                            onClick={removeNewMainImage}
                            className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 opacity-0 group-hover:opacity-100"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <FiCheck className="w-4 h-4 text-green-500" />
                              New Image Ready
                            </span>
                          </div>
                        </div>
                      ) : project.imageUrl ? (
                        <div className="relative w-full h-full group">
                          <img
                            src={project.imageUrl}
                            alt={project.title}
                            className="w-full h-full object-cover rounded-2xl shadow-lg ring-4 ring-gray-100"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300 rounded-2xl flex items-center justify-center">
                            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <span className="text-sm font-medium text-gray-700">Current Image</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border-4 border-dashed border-gray-300">
                          <div className="text-center">
                            <FiImage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <span className="text-gray-500 text-lg font-medium">No Image</span>
                          </div>
                        </div>
                      )}
                      <input
                        id="mainImageInput"
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageChange}
                        className="hidden"
                      />
                      <button
                        onClick={() => document.getElementById("mainImageInput").click()}
                        className="mt-6 relative bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 group overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <FiUpload className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">
                          {previewMainImageUrl ? 'Change Main Image' : 'Upload Main Image'}
                        </span>
                      </button>
                    </div>
                  ) : (
                    // View Mode for Main Image
                    <>
                      {project.imageUrl ? (
                        <img
                          src={project.imageUrl}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-lg">No Image</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Project Description</h3>
                  {isEditing ? (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Short Description</label>
                        <textarea
                          value={editForm.shortDescription}
                          onChange={(e) => handleEditChange('shortDescription', e.target.value)}
                          className="w-full p-4 bg-gradient-to-r from-slate-100 to-white/90 backdrop-blur-sm border-2 border-blue-200 focus:border-color-b focus:outline-none focus:ring-4 focus:ring-blue-100/50 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl resize-none"
                          rows="3"
                          placeholder="Brief description of your project..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Detailed Description</label>
                        <textarea
                          value={editForm.longDescription}
                          onChange={(e) => handleEditChange('longDescription', e.target.value)}
                          className="w-full p-4 bg-gradient-to-r from-slate-100 to-white/90 backdrop-blur-sm border-2 border-blue-200 focus:border-color-b focus:outline-none focus:ring-4 focus:ring-blue-100/50 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl resize-none"
                          rows="8"
                          placeholder="Detailed description of your project goals, methodology, and expected outcomes..."
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-4">{project.shortDescription}</p>
                      <div className="prose prose-gray max-w-none">
                        <p className="whitespace-pre-wrap">{project.longDescription || 'No detailed description available.'}</p>
                      </div>
                    </>
                  )}
                  {/* Editable End Date */}
                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FiCalendar className="w-4 h-4 text-blue-600" />
                      Project Due Date
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.endDate}
                        onChange={(e) => handleEditChange('endDate', e.target.value)}
                        className="w-full p-3 bg-white border-2 border-blue-200 focus:border-color-b focus:outline-none focus:ring-4 focus:ring-blue-100/50 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
                      />
                    ) : (
                      <p className="text-gray-700 font-medium">{project.endDate ? formatDate(project.endDate) : 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Secondary Images Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <FiImage className="w-6 h-6 text-blue-600" />
                    Project Gallery
                  </h3>
                  <p className="text-gray-600 mt-2">Additional images showcasing your project</p>
                </div>
                <div className="p-6">
                  {isEditing ? (
                    <>
                      {/* Modern Upload Interface */}
                      <div className="mb-8">
                        <label className="block text-sm font-semibold text-gray-700 mb-4">Add New Images</label>
                        <div className="relative">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleSecondaryImageChange}
                            className="hidden"
                            id="secondaryImageInput"
                          />
                          <button
                            onClick={() => document.getElementById("secondaryImageInput").click()}
                            className="w-full p-8 border-3 border-dashed border-blue-300 hover:border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-2xl transition-all duration-300 group"
                          >
                            <div className="text-center">
                              <FiPlus className="w-12 h-12 text-blue-500 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                              <h4 className="text-lg font-semibold text-gray-700 mb-2">Upload New Images</h4>
                              <p className="text-gray-500">Click to select multiple images or drag and drop</p>
                            </div>
                          </button>
                        </div>
                      </div>
                      
                      {/* Image Grid with Modern Design */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                        {/* Render existing images from editForm.secondaryImages */}
                        {editForm.secondaryImages && editForm.secondaryImages.map((imgUrl, index) => (
                          <div key={`existing-${index}`} className="relative group">
                            <div className="aspect-square overflow-hidden rounded-2xl shadow-lg ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-300">
                              <img
                                src={imgUrl}
                                alt={`Project ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/200x150?text=Image+Error'; }}
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-2xl"></div>
                            <button
                              type="button"
                              onClick={() => removeExistingSecondaryImage(index)}
                              className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"
                              aria-label="Remove image"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <span className="text-xs font-medium text-gray-700">Existing</span>
                            </div>
                          </div>
                        ))}
                        
                        {/* Render new preview images */}
                        {previewSecondaryImageUrls.map((previewUrl, index) => (
                          <div key={`new-${index}`} className="relative group">
                            <div className="aspect-square overflow-hidden rounded-2xl shadow-lg ring-2 ring-green-200 group-hover:ring-green-300 transition-all duration-300">
                              <img
                                src={previewUrl}
                                alt="New preview"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/200x150?text=Preview+Error'; }}
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-2xl"></div>
                            <button
                              type="button"
                              onClick={() => removeNewSecondaryImage(index)}
                              className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"
                              aria-label="Remove new image"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-3 left-3 bg-green-500 text-white px-2 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <span className="text-xs font-medium flex items-center gap-1">
                                <FiPlus className="w-3 h-3" />
                                New
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    // View Mode - Show existing images from project data
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {project.secondaryImages && project.secondaryImages.map((imgUrl, index) => (
                        <div key={index} className="relative aspect-square overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                          <img
                            src={imgUrl}
                            alt={`Project ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/200x150?text=Image+Error'; }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Milestones Card - Now placed inside the left column */}
              {project.milestones && (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                  <button
                    onClick={() => setIsMilestonesExpanded(!isMilestonesExpanded)}
                    className="w-full p-6 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 hover:from-purple-100 hover:to-pink-100 transition-all duration-300"
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-xl mr-4">
                        <FiTarget className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-2xl font-bold text-gray-900">Project Milestones</h3>
                        <p className="text-gray-600 text-sm">Track your project progress</p>
                      </div>
                    </div>
                    <FiChevronDown className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${isMilestonesExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {isMilestonesExpanded && (
                    <div className="p-6">
                      <div className="space-y-6">
                        {Object.entries(editForm.milestones || project.milestones).map(([percentage, milestone], index) => (
                          <div key={percentage} className="relative">
                            {/* Connecting Line - only show if not the last item */}
                            {index < Object.keys(editForm.milestones || project.milestones).length - 1 && (
                              <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 to-transparent"></div>
                            )}
                            {/* Milestone Item */}
                            <div className="bg-gradient-to-r from-white to-slate-50 rounded-2xl p-6 shadow-lg border border-gray-100 relative hover:shadow-xl transition-shadow duration-300">
                              <div className="flex items-start">
                                <div className={`w-12 h-12 rounded-full ${
                                  percentage === '25' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                                  percentage === '50' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                                  percentage === '75' ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-green-400 to-green-600'
                                } flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}>
                                  {percentage}%
                                </div>
                                <div className="ml-6 flex-1">
                                  <h4 className="font-bold text-gray-900 text-lg mb-2">Funding Goal: {percentage}%</h4>
                                  {isEditing ? (
                                    <textarea
                                      value={milestone.description || ''}
                                      onChange={(e) => handleMilestoneChange(percentage, e.target.value)}
                                      className="w-full p-3 bg-white border-2 border-gray-200 focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-100/50 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl resize-none"
                                      rows="3"
                                      placeholder={`Describe what will be achieved at ${percentage}% funding...`}
                                    />
                                  ) : (
                                    <p className="text-gray-700 leading-relaxed mb-4">{milestone.description || 'No description provided.'}</p>
                                  )}
                                  <div className="mt-3">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                      <div className="w-2 h-2 bg-amber-400 rounded-full mr-2 animate-pulse"></div>
                                      Pending
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Funding Progress (Right column - spans 1 column) */}
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Funding Progress</h3>
                <div className="mb-6">
                  <div className="flex justify-between text-lg font-semibold text-gray-800 mb-2">
                    <span>{formatCurrency(project.fundedMoney)}</span>
                    <span className="text-gray-500">
                      {isEditing ? (
                        <div className="relative">
                          <input
                            type="number"
                            value={editForm.fundingGoal || 0}
                            onChange={(e) => handleEditChange('fundingGoal', Number(e.target.value) || 0)}
                            className="bg-gradient-to-r from-slate-100 to-white/90 backdrop-blur-sm border-2 border-blue-200 focus:border-color-b focus:outline-none focus:ring-4 focus:ring-blue-100/50 rounded-xl px-3 py-2 w-32 text-right shadow-lg transition-all duration-300 hover:shadow-xl"
                            placeholder="Goal"
                          />
                          <div className="absolute -top-6 right-0 text-xs text-gray-500 font-normal">
                            Funding Goal
                          </div>
                        </div>
                      ) : (
                        formatCurrency(project.fundingGoal)
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                    <div
                      className="bg-gradient-to-r from-color-b to-blue-600 h-4 rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{progress.toFixed(1)}% funded</span>
                    <span>
                      {project.fundingGoal - (project.fundedMoney || 0) > 0
                        ? formatCurrency(project.fundingGoal - (project.fundedMoney || 0)) + ' to go'
                        : 'Goal reached!'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <FiUsers className="w-6 h-6 text-color-b mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">{funders.length}</p>
                    <p className="text-sm text-gray-600">Funders</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <FiCalendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">{daysLeft || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Days Left</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'announcements' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-8 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Announcements</h3>
            </div>
            <div className="p-8 space-y-6">
              {/* Inline Composer */}
              <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Create Announcement</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Announcement Title"
                  />
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full p-2 border rounded h-28"
                    placeholder="Announcement Content"
                  />
                  <div className="flex justify-end">
                    <button onClick={handleCreateAnnouncement} className="px-4 py-2 bg-color-b text-white rounded hover:bg-blue-600">Post</button>
                  </div>
                </div>
              </div>
              {getAnnouncementsArray().length === 0 ? (
                <p className="text-gray-600">No announcements yet.</p>
              ) : (
                <div className="space-y-6">
                  {getAnnouncementsArray().map((a) => (
                    <div key={a.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                      {editingAnnouncementId === a.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="Announcement Title"
                          />
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-2 border rounded h-28"
                            placeholder="Announcement Content"
                          />
                          <div className="flex gap-2">
                            <button onClick={saveEditAnnouncement} className="px-4 py-2 bg-color-b text-white rounded hover:bg-blue-600">Save</button>
                            <button onClick={cancelEditAnnouncement} className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xl font-semibold text-gray-900">{a.title || 'Announcement'}</h4>
                            <span className="text-sm text-gray-500">{formatDate(a.date)}</span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap mb-4">{a.content}</p>
                          <div className="flex gap-2">
                            <button onClick={() => startEditAnnouncement(a)} className="px-4 py-2 bg-white border rounded hover:bg-gray-50">Edit</button>
                            <button onClick={() => deleteAnnouncement(a.id)} className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'funders' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-8 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <FiUsers className="w-6 h-6 text-color-b mr-3" />
                Project Funders ({funders.length})
              </h3>
              <p className="text-gray-600 mt-2">People who have supported your project</p>
            </div>
            <div className="p-8">
              {funders.length === 0 ? (
                <div className="text-center py-12">
                  <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-600 mb-2">No Funders Yet</h4>
                  <p className="text-gray-500">Your project hasn't received any funding yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {funders.map((funder, index) => (
                    <div key={funder.id} className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <img
                            src={funder.profileImage}
                            alt={funder.name}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/48';
                            }}
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900">{funder.name}</h4>
                            <div className="flex items-center text-sm text-gray-600">
                              <FiMapPin className="w-4 h-4 mr-1" />
                              {funder.location}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-color-b">{formatCurrency(funder.totalAmount)}</p>
                          <p className="text-sm text-gray-600">{funder.contributions.length} contribution{funder.contributions.length > 1 ? 's' : ''}</p>
                          <button
                            onClick={() => toggleFunder(funder.id)}
                            className="mt-2 inline-flex items-center text-sm text-color-b hover:text-blue-700 transition-colors"
                            aria-expanded={!!expandedFunders[funder.id]}
                            aria-controls={`contrib-${funder.id}`}
                          >
                            <FiChevronDown className={`w-4 h-4 mr-1 transition-transform ${expandedFunders[funder.id] ? 'rotate-180' : ''}`} />
                            {expandedFunders[funder.id] ? 'Hide' : 'Show'} contributions
                          </button>
                        </div>
                      </div>
                      {/* Contributions Details */}
                      {expandedFunders[funder.id] && (
                        <div id={`contrib-${funder.id}`} className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="font-medium text-gray-800 mb-3">Contribution History</h5>
                          <div className="space-y-2">
                            {funder.contributions.map((contribution, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">{formatDate(contribution.date)}</span>
                                <span className="font-semibold text-gray-800">{formatCurrency(contribution.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FiTrendingUp className="w-6 h-6 text-color-b mr-3" />
              Project Analytics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                <h4 className="font-semibold text-gray-800 mb-2">Average Contribution</h4>
                <p className="text-3xl font-bold text-blue-600">
                  {funders.length > 0 ? formatCurrency((project.fundedMoney || 0) / funders.length) : '$0'}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                <h4 className="font-semibold text-gray-800 mb-2">Funding Rate</h4>
                <p className="text-3xl font-bold text-green-600">{progress.toFixed(1)}%</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                <h4 className="font-semibold text-gray-800 mb-2">Total Contributions</h4>
                <p className="text-3xl font-bold text-purple-600">
                  {funders.reduce((total, funder) => total + funder.contributions.length, 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}