import { Flag } from 'lucide-react';

// Modern comment component with report functionality
function Comment({ pfpImage, username, comment, createdAt, userId, onReport, currentUserId }) {
  const canReport = currentUserId && userId && currentUserId !== userId;

  return (
    <div className="group relative">
      <div className="flex items-start gap-3">
        {/* Profile Image */}
        <img
          src={pfpImage}
          alt={username}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/40';
          }}
        />
        
        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-gray-900">{username}</p>
            <span className="text-xs text-gray-500">•</span>
            <p className="text-xs text-gray-500">{createdAt}</p>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed break-words">
            {comment}
          </p>
        </div>

        {/* Report Button */}
        {canReport && (
          <button
            onClick={() => onReport({ userId, username })}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 flex-shrink-0"
            title="Report user"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default Comment;
