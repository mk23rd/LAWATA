/**
 * Validation utilities for form inputs
 */

export const validators = {
  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  minLength: (value, min, fieldName = 'This field') => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value, max, fieldName = 'This field') => {
    if (value && value.length > max) {
      return `${fieldName} must not exceed ${max} characters`;
    }
    return null;
  },

  min: (value, min, fieldName = 'This field') => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  },

  max: (value, max, fieldName = 'This field') => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > max) {
      return `${fieldName} must not exceed ${max}`;
    }
    return null;
  },

  number: (value, fieldName = 'This field') => {
    if (value && isNaN(parseFloat(value))) {
      return `${fieldName} must be a valid number`;
    }
    return null;
  },

  positiveNumber: (value, fieldName = 'This field') => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue <= 0) {
      return `${fieldName} must be a positive number`;
    }
    return null;
  },

  date: (value, fieldName = 'This field') => {
    if (value && isNaN(Date.parse(value))) {
      return `${fieldName} must be a valid date`;
    }
    return null;
  },

  futureDate: (value, fieldName = 'This field') => {
    if (value) {
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (inputDate < today) {
        return `${fieldName} must be in the future`;
      }
    }
    return null;
  },

  url: (value, fieldName = 'This field') => {
    if (value) {
      try {
        new URL(value);
      } catch {
        return `${fieldName} must be a valid URL`;
      }
    }
    return null;
  },

  email: (value, fieldName = 'This field') => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `${fieldName} must be a valid email address`;
    }
    return null;
  }
};

/**
 * Validate project edit form
 */
export const validateProjectEdit = (formData, currentProject) => {
  const errors = {};

  // Title validation
  const titleError = validators.required(formData.title, 'Title') ||
                     validators.minLength(formData.title, 5, 'Title') ||
                     validators.maxLength(formData.title, 100, 'Title');
  if (titleError) errors.title = titleError;

  // Short description validation
  const shortDescError = validators.required(formData.shortDescription, 'Short description') ||
                         validators.minLength(formData.shortDescription, 20, 'Short description') ||
                         validators.maxLength(formData.shortDescription, 200, 'Short description');
  if (shortDescError) errors.shortDescription = shortDescError;

  // Long description validation
  const longDescError = validators.required(formData.longDescription, 'Long description') ||
                        validators.minLength(formData.longDescription, 100, 'Long description') ||
                        validators.maxLength(formData.longDescription, 5000, 'Long description');
  if (longDescError) errors.longDescription = longDescError;

  // Funding goal validation
  const fundingGoalError = validators.required(formData.fundingGoal, 'Funding goal') ||
                           validators.number(formData.fundingGoal, 'Funding goal') ||
                           validators.positiveNumber(formData.fundingGoal, 'Funding goal') ||
                           validators.min(formData.fundingGoal, 100, 'Funding goal');
  if (fundingGoalError) errors.fundingGoal = fundingGoalError;

  // Check if funding goal is less than already funded
  if (formData.fundingGoal && currentProject?.fundedMoney) {
    if (parseFloat(formData.fundingGoal) < currentProject.fundedMoney) {
      errors.fundingGoal = `Funding goal cannot be less than already funded amount ($${currentProject.fundedMoney.toLocaleString()})`;
    }
  }

  // Category validation
  const categoryError = validators.required(formData.category, 'Category');
  if (categoryError) errors.category = categoryError;

  // End date validation
  const endDateError = validators.required(formData.endDate, 'End date') ||
                       validators.date(formData.endDate, 'End date') ||
                       validators.futureDate(formData.endDate, 'End date');
  if (endDateError) errors.endDate = endDateError;

  // Milestone validation
  if (formData.milestones) {
    const milestoneErrors = {};
    Object.entries(formData.milestones).forEach(([percentage, milestone]) => {
      if (milestone.description && milestone.description.trim()) {
        const error = validators.minLength(milestone.description, 10, `${percentage}% milestone`) ||
                     validators.maxLength(milestone.description, 200, `${percentage}% milestone`);
        if (error) {
          milestoneErrors[percentage] = error;
        }
      }
    });
    if (Object.keys(milestoneErrors).length > 0) {
      errors.milestones = milestoneErrors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate announcement form
 */
export const validateAnnouncement = (title, content) => {
  const errors = {};

  const titleError = validators.required(title, 'Title') ||
                     validators.minLength(title, 5, 'Title') ||
                     validators.maxLength(title, 100, 'Title');
  if (titleError) errors.title = titleError;

  const contentError = validators.required(content, 'Content') ||
                       validators.minLength(content, 20, 'Content') ||
                       validators.maxLength(content, 1000, 'Content');
  if (contentError) errors.content = contentError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
