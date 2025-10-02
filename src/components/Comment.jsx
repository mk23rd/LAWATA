// Presentational component for rendering a single community comment entry
function Comment({ pfpImage, username, comment, createdAt }) {
  return (
    // Outer wrapper for spacing and alignment
    <div className="flex items-start gap-3 p-4 max-w-md">
      <img
        src={pfpImage}
        alt="profile"
        // Avatar styling keeps images uniform and contained
        className="w-10 h-10 rounded-full object-cover border border-gray-300"
      />
      <div className="flex flex-col">
        {/* Author name */}
        <p className="font-semibold text-gray-800">{username} </p>
        {/* Publish timestamp */}
        <p className="font-semibold text-gray-400"> {createdAt}</p>
        {/* Comment content bubble */}
        <p className="text-gray-600 bg-white p-2 rounded-xl shadow-sm mt-1">
          {comment}
        </p>
      </div>
    </div>
  );
}

export default Comment;
