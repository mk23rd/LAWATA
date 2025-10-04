import React, { useState } from 'react';
import { Check } from 'lucide-react';

const MilestoneRoadmap = ({ milestones, fundedPercentage }) => {
  const [hoveredMilestone, setHoveredMilestone] = useState(null);

  // Convert milestones map to sorted array
  const milestonesArray = milestones 
    ? Object.entries(milestones).map(([key, value]) => ({
        percentage: parseInt(key),
        ...value
      })).sort((a, b) => a.percentage - b.percentage)
    : [];

  if (milestonesArray.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-6">Project Milestones</h2>
      
      <div className="relative">
        {/* SVG Path */}
        <svg className="w-full" height="200" viewBox="0 0 800 200" preserveAspectRatio="none">
          {/* Background path (gray) */}
          <path
            d="M 50 100 Q 200 50, 300 120 T 550 80 T 750 100"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="4"
            strokeLinecap="round"
            pathLength="100"
          />
          
          {/* Progress path (green) - fills based on funding percentage */}
          <path
            d="M 50 100 Q 200 50, 300 120 T 550 80 T 750 100"
            fill="none"
            stroke="#10B981"
            strokeWidth="4"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - Math.min(Math.max(fundedPercentage, 0), 100)}
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>

        {/* Milestone dots */}
        <div className="absolute inset-0">
          {milestonesArray.map((milestone, index) => {
            const positions = [
              { left: '6%', top: '50%' },    // 25%
              { left: '37%', top: '60%' },   // 50%
              { left: '68%', top: '40%' },   // 75%
              { left: '93%', top: '50%' }    // 100%
            ];
            
            const position = positions[index] || positions[0];
            const isCompleted = milestone.completed || milestone.status === 'completed';
            const isReached = fundedPercentage >= milestone.percentage;

            return (
              <div
                key={milestone.percentage}
                className="absolute"
                style={{
                  left: position.left,
                  top: position.top,
                  transform: 'translate(-50%, -50%)'
                }}
                onMouseEnter={() => setHoveredMilestone(milestone.percentage)}
                onMouseLeave={() => setHoveredMilestone(null)}
              >
                {/* Milestone dot */}
                <div className="relative">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                      isReached
                        ? 'bg-green-600'
                        : 'bg-gray-900'
                    }`}
                  >
                    {isCompleted && (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>

                  {/* Percentage label */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">{milestone.percentage}%</span>
                  </div>

                  {/* Hover tooltip */}
                  {hoveredMilestone === milestone.percentage && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10 w-48">
                      <div className="bg-gray-900 text-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs font-medium mb-1">
                          Milestone {milestone.percentage}%
                        </div>
                        <div className="text-xs text-gray-300">
                          {milestone.description || 'No description'}
                        </div>
                        {milestone.completedAt && (
                          <div className="text-xs text-green-300 mt-2">
                            ✓ Completed
                          </div>
                        )}
                        {/* Arrow */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Reached</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-900"></div>
          <span>Upcoming</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-green-500"></div>
          <span>Progress ({Math.min(Math.round(fundedPercentage), 100)}%)</span>
        </div>
      </div>
    </div>
  );
};

export default MilestoneRoadmap;
