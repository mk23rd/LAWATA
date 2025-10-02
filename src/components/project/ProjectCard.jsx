import React from 'react';

/**
 * Reusable Card component for project sections
 */
export const ProjectCard = ({ children, className = '', title, icon: Icon, action }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          {title && (
            <div className="flex items-center gap-3">
              {Icon && <Icon className="w-5 h-5 text-gray-600" />}
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

/**
 * Stat card for displaying metrics
 */
export const StatCard = ({ icon: Icon, label, value, color = 'blue', trend }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
