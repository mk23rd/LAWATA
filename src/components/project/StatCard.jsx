import React from 'react';

/**
 * StatCard Component
 * Displays a metric with icon, label, value, and optional trend
 */
export const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color = 'blue',
  trend = null 
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconText: 'text-green-600',
      border: 'border-green-200'
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconText: 'text-purple-600',
      border: 'border-purple-200'
    },
    orange: {
      bg: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      iconText: 'text-orange-600',
      border: 'border-orange-200'
    },
    red: {
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
      border: 'border-red-200'
    },
    indigo: {
      bg: 'bg-indigo-50',
      iconBg: 'bg-indigo-100',
      iconText: 'text-indigo-600',
      border: 'border-indigo-200'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`${colors.bg} rounded-2xl p-6 border-2 ${colors.border} hover:shadow-lg transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${colors.iconBg} rounded-xl`}>
          {Icon && <Icon className={`w-6 h-6 ${colors.iconText}`} />}
        </div>
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
        
        {trend && (
          <div className="flex items-center gap-2">
            <span className={`text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? '↑' : '↓'}
            </span>
            <span className="text-sm text-gray-600">{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
};
