import React, { useState, useEffect } from 'react';
import { FiSave, FiX, FiDollarSign, FiTag, FiCalendar, FiAlignLeft, FiTarget } from 'react-icons/fi';
import { Button } from './Button';
import { FormInput, FormTextarea, FormSelect } from './FormInput';
import { ProjectCard } from './ProjectCard';
import { validateProjectEdit } from '../../utils/validation';
import { toast } from 'react-toastify';

const CATEGORIES = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Arts', label: 'Arts' },
  { value: 'Music', label: 'Music' },
  { value: 'Film', label: 'Film & Video' },
  { value: 'Games', label: 'Games' },
  { value: 'Food', label: 'Food' },
  { value: 'Fashion', label: 'Fashion' },
  { value: 'Publishing', label: 'Publishing' },
  { value: 'Design', label: 'Design' },
  { value: 'Crafts', label: 'Crafts' },
  { value: 'Education', label: 'Education' },
  { value: 'Health', label: 'Health' },
  { value: 'Environment', label: 'Environment' },
  { value: 'Community', label: 'Community' },
  { value: 'Other', label: 'Other' }
];

/**
 * Project Edit Form Component with Validation
 */
export const ProjectEditForm = ({ 
  project, 
  editForm, 
  onFormChange, 
  onSave, 
  onCancel,
  loading = false 
}) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validate on form change
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const validation = validateProjectEdit(editForm, project);
      setErrors(validation.errors);
    }
  }, [editForm, project, touched]);

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleChange = (field, value) => {
    onFormChange(field, value);
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = () => {
    // Mark all fields as touched
    const allFields = ['title', 'shortDescription', 'longDescription', 'fundingGoal', 'category', 'endDate'];
    const allTouched = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
    setTouched(allTouched);

    // Validate
    const validation = validateProjectEdit(editForm, project);
    setErrors(validation.errors);

    if (!validation.isValid) {
      toast.error('Please fix all validation errors before saving');
      return;
    }

    onSave();
  };

  const handleMilestoneChange = (percentage, value) => {
    const updatedMilestones = {
      ...editForm.milestones,
      [percentage]: {
        ...editForm.milestones[percentage],
        description: value
      }
    };
    onFormChange('milestones', updatedMilestones);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <ProjectCard title="Basic Information" icon={FiAlignLeft}>
        <div className="space-y-4">
          <FormInput
            label="Project Title"
            value={editForm.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            onBlur={() => handleBlur('title')}
            error={touched.title && errors.title}
            placeholder="Enter your project title"
            required
            helperText="A clear, compelling title (5-100 characters)"
          />

          <FormTextarea
            label="Short Description"
            value={editForm.shortDescription || ''}
            onChange={(e) => handleChange('shortDescription', e.target.value)}
            onBlur={() => handleBlur('shortDescription')}
            error={touched.shortDescription && errors.shortDescription}
            placeholder="Brief overview of your project"
            required
            rows={3}
            maxLength={200}
            helperText="A concise summary that captures attention (20-200 characters)"
          />

          <FormTextarea
            label="Detailed Description"
            value={editForm.longDescription || ''}
            onChange={(e) => handleChange('longDescription', e.target.value)}
            onBlur={() => handleBlur('longDescription')}
            error={touched.longDescription && errors.longDescription}
            placeholder="Provide detailed information about your project"
            required
            rows={8}
            maxLength={5000}
            helperText="Comprehensive project details (100-5000 characters)"
          />

          <FormSelect
            label="Category"
            value={editForm.category || ''}
            onChange={(e) => handleChange('category', e.target.value)}
            onBlur={() => handleBlur('category')}
            error={touched.category && errors.category}
            options={CATEGORIES}
            icon={FiTag}
            required
            helperText="Choose the category that best fits your project"
          />
        </div>
      </ProjectCard>

      {/* Funding & Timeline */}
      <ProjectCard title="Funding & Timeline" icon={FiDollarSign}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Funding Goal"
            type="number"
            value={editForm.fundingGoal || ''}
            onChange={(e) => handleChange('fundingGoal', e.target.value)}
            onBlur={() => handleBlur('fundingGoal')}
            error={touched.fundingGoal && errors.fundingGoal}
            placeholder="0"
            icon={FiDollarSign}
            required
            min={100}
            step={100}
            helperText={`Minimum: $100${project?.fundedMoney ? ` | Already funded: $${project.fundedMoney.toLocaleString()}` : ''}`}
          />

          <FormInput
            label="Campaign End Date"
            type="date"
            value={editForm.endDate || ''}
            onChange={(e) => handleChange('endDate', e.target.value)}
            onBlur={() => handleBlur('endDate')}
            error={touched.endDate && errors.endDate}
            icon={FiCalendar}
            required
            min={new Date().toISOString().split('T')[0]}
            helperText="Must be a future date"
          />
        </div>
      </ProjectCard>

      {/* Milestones */}
      <ProjectCard title="Project Milestones" icon={FiTarget}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Define key milestones for your project. These help backers understand your progress plan.
          </p>
          
          {[25, 50, 75, 100].map((percentage) => (
            <div key={percentage} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {percentage}% Milestone
              </label>
              <FormTextarea
                value={editForm.milestones?.[percentage]?.description || ''}
                onChange={(e) => handleMilestoneChange(percentage, e.target.value)}
                placeholder={`What will you achieve at ${percentage}% funding?`}
                rows={2}
                maxLength={200}
                error={errors.milestones?.[percentage]}
                helperText={`Optional: Describe what happens when you reach ${percentage}% of your goal`}
              />
            </div>
          ))}
        </div>
      </ProjectCard>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <Button
          variant="ghost"
          icon={FiX}
          onClick={onCancel}
          disabled={loading}
        >
          Cancel Changes
        </Button>
        <Button
          variant="primary"
          icon={FiSave}
          onClick={handleSubmit}
          loading={loading}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};
