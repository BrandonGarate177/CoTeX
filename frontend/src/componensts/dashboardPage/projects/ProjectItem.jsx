import React from 'react';
import FolderItem from './FolderItem';

export default function ProjectItem({
  project,
  onToggleProject,
  onToggleFolder,
  onAddFile,
  onAddFolder,
  onFileClick
}) {
  return (
    <div className="mb-2">
      {/* Project Entry */}
      <div
        className="flex w-full items-center px-3 py-1 rounded hover:bg-[#27004A]"
        onClick={() => onToggleProject(project.id)}
      >
        <span className="flex-1 text-left">{project.title}
          {/* Add buttons for file and folder creation */}
          <div className="inline-flex ml-2">
            <button 
              className="px-1.5 text-xs bg-[#27004A] rounded-full hover:bg-purple-800 inline-flex items-center justify-center mr-1"
              title="Add new file"
              onClick={(e) => {
                e.stopPropagation();
                onAddFile(project.projectId);
              }}
            >
              <span>+F</span>
            </button>
            <button 
              className="px-1.5 text-xs bg-[#27004A] rounded-full hover:bg-purple-800 inline-flex items-center justify-center"
              title="Add new folder"
              onClick={(e) => {
                e.stopPropagation();
                onAddFolder(project.projectId);
              }}
            >
              <span>+D</span>
            </button>
          </div>
        </span>
        <span
          className={`text-xl transform transition-transform duration-200 ${
            project.expanded ? 'rotate-90' : ''
          }`}
        >
          {'>'}
        </span>
      </div>
      
      {/* Files and Folders for this Project */}
      {project.expanded && (
        <div className="ml-4 mt-1">
          {project.items.length === 0 ? (
            <div className="text-sm text-gray-300 px-3 py-1">No files or folders in this project</div>
          ) : (
            project.items.map(item => {
              if (item.type === 'folder') {
                return (
                  <FolderItem 
                    key={item.id}
                    folder={item}
                    onToggle={onToggleFolder}
                    onFileClick={onFileClick}
                  />
                );
              } else {
                return (
                  <div
                    key={item.id}
                    className="cursor-pointer hover:underline"
                    onClick={() => onFileClick(item.id)}
                  >
                    {item.title}
                  </div>
                );
              }
            })
          )}
        </div>
      )}
    </div>
  );
}