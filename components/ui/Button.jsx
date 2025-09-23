import React from 'react';

const Button = ({ children, onClick, className, disabled }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md transition-colors ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white' } ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;