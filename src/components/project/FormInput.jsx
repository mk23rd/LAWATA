import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

/**
 * Enhanced form input with validation support
 */
export const FormInput = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  error, 
  placeholder,
  required = false,
  disabled = false,
  icon: Icon,
  helperText,
  min,
  max,
  step,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          step={step}
          className={`
            w-full px-4 py-3 rounded-lg border transition-all duration-200
            ${Icon ? 'pl-11' : ''}
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
              : 'border-gray-300 focus:border-color-b focus:ring-2 focus:ring-blue-100'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            focus:outline-none
          `}
        />
        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
            <FiAlertCircle className="w-5 h-5" />
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <FiAlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

/**
 * Enhanced textarea with validation
 */
export const FormTextarea = ({ 
  label, 
  value, 
  onChange, 
  error, 
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
  maxLength,
  helperText,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {maxLength && (
            <span className="text-xs text-gray-500">
              {value?.length || 0}/{maxLength}
            </span>
          )}
        </div>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        className={`
          w-full px-4 py-3 rounded-lg border transition-all duration-200 resize-none
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
            : 'border-gray-300 focus:border-color-b focus:ring-2 focus:ring-blue-100'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          focus:outline-none
        `}
      />
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <FiAlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

/**
 * Select dropdown with validation
 */
export const FormSelect = ({ 
  label, 
  value, 
  onChange, 
  options = [],
  error, 
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  icon: Icon,
  helperText,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`
            w-full px-4 py-3 rounded-lg border transition-all duration-200 appearance-none
            ${Icon ? 'pl-11' : ''}
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
              : 'border-gray-300 focus:border-color-b focus:ring-2 focus:ring-blue-100'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            focus:outline-none
          `}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <FiAlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
