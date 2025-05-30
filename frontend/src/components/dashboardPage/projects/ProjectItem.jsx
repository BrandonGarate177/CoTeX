import React, { useState } from 'react';
import { 
  FiChevronRight, 
  FiFolder, 
  FiFile, 
  FiPlus, 
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
  const [draggingFileId, setDraggingFileId] = useState(null);
  const [hoveredFolderId, setHoveredFolderId] = useState(null);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  
  // Handler for starting file drag
  const handleFileDragStart = (e, fileId) => {
    e.stopPropagation();
    setDraggingFileId(fileId);
    e.dataTransfer.setData('text/plain', fileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handler for dragging over a folder
  const handleFolderDragOver = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveredFolderId(folderId);
    e.dataTransfer.dropEffect = 'move';
  };

  // Handler for dropping a file into a folder
  const handleFolderDrop = async (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveredFolderId(null);
    
    const fileId = e.dataTransfer.getData('text/plain');
    
    if (fileId && onMoveFile) {
      try {
        await onMoveFile(fileId, folderId, project.id, project.id);
        console.log(`✅ Moved file ${fileId} to folder ${folderId}`);
      } catch (error) {
        console.error('❌ Error moving file:', error);
      }
    }
  };

  // Handler for dragging leave
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveredFolderId(null);
  };

  // Stop propagation for all drag events on project item
  const handleProjectDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Render project files (files in root directory)
  const renderRootFiles = () => {
    return project.items
      .filter(item => item.type === 'file')
      .map(file => (
        <div
          key={file.id}
          className="flex items-center pl-8 py-1 hover:bg-[#37155F] cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            onFileClick(file.id);
          }}
          draggable
          onDragStart={(e) => handleFileDragStart(e, file.id)}
          onDragEnd={(e) => e.stopPropagation()}
        >
          <FiFile className="mr-2 text-gray-400" size={14} />
          <span className="text-sm">{file.title}</span>
        </div>
      ));
  };

  // Render project folders with their nested files
  const renderFolders = () => {
    return project.items
      .filter(item => item.type === 'folder')
      .map(folder => (
        <div key={folder.id} onDragOver={handleProjectDragOver}>
          <div 
            className={`flex items-center pl-7 py-1 cursor-pointer group ${
              hoveredFolderId === folder.id ? 'bg-[#37155F]/70' : 'hover:bg-[#37155F]'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFolder(folder.id);
            }}
            onDragOver={(e) => handleFolderDragOver(e, folder.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleFolderDrop(e, folder.id)}
          >
            <FiChevronRight
              className={`transform transition-transform duration-200 mr-1 text-gray-400 ${
                folder.expanded ? 'rotate-90' : ''
              }`}
              size={12}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFolder(folder.id);
              }}
            />
            <FiFolder className="mr-2 text-blue-400" size={14} />
            <span className="text-sm">{folder.title}</span>
            
            {/* Visual indicator when dragging over */}
            {hoveredFolderId === folder.id && (
              <div className="ml-2 text-xs text-purple-400">Drop here</div>
            )}
          </div>
          
          {/* Render files inside a folder */}
          {folder.expanded && folder.items && folder.items.length > 0 && (
            <div>
              {folder.items.map(file => (
                <div
                  key={file.id}
                  className="flex items-center pl-12 py-1 hover:bg-[#37155F] cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileClick(file.id);
                  }}
                  draggable
                  onDragStart={(e) => handleFileDragStart(e, file.id)}
                  onDragEnd={(e) => e.stopPropagation()}
                >
                  <FiFile className="mr-2 text-gray-400" size={14} />
                  <span className="text-sm">{file.title}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Empty folder message */}
          {folder.expanded && (!folder.items || folder.items.length === 0) && (
            <div className="pl-12 py-1 text-xs text-gray-500 italic">
              Empty folder
            </div>
          )}
        </div>
      ));
  };

  return (
    <div className="py-1" onDragOver={handleProjectDragOver}>
      {/* Project item with toggle */}
      <div 
        className="flex items-center pl-4 py-1 hover:bg-[#37155F] cursor-pointer group"
        onClick={(e) => {
          e.stopPropagation();
          onToggleProject(project.id);
        }}
      >
        <FiChevronRight
          className={`transform transition-transform duration-200 mr-1 text-gray-400 ${
            project.expanded ? 'rotate-90' : ''
          }`}
          size={14}
          onClick={(e) => {
            e.stopPropagation();
            onToggleProject(project.id);
          }}
        />
        <span className="text-sm font-medium">{project.title}</span>

        <div className="ml-auto mr-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 rounded hover:bg-[#4B2077] text-gray-400 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onAddFile(project.id);
            }}
            title="Add File"
          >
            <FiFile size={12} />
          </button>
          <button
            className="p-1 rounded hover:bg-[#4B2077] text-gray-400 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onAddFolder(project.id);
            }}
            title="Add Folder"
          >
            <FiFolder size={12} />
          </button>
        </div>
      </div>

      {/* Expanded project contents */}
      {project.expanded && (
        <div>
          {renderFolders()}
          {renderRootFiles()}
        </div>
      )}
    </div>
  );
};

export default ProjectItem;