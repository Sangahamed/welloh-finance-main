import React from 'react';
import { BookOpenIcon, XMarkIcon } from './icons/Icons';
import MarkdownRenderer from './MarkdownRenderer';

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  isLoading: boolean;
  error: string | null;
}

const EducationModal: React.FC<EducationModalProps> = ({ isOpen, onClose, title, content, isLoading, error }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
        className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 transition-opacity"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
    >
        <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 transform transition-all flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center" id="modal-title">
                    <BookOpenIcon className="h-6 w-6 mr-3 text-indigo-500 dark:text-indigo-400"/>
                    {title}
                </h2>
                <button
                    onClick={onClose}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    aria-label="Fermer"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>

            <div className="flex-grow overflow-y-auto pr-4 -mr-4">
                {isLoading && (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mt-4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                )}
                {error && <p className="text-red-500">Erreur: {error}</p>}
                {!isLoading && !error && <MarkdownRenderer content={content} />}
            </div>

             <div className="mt-6 text-right flex-shrink-0">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                >
                    Fermer
                </button>
            </div>
        </div>
    </div>
  );
};

export default EducationModal;
