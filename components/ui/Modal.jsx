import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <div>{children}</div>
        <div className="flex justify-end pt-2">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;