import React from 'react';
import { FiBox, FiDollarSign, FiUsers } from 'react-icons/fi';

const RewardCard = ({ reward }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col lg:flex-row gap-6">
      {reward.imageUrl && (
        <div className="lg:w-1/3">
          <img src={reward.imageUrl} alt={reward.title} className="w-full h-48 object-cover rounded-lg" />
        </div>
      )}
      <div className="flex-1">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{reward.title}</h3>
        <p className="text-gray-600 mb-4">{reward.description}</p>
        <div className="flex items-center gap-4 text-sm text-gray-700">
          <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-full">
            <FiDollarSign className="w-4 h-4 mr-1.5 text-green-600" />
            <span>{reward.amount}</span>
          </div>
          <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-full">
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
      </div>
    </div>
  );
};

const RewardsList = ({ rewards }) => {
  if (!rewards || rewards.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Rewards Available</h3>
        <p className="text-gray-600">This project does not have any rewards defined yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rewards.map(reward => (
        <RewardCard key={reward.id} reward={reward} />
      ))}
    </div>
  );
};

export default RewardsList;
