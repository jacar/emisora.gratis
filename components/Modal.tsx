
import React, { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from './Icons.jsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
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

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] m-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col border-4 border-brand-500"
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
        <main className="flex-1 overflow-y-auto p-8 min-h-[200px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          {children}
        </main>
      </div>
    </div>,
    document.body
  );
};

export default Modal;