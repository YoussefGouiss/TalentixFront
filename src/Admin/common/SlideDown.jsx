import React from 'react';

const SlideDown = ({ isVisible, children }) => {
  return (
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isVisible ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      {children}
    </div>
  );
};

export default SlideDown