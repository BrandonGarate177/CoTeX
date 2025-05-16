import React, { useState, useRef, useEffect } from 'react';
import { authAxios } from '../../utils/auth';

// Add a ProjectModal component at the top of the file
function ProjectModal({ isOpen, onClose, onSubmit }) {
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await onSubmit(projectName);
      setProjectName('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#230B38] text-[#F7EBFD] p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full p-2 bg-[#27004A] rounded text-[#F7EBFD] focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="Enter project name"
              autoFocus
            />
          </div>
          
          {error && <p className="text-red-400 mb-4">{error}</p>}
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-800 rounded hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Update the FileModal component
function FileModal({ isOpen, onClose, onSubmit, projectId, folders = [] }) {
  const [fileName, setFileName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [isMainFile, setIsMainFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await onSubmit(projectId, fileName, isMainFile, selectedFolder || null);
      setFileName('');
      setIsMainFile(false);
      setSelectedFolder('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create file');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#230B38] text-[#F7EBFD] p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Create New File</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full p-2 bg-[#27004A] rounded text-[#F7EBFD] focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="Enter file name (e.g. main.tex)"
              autoFocus
            />
          </div>
          
          {folders.length > 0 && (
            <div className="mb-4">
              <label className="block mb-2">Folder (optional)</label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full p-2 bg-[#27004A] rounded text-[#F7EBFD] focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="">Root (No folder)</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isMainFile}
                onChange={(e) => setIsMainFile(e.target.checked)}
                className="mr-2"
              />
              Set as main file
            </label>
          </div>
          
          {error && <p className="text-red-400 mb-4">{error}</p>}
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-800 rounded hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add after the FileModal component
function FolderModal({ isOpen, onClose, onSubmit, projectId }) {
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await onSubmit(projectId, folderName);
      setFolderName('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#230B38] text-[#F7EBFD] p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Create New Folder</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full p-2 bg-[#27004A] rounded text-[#F7EBFD] focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="Enter folder name"
              autoFocus
            />
          </div>
          
          {error && <p className="text-red-400 mb-4">{error}</p>}
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-800 rounded hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// We'll enhance the initial sections structure to support nested items
const initialSections = [
  {
    id: 'projects',
    title: 'Projects',
    content: null, // We'll replace this with dynamic content
    expanded: false,
    items: [] // Will hold project items
  },
  {
    id: 'updates',
    title: 'Updates',
    content: 'Your updates will appear here',
    expanded: false,
  },
];

export default function Sidebar() {
  // Add these state variables
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [projectFolders, setProjectFolders] = useState({});
  
  const [sections, setSections] = useState(initialSections);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dragItemIndex = useRef(null);
  const sectionRefs = useRef([]);
  
  // Add state for modals
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);

  // Fetch user's projects when the component mounts or Projects section is expanded
  useEffect(() => {
    const projectSection = sections.find(section => section.id === 'projects');
    
    if (projectSection && projectSection.expanded && projectSection.items.length === 0) {
      fetchProjects();
    }
  }, [sections]);

  // Add createFolder function to use the folder endpoint
  const createFolder = async (projectId, folderName) => {
    try {
      const response = await authAxios.post('/api/files/folders/', {
        name: folderName,
        project: projectId
      });
      
      // After successful creation, refresh projects and folders
      await fetchProjects();
      
      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to create folder'
      );
    }
  };
  
  // Update createFile to handle folder selection
  const createFile = async (projectId, fileName, isMain, folderId = null) => {
    const projectIdValue = parseInt(projectId, 10) || projectId;
    
    const fileData = {
      name: fileName,
      content: `% ${fileName}\n% Created in CoTeX\n\n\\documentclass{article}\n\n\\begin{document}\n\nYour content here\n\n\\end{document}`,
      project: projectIdValue,
      is_main: isMain
    };
    
    // Add folder ID if provided
    if (folderId) {
      fileData.folder = parseInt(folderId, 10) || folderId;
    }
    
    console.log('Creating file with data:', fileData);
    
    try {
      const response = await authAxios.post('/api/files/files/', fileData);
      
      await fetchProjects();
      
      return response.data;
    } catch (error) {
      console.error('Error creating file:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.error || 
        (error.response?.data?.project && `Project error: ${JSON.stringify(error.response.data.project)}`) ||
        error.message || 
        'Failed to create file'
      );
    }
  };
  
  // Update fetchProjects to also fetch folders
  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch projects first
      const projectResponse = await authAxios.get('/api/projects/');
      
      // Handle different response formats for projects
      let projectsArray = [];
      if (Array.isArray(projectResponse.data)) {
        projectsArray = projectResponse.data;
      } else if (projectResponse.data && typeof projectResponse.data === 'object') {
        if (Array.isArray(projectResponse.data.results)) {
          projectsArray = projectResponse.data.results;
        } else {
          projectsArray = Object.values(projectResponse.data);
        }
      }
      
      // Now fetch folders for each project
      const foldersByProject = {};
      const filesByFolder = {};
      
      // Get all folders
      const foldersResponse = await authAxios.get('/api/files/folders/');
      const folders = foldersResponse.data.results || foldersResponse.data;
      
      // Group folders by project
      folders.forEach(folder => {
        if (!foldersByProject[folder.project]) {
          foldersByProject[folder.project] = [];
        }
        foldersByProject[folder.project].push(folder);
        filesByFolder[folder.id] = []; // Initialize empty array for files
      });
      
      // Store folders by project for later use in the file modal
      setProjectFolders(foldersByProject);
      
      // Now organize files by folder
      projectsArray.forEach(project => {
        if (project.files) {
          project.files.forEach(file => {
            if (file.folder && filesByFolder[file.folder]) {
              filesByFolder[file.folder].push(file);
            }
          });
        }
      });
      
      // Update the projects section with the fetched data
      setSections(prevSections => {
        return prevSections.map(section => {
          if (section.id === 'projects') {
            const projectItems = projectsArray.map(project => {
              const projectFolders = foldersByProject[project.id] || [];
              
              // Get files that are not in folders (root files)
              const rootFiles = (project.files || []).filter(file => !file.folder);
              
              return {
                id: `project-${project.id}`,
                type: 'project',
                projectId: project.id,
                title: project.name,
                expanded: false,
                items: [
                  // Add folders first
                  ...projectFolders.map(folder => ({
                    id: `folder-${folder.id}`,
                    type: 'folder',
                    folderId: folder.id,
                    title: folder.name,
                    expanded: false,
                    items: (filesByFolder[folder.id] || []).map(file => ({
                      id: `file-${file.id}`,
                      type: 'file',
                      fileId: file.id,
                      title: file.name || file.filename || 'Unnamed file',
                      isMain: !!file.is_main
                    }))
                  })),
                  // Then add root files
                  ...rootFiles.map(file => ({
                    id: `file-${file.id}`,
                    type: 'file',
                    fileId: file.id,
                    title: file.name || file.filename || 'Unnamed file',
                    isMain: !!file.is_main
                  }))
                ]
              };
            });
            
            return {
              ...section,
              items: projectItems
            };
          }
          return section;
        });
      });
    } catch (err) {
      console.error('Failed to fetch projects or folders:', err);
      setError(err.message || 'Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDragStart = (e, idx) => {
    dragItemIndex.current = idx;
    setDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    const draggedIdx = dragItemIndex.current;
    const mouseY = e.clientY;

    for (let i = 0; i < sectionRefs.current.length; i++) {
      if (i === draggedIdx) continue;

      const rect = sectionRefs.current[i]?.getBoundingClientRect();
      if (!rect) continue;

      const midpoint = (rect.top + rect.bottom) / 2;

      if (mouseY < midpoint && draggedIdx > i) {
        reorderSections(draggedIdx, i);
        dragItemIndex.current = i;
        break;
      } else if (mouseY > midpoint && draggedIdx < i) {
        reorderSections(draggedIdx, i);
        dragItemIndex.current = i;
        break;
      }
    }
  };

  const reorderSections = (fromIdx, toIdx) => {
    setSections((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
  };

  const handleDragEnd = () => {
    dragItemIndex.current = null;
    setDragging(false);
  };

  const toggleExpand = (idx) => {
    setSections((old) =>
      old.map((sec, i) =>
        i === idx ? { ...sec, expanded: !sec.expanded } : sec
      )
    );
  };

  const toggleProjectExpand = (projectId) => {
    setSections((prevSections) => {
      return prevSections.map(section => {
        if (section.id === 'projects') {
          return {
            ...section,
            items: section.items.map(project => {
              if (project.id === projectId) {
                return {
                  ...project,
                  expanded: !project.expanded
                };
              }
              return project;
            })
          };
        }
        return section;
      });
    });
  };

  // Add function to toggle folder expansion
  const toggleFolderExpand = (folderId) => {
    setSections((prevSections) => {
      return prevSections.map(section => {
        if (section.id === 'projects') {
          return {
            ...section,
            items: section.items.map(project => {
              return {
                ...project,
                items: project.items.map(item => {
                  if (item.type === 'folder' && item.id === folderId) {
                    return {
                      ...item,
                      expanded: !item.expanded
                    };
                  }
                  return item;
                })
              };
            })
          };
        }
        return section;
      });
    });
  };

  const handleFileClick = (fileId) => {
    // You can implement file selection/opening logic here
    console.log(`Opening file with ID: ${fileId}`);
  };

  // Add createProject function
  const createProject = async (projectName) => {
    // Use authAxios instead of axios with manual token handling
    const response = await authAxios.post(`/api/projects/`, {
      name: projectName
    });
    
    // After successful creation, refresh projects
    await fetchProjects();
    
    return response.data;
  };

  return (
    <div className="flex flex-col h-screen w-[290px] bg-[#230B38] text-[#F7EBFD] font-['Source_Code_Pro']">
      {/* Header with Logo/Title */}
      <div className="px-4 py-4 text-2xl font-semibold">CoTeX</div>

      {/* Sections */}
      <div
        className="flex-1 overflow-auto p-2"
        onDragOver={handleDragOver}
      >
        {/* Sections Container */}
        <div className="flex flex-col gap-y-4">
          {sections.map((sec, idx) => (
            <div
              key={sec.id}
              ref={(el) => (sectionRefs.current[idx] = el)}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              className={`select-none ${
                dragging && dragItemIndex.current === idx ? 'opacity-50' : ''
              }`}
            >
              <button
                className="flex w-full items-center px-3 py-2 rounded hover:bg-[#27004A] cursor-move"
                onClick={() => toggleExpand(idx)}
              >
                {/* Left aligned title with + button for Projects section */}
                <span className="flex-1 text-lg text-left">
                  {sec.title}
                  {sec.id === 'projects' && (
                    <button 
                      className="ml-2 px-2 text-sm bg-[#27004A] rounded-full hover:bg-purple-800 inline-flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent toggling the section
                        setProjectModalOpen(true);
                      }}
                    >
                      +
                    </button>
                  )}
                </span>
                <span
                  className={`text-2xl transform transition-transform duration-200 ${
                    sec.expanded ? 'rotate-90' : ''
                  }`}
                >
                  {'>'}
                </span>
              </button>

              {sec.expanded && (
                <div className="ml-2 mt-1">
                  {sec.id === 'projects' ? (
                    <>
                      {loading && <div className="text-sm text-gray-300 p-2">Loading projects...</div>}
                      {error && <div className="text-sm text-red-400 p-2">{error}</div>}
                      
                      {/* Projects List - Moved above the New Project button */}
                      {sec.items.length === 0 && !loading && !error && (
                        <div className="text-sm text-gray-300 p-2">No projects found. Create one to get started!</div>
                      )}
                      
                      {sec.items.map(project => (
                        <div key={project.id} className="mb-2">
                          {/* Project Entry */}
                          <button
                            className="flex w-full items-center px-3 py-1 rounded hover:bg-[#27004A]"
                            onClick={() => toggleProjectExpand(project.id)}
                          >
                            <span className="flex-1 text-left">{project.title}
                              {/* Add buttons for file and folder creation */}
                              <div className="inline-flex ml-2">
                                <button 
                                  className="px-1.5 text-xs bg-[#27004A] rounded-full hover:bg-purple-800 inline-flex items-center justify-center mr-1"
                                  title="Add new file"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveProjectId(project.projectId);
                                    setFileModalOpen(true);
                                  }}
                                >
                                  <span>+F</span>
                                </button>
                                <button 
                                  className="px-1.5 text-xs bg-[#27004A] rounded-full hover:bg-purple-800 inline-flex items-center justify-center"
                                  title="Add new folder"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveProjectId(project.projectId);
                                    setFolderModalOpen(true);
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
                          </button>
                          
                          {/* Files and Folders for this Project */}
                          {project.expanded && (
                            <div className="ml-4 mt-1">
                              {project.items.length === 0 ? (
                                <div className="text-sm text-gray-300 px-3 py-1">No files or folders in this project</div>
                              ) : (
                                project.items.map(item => {
                                  if (item.type === 'folder') {
                                    // Render folder with nested files
                                    return (
                                      <div key={item.id} className="mb-1">
                                        <button
                                          className="flex w-full items-center px-3 py-1 rounded hover:bg-[#27004A]"
                                          onClick={() => toggleFolderExpand(item.id)}
                                        >
                                          <span className="flex-1 text-left flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                            {item.title}
                                          </span>
                                          <span
                                            className={`text-sm transform transition-transform duration-200 ${
                                              item.expanded ? 'rotate-90' : ''
                                            }`}
                                          >
                                            {'>'}
                                          </span>
                                        </button>
                                        
                                        {/* Files inside folder */}
                                        {item.expanded && (
                                          <div className="ml-4 mt-1">
                                            {item.items.length === 0 ? (
                                              <div className="text-xs text-gray-300 px-3 py-1">Empty folder</div>
                                            ) : (
                                              item.items.map(file => (
                                                <div 
                                                  key={file.id} 
                                                  className="px-3 py-1 text-sm rounded hover:bg-[#27004A] cursor-pointer flex items-center"
                                                  onClick={() => handleFileClick(file.fileId)}
                                                >
                                                  <span className="flex-1">{file.title}</span>
                                                  {file.isMain && (
                                                    <span className="text-xs bg-purple-800 px-1 rounded">main</span>
                                                  )}
                                                </div>
                                              ))
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  } else {
                                    // Render regular file (outside of any folder)
                                    return (
                                      <div 
                                        key={item.id} 
                                        className="px-3 py-1 text-sm rounded hover:bg-[#27004A] cursor-pointer flex items-center"
                                        onClick={() => handleFileClick(item.fileId)}
                                      >
                                        <span className="flex-1">{item.title}</span>
                                        {item.isMain && (
                                          <span className="text-xs bg-purple-800 px-1 rounded">main</span>
                                        )}
                                      </div>
                                    );
                                  }
                                })
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="bg-[#27004A] rounded px-3 py-2">
                      <p className="text-sm text-gray-300">{sec.content}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Project Creation Modal */}
      <ProjectModal 
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSubmit={createProject}
      />
      
      {/* Folder Creation Modal */}
      <FolderModal 
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onSubmit={createFolder}
        projectId={activeProjectId}
      />
      
      {/* File Creation Modal */}
      <FileModal 
        isOpen={fileModalOpen}
        onClose={() => setFileModalOpen(false)}
        onSubmit={createFile}
        projectId={activeProjectId}
        folders={activeProjectId ? (projectFolders[activeProjectId] || []) : []}
      />
    </div>
  );
}