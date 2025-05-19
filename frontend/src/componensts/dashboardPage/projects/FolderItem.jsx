import React from 'react';
import FileItem from './FileItem';

export default function FolderItem({ folder, onToggle, onFileClick }) {
  return (
    <div className="mb-1">
      <button
        className="flex w-full items-center px-3 py-1 rounded hover:bg-[#27004A]"
        onClick={() => onToggle(folder.id)}
      >
        <span className="flex-1 text-left flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          {folder.title}
        </span>
        <span
          className={`text-sm transform transition-transform duration-200 ${
            folder.expanded ? 'rotate-90' : ''
          }`}
        >
          {'>'}
        </span>
      </button>
      
      {folder.expanded && (
        <div className="ml-4 mt-1">
          {folder.items.length === 0 ? (
            <div className="text-xs text-gray-300 px-3 py-1">Empty folder</div>
          ) : (
            folder.items.map(file => (
              <FileItem 
                key={file.id} 
                file={file} 
                onClick={onFileClick} 
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}