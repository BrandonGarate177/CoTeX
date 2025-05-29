import React, { useState } from 'react';
import { FiFolder, FiFile, FiChevronRight, FiPlus } from 'react-icons/fi';
import FolderItem from './FolderItem';

export default function ProjectItem({ 
  project, 
  onToggleProject, 
  onFileClick, 
  onToggleFolder,
  onAddFile,
  onAddFolder
}) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <div className="flex flex-col">
      {/* Project header */}
      <div 
        className="flex items-center pl-4 pr-2 py-1.5 hover:bg-[#37155F]/70 cursor-pointer relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          className="flex-1 flex items-center outline-none"
          onClick={() => onToggleProject(project.id)}
        >
          <FiChevronRight
            className={`transform transition-transform duration-200 mr-1 ${
              project.expanded ? 'rotate-90' : ''
            }`}
            size={14}
          />
          <FiFolder className="mr-2 text-yellow-300" size={16} />
          <span className="text-sm">{project.title}</span>
        </button>
        
        {/* VS Code-style action buttons - always rendered but with opacity transition */}
        <div className={`flex items-center space-x-0.5 absolute right-2 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddFile(project.id);
            }}
            className="p-1 rounded hover:bg-purple-800/70 transition-colors"
            title="New File"
          >
            <FiFile size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddFolder(project.id);
            }}
            className="p-1 rounded hover:bg-purple-800/70 transition-colors"
            title="New Folder"
          >
            <FiFolder size={14} />
          </button>
        </div>
      </div>
      
      {/* Files and folders list */}
      {project.expanded && (
        <div className="ml-4">
          {project.items.map(item => {
            if (item.type === 'folder') {
              return (
                <div key={item.id} className="flex flex-col">
                  <div 
                    className="flex items-center pl-4 pr-2 py-1.5 hover:bg-[#37155F]/70 cursor-pointer"
                    onClick={() => onToggleFolder(item.id)}
                  >
                    <FiChevronRight
                      className={`transform transition-transform duration-200 mr-1 ${
                        item.expanded ? 'rotate-90' : ''
                      }`}
                      size={14}
                    />
                    <FiFolder className="mr-2 text-yellow-300" size={16} />
                    <span className="text-sm">{item.title}</span>
                  </div>
                  
                  {item.expanded && item.items && (
                    <div className="ml-4">
                      {item.items.map(file => (
                        <div 
                          key={file.id}
                          className="flex items-center pl-6 pr-2 py-1.5 hover:bg-[#37155F]/70 cursor-pointer"
                          onClick={() => onFileClick(file.id)}
                        >
                          <FiFile className="mr-2 text-gray-300" size={16} />
                          <span className="text-sm">{file.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            } else {
              // File item
              return (
                <div 
                  key={item.id}
                  className="flex items-center pl-6 pr-2 py-1.5 hover:bg-[#37155F]/70 cursor-pointer"
                  onClick={() => onFileClick(item.id)}
                >
                  <FiFile className="mr-2 text-gray-300" size={16} />
                  <span className="text-sm">{item.title}</span>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}