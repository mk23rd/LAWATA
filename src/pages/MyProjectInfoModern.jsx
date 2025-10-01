// MyProjectInfo.js - Modern Redesign
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteField, serverTimestamp, Timestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';
import { 
  FiArrowLeft, 
  FiDollarSign, 
  FiUsers, 
  FiCalendar, 
  FiClock, 
  FiTag, 
  FiTrendingUp,
  FiEdit,
  FiEye,
  FiTarget,
  FiPlus,
  FiTrash2,
  FiImage,
  FiCheckCircle,
  FiAlertCircle,
  FiActivity,
  FiBarChart2,
  FiX
} from 'react-icons/fi';
import Navbar from '../components/NavBar';
import {
  ProjectCard,
  StatCard,
  Button,
  AnnouncementManager,
  ProjectEditForm,
  ProjectAnalytics
} from '../components/project';

const auth = getAuth();
const currentUser = auth.currentUser;

// Helper functions
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = (error) => reject(error);
  });

const uploadImage = async (file) => {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
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

export default function MyProjectInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [funders, setFunders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [checkingPending, setCheckingPending] = useState(false);
  const [newSecondaryImageFiles, setNewSecondaryImageFiles] = useState([]);
  const [previewSecondaryImageUrls, setPreviewSecondaryImageUrls] = useState([]);
  const [mainImageFile, setMainImageFile] = useState(null);
  const [previewMainImageUrl, setPreviewMainImageUrl] = useState("");

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
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date for input:', error);
      return '';
    }
  };

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
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    } catch (error) {
      console.error('Error converting date to ISO string:', error);
      return null;
    }
  };

  // Fetch project and funders
  useEffect(() => {
    const fetchProjectAndFunders = async () => {
      if (!user || !id) return;
      setLoading(true);
      try {
        const projectRef = doc(db, 'projects', id);
        const projectSnap = await getDoc(projectRef);
        if (!projectSnap.exists()) {
          setError('Project not found');
          return;
        }
        const projectData = { id: projectSnap.id, ...projectSnap.data() };
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
          secondaryImages: [...projectData.secondaryImages || []],
          milestones: { ...projectData.milestones || {} }
        });

        // Fetch funders
        const transactionsQuery = query(
          collection(db, 'transactions'),
          where('projectId', '==', id),
          where('funding', '==', true)
        );
        const transactionsSnap = await getDocs(transactionsQuery);
        const funderMap = new Map();
        
        for (const transactionDoc of transactionsSnap.docs) {
          const transaction = transactionDoc.data();
          const userId = transaction.userId;
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
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
              const existingFunder = funderMap.get(userId);
              existingFunder.totalAmount += transaction.fundedMoney;
              existingFunder.contributions.push({
                amount: transaction.fundedMoney,
                date: transaction.transactionTime,
                id: transactionDoc.id
              });
            } else {
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
        const fundersArray = Array.from(funderMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
        setFunders(fundersArray);
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project information');
      } finally {
        setLoading(false);
      }
    };
    fetchProjectAndFunders();
  }, [id, user]);

  // Check for pending changes on load
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

  // Announcement handlers
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

  const handleCreateAnnouncement = async (title, content) => {
    if (!project?.id) return;
    try {
      const announcementId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
      const projectRef = doc(db, 'projects', project.id);
      const data = {
        title: title.trim(),
        content: content.trim(),
        date: serverTimestamp(),
        createdBy: user ? { uid: user.uid, email: user.email || null } : null,
      };
      await updateDoc(projectRef, {
        [`announcements.${announcementId}`]: data,
      });
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
      toast.success('Announcement created successfully!');
    } catch (err) {
      console.error('Failed to create announcement:', err);
      toast.error('Failed to create announcement');
      throw err;
    }
  };

  const saveEditAnnouncement = async (announcementId, title, content) => {
    if (!project?.id) return;
    try {
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        [`announcements.${announcementId}.title`]: title,
        [`announcements.${announcementId}.content`]: content,
      });
      setProject((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.announcements = { ...(prev.announcements || {}) };
        updated.announcements[announcementId] = {
          ...(updated.announcements[announcementId] || {}),
          title,
          content,
        };
        return updated;
      });
      toast.success('Announcement updated successfully!');
    } catch (err) {
      console.error('Failed to save announcement:', err);
      toast.error('Failed to save announcement');
      throw err;
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    if (!project?.id) return;
    try {
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        [`announcements.${announcementId}`]: deleteField(),
      });
      setProject((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        if (updated.announcements && updated.announcements[announcementId]) {
          const { [announcementId]: _, ...rest } = updated.announcements;
          updated.announcements = rest;
        }
        return updated;
      });
      toast.success('Announcement deleted successfully!');
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      toast.error('Failed to delete announcement');
      throw err;
    }
  };

  // Check for pending changes before enabling edit
  const checkPendingAndEnableEditing = async () => {
    if (!project?.id || checkingPending) return;
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
          setProject(prev => ({ ...prev, hasPendingChanges: false }));
        } else {
          console.log("Edit cancelled by user due to pending request.");
          setCheckingPending(false);
          return;
        }
      }
      
      // Enable editing
      setIsEditing(true);
      setEditForm({ 
        ...project, 
        endDate: safeFormatDateForInput(project.endDate),
        secondaryImages: [...project.secondaryImages || []],
        milestones: { ...project.milestones || {} }
      });
    } catch (error) {
      console.error('Error checking/deleting pending change request:', error);
      toast.error('An error occurred while checking for pending changes. Please try again.');
    } finally {
      setCheckingPending(false);
    }
  };

  // Image handlers
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      if (previewMainImageUrl) URL.revokeObjectURL(previewMainImageUrl);
      const previewUrl = URL.createObjectURL(file);
      setPreviewMainImageUrl(previewUrl);
      setMainImageFile(file);
    }
  };

  const handleSecondaryImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPreviews = [];
    const newFileObjects = [...newSecondaryImageFiles];

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        newPreviews.push(previewUrl);
        newFileObjects.push(file);
      }
    });

    setNewSecondaryImageFiles(newFileObjects);
    setPreviewSecondaryImageUrls(prev => [...prev, ...newPreviews]);
  };

  const removeNewSecondaryImage = (indexToRemove) => {
    const newFiles = newSecondaryImageFiles.filter((_, index) => index !== indexToRemove);
    const newPreviews = previewSecondaryImageUrls.filter((_, index) => index !== indexToRemove);
    setNewSecondaryImageFiles(newFiles);
    setPreviewSecondaryImageUrls(newPreviews);
    URL.revokeObjectURL(previewSecondaryImageUrls[indexToRemove]);
  };

  const removeExistingSecondaryImage = (indexToRemove) => {
    setEditForm(prev => {
      const updatedImages = [...prev.secondaryImages];
      updatedImages.splice(indexToRemove, 1);
      return { ...prev, secondaryImages: updatedImages };
    });
  };

  const removeNewMainImage = () => {
    if (previewMainImageUrl) URL.revokeObjectURL(previewMainImageUrl);
    setPreviewMainImageUrl("");
    setMainImageFile(null);
  };

  const handleImageSave = async () => {
    try {
      const projectRef = doc(db, 'projects', project.id);
      let updates = {};
      let needsUpdate = false;

      // Upload main image if changed
      if (mainImageFile) {
        const uploadedMainImageUrl = await uploadImage(mainImageFile);
        updates.imageUrl = uploadedMainImageUrl;
        needsUpdate = true;
      }

      // Upload secondary images if added
      let finalSecondaryImageUrls = [...editForm.secondaryImages || []];
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

      if (needsUpdate) {
        await updateDoc(projectRef, updates);
        setProject(prev => ({ ...prev, ...updates }));
        toast.success('Images updated successfully!');
        
        // Reset states
        setNewSecondaryImageFiles([]);
        setPreviewSecondaryImageUrls([]);
        setMainImageFile(null);
        if (previewMainImageUrl) URL.revokeObjectURL(previewMainImageUrl);
        setPreviewMainImageUrl("");
      } else {
        toast.info('No image changes detected');
      }
    } catch (error) {
      console.error('Error updating images:', error);
      toast.error('Failed to update images');
    }
  };

  // Edit handlers
  const handleEditChange = (field, value) => {
    if (field === 'status') {
      console.warn("Status editing is disabled.");
      return;
    }
    if (field === 'imageUrl' || field === 'secondaryImages') {
      console.warn(`Editing ${field} is handled separately.`);
      return;
    }
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditSave = async () => {
    if (editForm.fundingGoal && editForm.fundingGoal < project.fundedMoney) {
      toast.error(`Funding goal cannot be less than already funded amount (${formatCurrency(project.fundedMoney)})`);
      return;
    }

    try {
      // Prepare changes object, excluding image fields, milestones, and status
      const changesToSubmit = {};
      Object.keys(editForm).forEach(key => {
        let originalValue = project[key];
        if (originalValue && originalValue.seconds) {
          originalValue = safeConvertToISOString(originalValue);
        }
        // Exclude status, imageUrl, secondaryImages, and milestones from the change request
        if (key !== 'status' && key !== 'createdAt' && key !== 'imageUrl' && key !== 'secondaryImages' && key !== 'milestones' && key !== 'id') {
          if (JSON.stringify(editForm[key]) !== JSON.stringify(originalValue)) {
            changesToSubmit[key] = editForm[key];
          }
        }
      });

      // Check if any changes were made
      const hasChanges = Object.keys(changesToSubmit).length > 0;

      if (!hasChanges) {
        toast.info('No changes detected');
        setIsEditing(false);
        return;
      }

      // Create change request document
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

      // Update local state (optimistic update)
      setProject(prev => ({ 
        ...prev, 
        ...changesToSubmit,
        endDate: editForm.endDate ? new Date(editForm.endDate) : null,
        hasPendingChanges: true
      }));

      setIsEditing(false);
      toast.success('Change request submitted successfully!');
      
      // Create notification
      try {
        await addDoc(collection(db, "notifications"), {
          message: `Your request for changes on "${project.title}" is being reviewed`,
          type: "ChangeReq",
          read: false,
          userId: user.uid,
          createdAt: Timestamp.now()
        });
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);
      }

    } catch (error) {
      console.error('Error submitting change request:', error);
      toast.error('Failed to submit change request. Please try again.');
    }
  };

  // Utility functions
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
      if (timestamp.seconds !== undefined) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        date = timestamp;
      }
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

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
              <FiAlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              variant="primary"
              icon={FiArrowLeft}
              onClick={() => navigate('/projects')}
            >
              Back to My Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progress = getProgressPercentage();
  const daysLeft = project.endDate ? Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Modern Hero Header */}
      <div className="relative pt-20 pb-8 overflow-hidden bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center space-x-2 text-gray-700 hover:text-color-b transition-all group mb-6 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl"
          >
            <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Projects</span>
          </button>
          
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 ${getStatusColor(project.status)}`}>
                    {project.status || 'Unknown'}
                  </span>
                  <span className="flex items-center text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full text-sm">
                    <FiTag className="w-4 h-4 mr-1.5" />
                    {project.category || 'General'}
                  </span>
                  {project.hasPendingChanges && (
                    <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center">
                      <FiClock className="w-3 h-3 mr-1" />
                      Pending Changes
                    </span>
                  )}
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-color-b via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                  {project.title}
                </h1>
                
                <p className="text-gray-600 text-lg mb-6 line-clamp-2">
                  {project.shortDescription}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                    <FiCalendar className="w-4 h-4 mr-2 text-color-b" />
                    <span>Ends {formatDate(project.endDate)}</span>
                  </div>
                  <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                    <FiUsers className="w-4 h-4 mr-2 text-color-b" />
                    <span>{funders.length} Backers</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                {isEditing ? (
                  <>
                    <Button
                      variant="primary"
                      icon={FiCheckCircle}
                      onClick={handleEditSave}
                      loading={checkingPending}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="ghost"
                      icon={FiX}
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      icon={FiEdit}
                      onClick={checkPendingAndEnableEditing}
                      loading={checkingPending}
                      disabled={checkingPending}
                    >
                      {checkingPending ? 'Checking...' : 'Edit Project'}
                    </Button>
                    <Link to={`/projectDet/${project.id}`}>
                      <Button
                        variant="secondary"
                        icon={FiEye}
                        fullWidth
                      >
                        View Public Page
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 -mt-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={FiTrendingUp}
            label="Funding Progress"
            value={`${progress.toFixed(1)}%`}
            color="blue"
            trend={{
              value: `${formatCurrency(project.fundedMoney)} raised`,
              positive: progress > 0
            }}
          />
          
          <StatCard
            icon={FiDollarSign}
            label="Funding Goal"
            value={formatCurrency(project.fundingGoal)}
            color="green"
          />
          
          <StatCard
            icon={FiUsers}
            label="Total Backers"
            value={funders.length}
            color="purple"
            trend={{
              value: `${project.backers || 0} contributions`,
              positive: true
            }}
          />
          
          <StatCard
            icon={FiClock}
            label="Days Remaining"
            value={daysLeft > 0 ? daysLeft : 'Ended'}
            color="orange"
            trend={{
              value: daysLeft > 0 ? 'Campaign active' : 'Campaign ended',
              positive: daysLeft > 0
            }}
          />
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-2">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: FiEye },
              { id: 'images', label: 'Images', icon: FiImage },
              { id: 'funders', label: 'Backers', icon: FiUsers, badge: funders.length },
              { id: 'announcements', label: 'Updates', icon: FiActivity },
              { id: 'analytics', label: 'Analytics', icon: FiBarChart2 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-color-b to-blue-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {isEditing ? (
              <ProjectEditForm
                project={project}
                editForm={editForm}
                onFormChange={handleEditChange}
                onSave={handleEditSave}
                onCancel={() => setIsEditing(false)}
                loading={checkingPending}
              />
            ) : (
              <>
                {/* Project Image */}
                <ProjectCard>
                  <div className="relative h-96 rounded-2xl overflow-hidden">
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <FiImage className="w-24 h-24 text-gray-400" />
                      </div>
                    )}
                  </div>
                </ProjectCard>

                {/* Description */}
                <ProjectCard title="Project Description" icon={FiEye}>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {project.longDescription || 'No detailed description available.'}
                    </p>
                  </div>
                </ProjectCard>

                {/* Milestones */}
                {project.milestones && (
                  <ProjectCard title="Project Milestones" icon={FiTarget}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[25, 50, 75, 100].map((percentage) => (
                        project.milestones[percentage]?.description && (
                          <div
                            key={percentage}
                            className={`p-4 rounded-xl border-2 ${
                              progress >= percentage
                                ? 'bg-green-50 border-green-300'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-lg text-gray-900">{percentage}%</span>
                              {progress >= percentage && (
                                <FiCheckCircle className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                            <p className="text-gray-700 text-sm">
                              {project.milestones[percentage].description}
                            </p>
                          </div>
                        )
                      ))}
                    </div>
                  </ProjectCard>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'images' && (
          <div className="space-y-6">
            <ProjectCard title="Project Images" icon={FiImage}>
              {/* Main Image Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiImage className="w-5 h-5 text-color-b" />
                  Main Project Image
                </h3>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
                  <div className="relative h-64 rounded-xl overflow-hidden mb-4">
                    {previewMainImageUrl ? (
                      <img
                        src={previewMainImageUrl}
                        alt="Main Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <FiImage className="w-24 h-24 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <input
                      id="mainImageInput"
                      type="file"
                      accept="image/*"
                      onChange={handleMainImageChange}
                      className="hidden"
                    />
                    <Button
                      variant="secondary"
                      icon={FiPlus}
                      onClick={() => document.getElementById("mainImageInput").click()}
                    >
                      {previewMainImageUrl || project.imageUrl ? 'Change Image' : 'Upload Image'}
                    </Button>
                    {(previewMainImageUrl || mainImageFile) && (
                      <Button
                        variant="ghost"
                        icon={FiTrash2}
                        onClick={removeNewMainImage}
                      >
                        Remove Preview
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Secondary Images Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiImage className="w-5 h-5 text-color-b" />
                  Additional Images
                </h3>
                
                {/* Existing Images */}
                {editForm.secondaryImages && editForm.secondaryImages.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-3">Current Images</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {editForm.secondaryImages.map((imgUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imgUrl}
                            alt={`Secondary ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            onClick={() => removeExistingSecondaryImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images Preview */}
                {previewSecondaryImageUrls.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-3">New Images (Not Saved Yet)</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {previewSecondaryImageUrls.map((previewUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={previewUrl}
                            alt={`New ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-blue-300"
                          />
                          <button
                            onClick={() => removeNewSecondaryImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-dashed border-blue-300">
                  <input
                    id="secondaryImagesInput"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleSecondaryImageChange}
                    className="hidden"
                  />
                  <div className="text-center">
                    <FiPlus className="w-12 h-12 text-color-b mx-auto mb-3" />
                    <p className="text-gray-700 font-medium mb-2">Add More Images</p>
                    <p className="text-sm text-gray-500 mb-4">Upload multiple images to showcase your project</p>
                    <Button
                      variant="primary"
                      icon={FiPlus}
                      onClick={() => document.getElementById("secondaryImagesInput").click()}
                    >
                      Select Images
                    </Button>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              {(mainImageFile || newSecondaryImageFiles.length > 0 || 
                JSON.stringify(editForm.secondaryImages) !== JSON.stringify(project.secondaryImages)) && (
                <div className="mt-6 flex justify-end gap-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMainImageFile(null);
                      setPreviewMainImageUrl("");
                      setNewSecondaryImageFiles([]);
                      setPreviewSecondaryImageUrls([]);
                      setEditForm(prev => ({ ...prev, secondaryImages: [...project.secondaryImages || []] }));
                    }}
                  >
                    Cancel Changes
                  </Button>
                  <Button
                    variant="primary"
                    icon={FiCheckCircle}
                    onClick={handleImageSave}
                  >
                    Save Images
                  </Button>
                </div>
              )}
            </ProjectCard>
          </div>
        )}

        {activeTab === 'funders' && (
          <ProjectCard title="Project Backers" icon={FiUsers}>
            {funders.length === 0 ? (
              <div className="text-center py-16">
                <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-600 mb-2">No Backers Yet</h4>
                <p className="text-gray-500">Your project hasn't received any funding yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {funders.map((funder) => (
                  <div
                    key={funder.id}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={funder.profileImage}
                        alt={funder.name}
                        className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                      />
                      <div>
                        <h4 className="font-bold text-gray-900">{funder.name}</h4>
                        <p className="text-sm text-gray-500">{funder.location}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Contribution</span>
                        <span className="font-bold text-color-b">{formatCurrency(funder.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Contributions</span>
                        <span className="font-semibold text-gray-900">{funder.contributions.length}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ProjectCard>
        )}

        {activeTab === 'announcements' && (
          <AnnouncementManager
            announcements={getAnnouncementsArray()}
            onCreateAnnouncement={handleCreateAnnouncement}
            onEditAnnouncement={saveEditAnnouncement}
            onDeleteAnnouncement={deleteAnnouncement}
            loading={false}
          />
        )}

        {activeTab === 'analytics' && (
          <ProjectAnalytics project={project} funders={funders} />
        )}
      </div>
    </div>
  );
}
