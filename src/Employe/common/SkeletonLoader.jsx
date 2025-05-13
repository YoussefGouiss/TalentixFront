import React from 'react';

const SkeletonLoader = ({ rows = 3, cols = 4 }) => {
  return (
    <div className="animate-pulse p-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex space-x-4 py-3 border-b border-gray-200">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded w-full"></div>
          ))}
          <div className="h-8 bg-gray-200 rounded w-24"></div> {/* Actions column */}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;