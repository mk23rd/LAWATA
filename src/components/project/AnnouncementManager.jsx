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
    <div className="space-y-4">
      {/* Create Button */}
      {!isCreating && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            icon={FiPlus}
            onClick={handleStartCreate}
          >
            New Update
          </Button>
        </div>
      )}
      {/* Create New Announcement Form */}
      {isCreating && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-base font-semibold text-gray-900 mb-4">
            Create New Update
          </h4>
            
          <div className="space-y-4">
            <FormInput
              label="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter update title"
              error={errors.title}
              required
              maxLength={100}
            />

            <FormTextarea
              label="Content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write your update..."
              error={errors.content}
              required
              rows={4}
              maxLength={1000}
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                icon={FiX}
                onClick={handleCancelCreate}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={FiPlus}
                onClick={handleCreate}
                loading={loading}
              >
                Create Update
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {announcements.length === 0 && !isCreating ? (
        <div className="text-center py-16">
          <FiBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-600 mb-2">No updates yet</h4>
          <p className="text-sm text-gray-500">Create your first update to keep your backers informed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-900 transition-all duration-200"
            >
              {editingId === announcement.id ? (
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
                      icon={FiX}
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      icon={FiSave}
                      onClick={() => handleSaveEdit(announcement.id)}
                      loading={loading}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-base font-semibold text-gray-900">
                      {announcement.title}
                    </h4>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleStartEdit(announcement)}
                        className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap leading-relaxed">
                    {announcement.content}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FiCalendar className="w-3 h-3" />
                    <span>{formatDate(announcement.date)}</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
