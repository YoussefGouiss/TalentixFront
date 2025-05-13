import React from 'react';
import { Check, X } from 'lucide-react';

const Notification = ({ show, message, type }) => {
  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out ${
        show
        ? 'translate-y-0 opacity-100'
        : '-translate-y-12 opacity-0 pointer-events-none'
      } ${
        type === 'success'
        ? 'bg-green-100 text-green-800 border-l-4 border-green-500'
        : 'bg-red-100 text-red-800 border-l-4 border-red-500'
      }`}
    >
      <div className="flex items-center">
        {type === 'success' ? (
          <Check className="h-5 w-5 mr-2" />
        ) : (
          <X className="h-5 w-5 mr-2" />
        )}
        {message}
      </div>
    </div>
  );
};

export default Notification;