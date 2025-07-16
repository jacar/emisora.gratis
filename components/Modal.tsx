
import React, { useEffect, useRef } from 'react';
import { XIcon } from './Icons.jsx';

const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] m-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-800"
            aria-label="Close modal"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Modal;