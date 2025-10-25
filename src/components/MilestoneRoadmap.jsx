import React, { useState } from 'react';
import { Check } from 'lucide-react';

const MilestoneRoadmap = ({ milestones = {}, fundedPercentage = 45 }) => {
  const [hoveredMilestone, setHoveredMilestone] = useState(null);

  // Define fixed milestone percentages
  const fixedPercentages = [0, 25, 50, 75, 100];

  // Create milestone array with fixed percentages, merging with actual milestone data
  const milestonesArray = fixedPercentages.map(percentage => {
    const milestoneData = milestones?.[percentage] || {};
    return {
      percentage,
      description: milestoneData.description || `${percentage}% funding milestone`,
      completed: milestoneData.completed || false,
      status: milestoneData.status,
      completedAt: milestoneData.completedAt
    };
  });

  // Function to get point on SVG path at a specific percentage of path length
  const getPointOnPath = (percentageAlongPath) => {
    // Create an SVG path element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    path.setAttribute('d', 'M 50 100 Q 200 50, 300 120 T 550 80 T 750 100');
    path.setAttribute('pathLength', '100');
    
    svg.appendChild(path);
    
    // Get the total length of the path
    const totalLength = path.getTotalLength();
    
    // Calculate the distance along the path
    const distance = (percentageAlongPath / 100) * totalLength;
    
    // Get the point at that distance
    const point = path.getPointAtLength(distance);
    
    return point;
  };

  // Calculate positions for each milestone
  const positions = fixedPercentages.map(percentage => {
    const point = getPointOnPath(percentage);
    return {
      percentage,
      x: point.x,
      y: point.y
    };
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-6">Project Milestones</h2>

      <div className="relative w-full" style={{ aspectRatio: '800/200' }}>
        {/* SVG Path */}
        <svg 
          className="w-full h-full" 
          viewBox="0 0 800 200" 
          preserveAspectRatio="none" 
          style={{ position: 'absolute', inset: 0 }}
        >
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
          {milestonesArray.map((milestone) => {
            const pos = positions.find(p => p.percentage === milestone.percentage);
            
            if (!pos) return null;

            const svgRect = { width: 800, height: 200 };
            
            // Convert SVG coordinates to percentage positions
            const leftPercent = (pos.x / svgRect.width) * 100;
            const topPercent = (pos.y / svgRect.height) * 100;

            const isCompleted = milestone.completed || milestone.status === 'completed';
            const isReached = fundedPercentage >= milestone.percentage;

            return (
              <div
                key={milestone.percentage}
                className="absolute"
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onMouseEnter={() => setHoveredMilestone(milestone.percentage)}
                onMouseLeave={() => setHoveredMilestone(null)}
              >
                {/* Milestone dot */}
                <div className="relative">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-md ${
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