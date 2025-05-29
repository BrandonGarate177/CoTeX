import React, { useState } from 'react';
import { 
  FiChevronRight, 
  FiFolder, 
  FiFile, 
  FiPlus, 
  FiEdit, 
  FiTrash2,
  FiMoreHorizontal
} from 'react-icons/fi';

const ProjectItem = ({ 
  project, 
  onToggleProject, 
  onFileClick, 
  onToggleFolder,
  onAddFile,
  onAddFolder,
  onMoveFile
}) => {
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [activeContextMenu, setActiveContextMenu] = useState(null);

  // Method to find a folder by ID, including in nested folders
  const findFolder = (folderId, items = project.items) => {
    for (const item of items) {
      if (item.type === 'folder' && item.id === folderId) {
        return item;
      }
      if (item.type === 'folder' && item.items) {
        const found = findFolder(folderId, item.items);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper to render nested folders recursively
  const renderFolderContents = (folder) => {
    if (!folder.items) return null;
    
    return (
      <div className={`ml-4 ${folder.expanded ? 'block' : 'hidden'}`}>
        {folder.items.map(item => {
          if (item.type === 'folder') {
            return renderFolder(item);
          } else {
            return renderFile(item, folder.id);
          }
        })}
      </div>
    );
  };

  const handleDragStart = (e, fileId, fileName) => {
    e.dataTransfer.setData('fileId', fileId);
    e.dataTransfer.setData('fileName', fileName);
    e.dataTransfer.setData('projectId', project.id);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleFolderDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleFolderDrop = (e, folderId) => {
    e.preventDefault();
    
    const fileId = e.dataTransfer.getData('fileId');
    const fileName = e.dataTransfer.getData('fileName');
    const sourceProjectId = e.dataTransfer.getData('projectId');
    
    // Call parent component's method to handle the move
    if (onMoveFile && fileId) {
      onMoveFile(fileId, folderId, sourceProjectId, project.id);
    }
  };

  // Render a folder item with drag-and-drop capability
  const renderFolder = (folder) => {
    return (
      <div key={folder.id} className="relative">
        <div 
          className="flex items-center px-4 py-1.5 hover:bg-[#37155F] cursor-pointer group"
          onDragOver={handleFolderDragOver}
          onDrop={(e) => handleFolderDrop(e, folder.id)}
        >
          <button
            onClick={() => onToggleFolder(folder.id)}
            className="flex items-center flex-1 outline-none"
          >
            <FiChevronRight
              className={`transform transition-transform duration-200 mr-1 ${
                folder.expanded ? 'rotate-90' : ''
              }`}
              size={14}
            />
            <FiFolder className="mr-1.5 text-yellow-400" size={14} />
            <span className="text-sm truncate">{folder.title}</span>
          </button>
          
          {/* Context menu trigger */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1 rounded hover:bg-[#4B2077]"
              onClick={(e) => {
                e.stopPropagation();
                setActiveContextMenu(activeContextMenu === folder.id ? null : folder.id);
              }}
            >
              <FiMoreHorizontal size={14} />
            </button>
            
            {/* Context menu */}
            {activeContextMenu === folder.id && (
              <div className="absolute right-0 mt-1 py-1 bg-[#27004A] rounded shadow-lg z-10 border border-[#37155F] w-44">
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-[#37155F] flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddFile(project.id, folder.id);
                    setActiveContextMenu(null);
                  }}
                >
                  <FiFile className="mr-2" size={14} />
                  <span>New File</span>
                </button>
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-[#37155F] flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    // This would require implementing nested folder creation
                    onAddFolder(project.id, folder.id); 
                    setActiveContextMenu(null);
                  }}
                >
                  <FiFolder className="mr-2" size={14} />
                  <span>New Subfolder</span>
                </button>
                <div className="border-t border-[#37155F] my-1"></div>
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-[#37155F] text-red-400 flex items-center"
                >
                  <FiTrash2 className="mr-2" size={14} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Render nested content if expanded */}
        {renderFolderContents(folder)}
      </div>
    );
  };

  // Render a file with drag capability
  const renderFile = (file, parentFolderId = null) => {
    return (
      <div
        key={file.id}
        className="flex items-center px-8 py-1.5 hover:bg-[#37155F] cursor-pointer group"
        onClick={() => onFileClick(file.id)}
        draggable
        onDragStart={(e) => handleDragStart(e, file.id, file.title)}
      >
        <div className="flex items-center flex-1">
          <FiFile className="mr-1.5 text-blue-400" size={14} />
          <span className="text-sm truncate">{file.title}</span>
        </div>
        
        {/* File context menu could be added here */}
      </div>
    );
  };

  return (
    <div className="mb-1">
      {/* Project header */}
      <div className="relative">
        <div
          className="flex items-center px-4 py-1.5 hover:bg-[#37155F] cursor-pointer group"
          onClick={() => onToggleProject(project.id)}
        >
          <FiChevronRight
            className={`transform transition-transform duration-200 mr-1 ${
              project.expanded ? 'rotate-90' : ''
            }`}
            size={14}
          />
          <span className="text-sm font-medium truncate flex-1">{project.title}</span>
          
          {/* Project actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex">
            <button
              className="p-1 rounded hover:bg-[#4B2077] mr-1"
              onClick={(e) => {
                e.stopPropagation();
                onAddFile(project.id);
              }}
              title="New File"
            >
              <FiFile size={14} />
            </button>
            <button
              className="p-1 rounded hover:bg-[#4B2077]"
              onClick={(e) => {
                e.stopPropagation();
                onAddFolder(project.id);
              }}
              title="New Folder"
            >
              <FiFolder size={14} />
            </button>
            <button
              className="p-1 rounded hover:bg-[#4B2077] ml-1"
              onClick={(e) => {
                e.stopPropagation();
                setShowProjectMenu(!showProjectMenu);
              }}
            >
              <FiMoreHorizontal size={14} />
            </button>
          </div>
          
          {/* Project context menu */}
          {showProjectMenu && (
            <div className="absolute right-0 mt-1 py-1 bg-[#27004A] rounded shadow-lg z-10 border border-[#37155F] w-44 top-full">
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#37155F] flex items-center">
                <FiEdit className="mr-2" size={14} />
                <span>Rename</span>
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#37155F] text-red-400 flex items-center">
                <FiTrash2 className="mr-2" size={14} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Project contents */}
      {project.expanded && (
        <div className="ml-4">
          {project.items.map(item => {
            if (item.type === 'folder') {
              return renderFolder(item);
            } else {
              return renderFile(item);
            }
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectItem;