import React from 'react';

export default function EmptyState({ 
  title = "No Data Found", 
  message = "There is currently no data to display in this section.", 
  actionLabel, 
  onAction 
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-xl border border-gray-200 shadow-sm my-4">
      {/* Visual Icon / Placeholder */}
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-inner">
        <span className="text-2xl" role="img" aria-label="empty font">
          📭
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-gray-800 mb-1">
        {title}
      </h3>

      {/* Explanation Message */}
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        {message}
      </p>

      {/* Optional Action Button (e.g., "Add New Item" or "Reset Filters") */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}