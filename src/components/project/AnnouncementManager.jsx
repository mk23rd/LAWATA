import React, { useState } from 'react';
import { FiBell, FiEdit, FiTrash2, FiSave, FiX, FiPlus, FiMessageSquare, FiCalendar } from 'react-icons/fi';
import { Button, IconButton } from './Button';
import { FormInput, FormTextarea } from './FormInput';
import { validateAnnouncement } from '../../utils/validation';

/**
 * Modern Announcement Manager Component
 * Handles creating, editing, and deleting project announcements
 */
export const AnnouncementManager = ({ 
  announcements = [], 
  onCreateAnnouncement,
  onEditAnnouncement,
  onDeleteAnnouncement,
  loading = false
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [errors, setErrors] = useState({});

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewTitle('');
    setNewContent('');
    setErrors({});
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewTitle('');
    setNewContent('');
    setErrors({});
  };

  const handleCreate = async () => {
    const validation = validateAnnouncement(newTitle, newContent);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    await onCreateAnnouncement(newTitle, newContent);
    handleCancelCreate();
  };

  const handleStartEdit = (announcement) => {
    setEditingId(announcement.id);
    setEditTitle(announcement.title || '');
    setEditContent(announcement.content || '');
    setErrors({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
    setErrors({});
  };

  const handleSaveEdit = async (announcementId) => {
    const validation = validateAnnouncement(editTitle, editContent);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    await onEditAnnouncement(announcementId, editTitle, editContent);
    handleCancelEdit();
  };

  const handleDelete = async (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      await onDeleteAnnouncement(announcementId);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/40 overflow-hidden">
      <div className="bg-gradient-to-r from-color-b to-blue-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <FiBell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Project Updates</h3>
              <p className="text-blue-100 text-sm">Keep your backers informed</p>
            </div>
          </div>
          {!isCreating && (
            <Button
              variant="secondary"
              size="sm"
              icon={FiPlus}
              onClick={handleStartCreate}
            >
              New Update
            </Button>
          )}
        </div>
      </div>
      
      <div className="p-6">
      <div className="space-y-4">
        {/* Create New Announcement Form */}
        {isCreating && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-6 space-y-4 shadow-lg">
            <h4 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
              <div className="p-2 bg-color-b/10 rounded-lg">
                <FiMessageSquare className="w-5 h-5 text-color-b" />
              </div>
              Create New Update
            </h4>
            
            <FormInput
              label="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter announcement title"
              error={errors.title}
              required
              maxLength={100}
            />

            <FormTextarea
              label="Content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write your announcement content..."
              error={errors.content}
              required
              rows={4}
              maxLength={1000}
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                icon={FiX}
                onClick={handleCancelCreate}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={FiSave}
                onClick={handleCreate}
                loading={loading}
              >
                Create Announcement
              </Button>
            </div>
          </div>
        )}

        {/* Announcements List */}
        {announcements.length === 0 && !isCreating ? (
          <div className="text-center py-16 text-gray-500">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiBell className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-xl font-semibold text-gray-700 mb-2">No updates yet</p>
            <p className="text-sm text-gray-500">Create your first update to keep your backers informed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-color-b/30 transition-all duration-300"
              >
                {editingId === announcement.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <FormInput
                      label="Title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      error={errors.title}
                      required
                    />
                    <FormTextarea
                      label="Content"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      error={errors.content}
                      required
                      rows={4}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={FiX}
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={FiSave}
                        onClick={() => handleSaveEdit(announcement.id)}
                        loading={loading}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-800 text-lg">
                        {announcement.title}
                      </h4>
                      <div className="flex gap-1">
                        <IconButton
                          icon={FiEdit}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(announcement)}
                          ariaLabel="Edit announcement"
                        />
                        <IconButton
                          icon={FiTrash2}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(announcement.id)}
                          ariaLabel="Delete announcement"
                        />
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FiBell className="w-3 h-3" />
                      <span>{formatDate(announcement.date)}</span>
                      {announcement.createdBy?.email && (
                        <span className="ml-2">by {announcement.createdBy.email}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
