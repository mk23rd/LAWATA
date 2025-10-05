import React, { useState } from 'react';
import { FiBox, FiDollarSign, FiUsers, FiEdit, FiTrash2, FiPlus, FiX, FiCheckCircle, FiImage } from 'react-icons/fi';
import { Button } from './Button';
import { FormInput, FormTextarea, FormSelect } from './FormInput';

const RewardCard = ({ reward, onEdit, onDelete, isEditing }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-900 transition-all duration-200">
      <div className="flex flex-col sm:flex-row gap-4">
        {reward.imageUrl && (
          <div className="sm:w-1/4">
            <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
              <img src={reward.imageUrl} alt={reward.title} className="w-full h-full object-cover rounded-lg" />
            </div>
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 mb-2">{reward.title}</h3>
          <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
          <div className="flex items-center gap-3 text-sm text-gray-700 mb-3">
            <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-lg">
              <FiDollarSign className="w-4 h-4 mr-1.5 text-green-600" />
              <span className="font-medium">${reward.amount}</span>
            </div>
            <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-lg">
              {reward.type === 'limited' ? (
                <>
                  <FiUsers className="w-4 h-4 mr-1.5 text-purple-600" />
                  <span>{reward.quantity} available</span>
                </>
              ) : (
                <>
                  <FiBox className="w-4 h-4 mr-1.5 text-blue-600" />
                  <span>Unlimited</span>
                </>
              )}
            </div>
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <Button variant="secondary" icon={FiEdit} onClick={() => onEdit(reward)} size="sm">
                Edit
              </Button>
              <Button variant="ghost" icon={FiTrash2} onClick={() => onDelete(reward.id)} size="sm">
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RewardForm = ({ reward, onSave, onCancel, uploadImage }) => {
  const [formData, setFormData] = useState(reward || {
    title: '',
    description: '',
    amount: '',
    type: 'unlimited',
    quantity: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(reward?.imageUrl || '');
  const [uploading, setUploading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      if (previewUrl && !formData.imageUrl) URL.revokeObjectURL(previewUrl);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      setImageFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      let finalImageUrl = formData.imageUrl;
      
      // Upload new image if selected
      if (imageFile && uploadImage) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const rewardData = {
        ...formData,
        amount: parseFloat(formData.amount),
        quantity: formData.type === 'limited' ? parseInt(formData.quantity) : null,
        imageUrl: finalImageUrl,
        id: reward?.id || `reward-${Date.now()}`
      };

      onSave(rewardData);
    } catch (error) {
      console.error('Error saving reward:', error);
      alert('Failed to save reward. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {reward ? 'Edit Reward' : 'Add New Reward'}
        </h3>
        <button onClick={onCancel} className="p-2 text-gray-600 hover:text-gray-900">
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <FormInput
          label="Reward Title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Early Bird Special"
          required
        />

        <FormTextarea
          label="Description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe what backers will receive..."
          rows={4}
          required
        />

        <FormInput
          label="Pledge Amount ($)"
          type="number"
          value={formData.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          placeholder="0"
          required
        />

        <FormSelect
          label="Reward Type"
          value={formData.type}
          onChange={(e) => handleChange('type', e.target.value)}
          options={[
            { value: 'unlimited', label: 'Unlimited' },
            { value: 'limited', label: 'Limited Quantity' }
          ]}
        />

        {formData.type === 'limited' && (
          <FormInput
            label="Available Quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            placeholder="0"
            required
          />
        )}

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reward Image (Optional)
          </label>
          {previewUrl && (
            <div className="mb-3 relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={() => {
                  if (!formData.imageUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl('');
                  setImageFile(null);
                  setFormData(prev => ({ ...prev, imageUrl: '' }));
                }}
                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <input
            id="rewardImageInput"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <Button
            variant="secondary"
            icon={FiImage}
            onClick={() => document.getElementById('rewardImageInput').click()}
          >
            {previewUrl ? 'Change Image' : 'Upload Image'}
          </Button>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="primary"
            icon={FiCheckCircle}
            onClick={handleSubmit}
            loading={uploading}
            disabled={uploading}
            fullWidth
          >
            {uploading ? 'Saving...' : 'Save Reward'}
          </Button>
          <Button variant="ghost" onClick={onCancel} fullWidth>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export const RewardsManager = ({ rewards = [], onRewardsChange, isEditing, uploadImage }) => {
  const [editingReward, setEditingReward] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleAddReward = (rewardData) => {
    const updatedRewards = [...rewards, rewardData];
    onRewardsChange(updatedRewards);
    setIsAddingNew(false);
  };

  const handleEditReward = (rewardData) => {
    const updatedRewards = rewards.map(r => 
      r.id === rewardData.id ? rewardData : r
    );
    onRewardsChange(updatedRewards);
    setEditingReward(null);
  };

  const handleDeleteReward = (rewardId) => {
    if (!window.confirm('Are you sure you want to delete this reward?')) return;
    
    const updatedRewards = rewards.filter(r => r.id !== rewardId);
    onRewardsChange(updatedRewards);
  };

  if (isAddingNew) {
    return (
      <RewardForm
        onSave={handleAddReward}
        onCancel={() => setIsAddingNew(false)}
        uploadImage={uploadImage}
      />
    );
  }

  if (editingReward) {
    return (
      <RewardForm
        reward={editingReward}
        onSave={handleEditReward}
        onCancel={() => setEditingReward(null)}
        uploadImage={uploadImage}
      />
    );
  }

  return (
    <div className="space-y-6">
      {isEditing && (
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <FiBox className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {rewards.length} reward{rewards.length !== 1 ? 's' : ''}
            </span>
          </div>
          <Button
            variant="primary"
            icon={FiPlus}
            onClick={() => setIsAddingNew(true)}
          >
            Add Reward
          </Button>
        </div>
      )}

      {rewards.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <FiBox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-600 mb-2">No Rewards Available</h4>
          <p className="text-sm text-gray-500 mb-4">This project doesn't have any rewards defined yet.</p>
          {isEditing && (
            <Button
              variant="primary"
              icon={FiPlus}
              onClick={() => setIsAddingNew(true)}
            >
              Add Your First Reward
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {rewards.map(reward => (
            <RewardCard
              key={reward.id}
              reward={reward}
              onEdit={setEditingReward}
              onDelete={handleDeleteReward}
              isEditing={isEditing}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default RewardsManager;
