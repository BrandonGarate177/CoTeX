import React, { useState, useRef, useEffect, useCallback } from 'react';
import { authAxios } from '../../utils/auth';
import { 
  FiFolder, 
  FiFile, 
  FiChevronRight, 
  FiPlus, 
  FiRefreshCw, 
  FiMoreHorizontal,
  FiEdit,
  FiTrash2
} from 'react-icons/fi';

// Import modals
import ProjectModal from './sidebarComps/ProjectModal';
import FileModal from './sidebarComps/FileModal';
import FolderModal from './sidebarComps/FolderModal';

// Import project components
import ProjectItem from './projects/ProjectItem';

// Initial sections structure
const initialSections = [
  {
    id: 'projects',
    title: 'PROJECTS',
    content: null,
    expanded: true, // Auto-expand projects by default
    items: []
  },
  {
    id: 'updates',
    title: 'UPDATES',
    content: null,
    expanded: false,
    items: []
  },
];

// Utility function for debouncing
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

export default function LeftSide({ onFileSelect }) {
  // State variables
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [projectFolders, setProjectFolders] = useState({});
  
  const [sections, setSections] = useState(initialSections);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dragItemIndex = useRef(null);
  const sectionRefs = useRef([]);
  
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredSection, setHoveredSection] = useState(null);
  
  // Keep track of request cancellation
  const abortControllerRef = useRef(null);

  // Mock updates for demonstration
  const mockUpdates = [
    { id: 1, type: 'commit', text: 'New commit: Update README.md', date: '2 hours ago' },
    { id: 2, type: 'note', text: 'Meeting notes: Discuss latex templates', date: 'Yesterday' },
    { id: 3, type: 'version', text: 'v1.2.0 released', date: '3 days ago' },
  ];

  const fetchProjects = async (specificProjectId = null) => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    setLoading(true);
    setError(null);
    
    try {
      // If specific project ID is provided, only fetch that one project
      // Otherwise fetch all projects
      const endpoint = specificProjectId 
        ? `/api/projects/${specificProjectId}/` 
        : "/api/projects/";
      
      const resp = await authAxios.get(endpoint, { signal });
      
      let projectsList;
      if (specificProjectId) {
        // For a single project, wrap it in an array
        projectsList = [resp.data];
      } else {
        // For multiple projects, extract the list
        projectsList = Array.isArray(resp.data)
          ? resp.data
          : resp.data.results;
      }
      
      // Build the project folders mapping for dropdown usage
      const folderMapping = { ...projectFolders };
      projectsList.forEach(project => {
        if (project.folders && project.folders.length > 0) {
          folderMapping[project.id] = project.folders;
        }
      });
      
      setProjectFolders(folderMapping);

      // For each project, get ALL files
      const projectsWithAllFiles = await Promise.all(projectsList.map(async (project) => {
        // Get all files for this project
        const allFilesResp = await authAxios.get(`/api/files/files/?project=${project.id}`, { signal });
        const allFiles = Array.isArray(allFilesResp.data) 
          ? allFilesResp.data 
          : allFilesResp.data.results || [];

        // Organize files by folder
        const rootFiles = [];
        const filesByFolder = {};

        // Group files by their folder ID
        allFiles.forEach(file => {
          if (file.folder) {
            // This file belongs in a folder
            if (!filesByFolder[file.folder]) {
              filesByFolder[file.folder] = [];
            }
            filesByFolder[file.folder].push(file);
          } else {
            // This is a root file
            rootFiles.push(file);
          }
        });

        // Process folders to include their files
        const foldersWithFiles = (project.folders || []).map(folder => {
          const folderFiles = filesByFolder[folder.id] || [];
          return {
            ...folder,
            items: folderFiles.map(file => ({
              id: file.id,
              title: file.name,
              type: "file"
            }))
          };
        });
        
        return {
          ...project,
          rootFiles,
          folders: foldersWithFiles
        };
      }));

      // Now update the sections state with the complete project data
      setSections((secs) => {
        return secs.map((sec) => {
          if (sec.id === "projects") {
            if (specificProjectId) {
              // If we fetched just one project, update only that project
              const updatedProject = projectsWithAllFiles[0];
              return {
                ...sec,
                items: sec.items.map(existingProject => {
                  if (existingProject.id === specificProjectId) {
                    // Keep the expanded state of the project
                    const wasExpanded = existingProject.expanded;
                    
                    return {
                      ...updatedProject,
                      title: updatedProject.name,
                      expanded: wasExpanded,
                      items: [
                        // Include all folders with their files
                        ...(updatedProject.folders || []).map(folder => ({
                          id: folder.id,
                          title: folder.name,
                          type: "folder",
                          // Try to preserve expanded state of folders if possible
                          expanded: existingProject.items?.find(i => i.id === folder.id)?.expanded || false,
                          items: folder.items || []
                        })),
                        
                        // Include root files (those without a folder)
                        ...(updatedProject.rootFiles || []).map(f => ({
                          id: f.id,
                          title: f.name,
                          type: "file"
                        }))
                      ]
                    };
                  }
                  return existingProject;
                })
              };
            } else {
              // Full refresh of all projects
              return {
                ...sec,
                items: projectsWithAllFiles.map((p) => {
                  // Try to preserve expanded state
                  const existingProject = sec.items.find(ep => ep.id === p.id);
                  const wasExpanded = existingProject?.expanded || false;
                  
                  return {
                    id: p.id,
                    title: p.name,
                    expanded: wasExpanded,
                    items: [
                      // Include all folders with their files
                      ...(p.folders || []).map(folder => {
                        // Try to preserve expanded state of folders
                        const existingFolder = existingProject?.items?.find(i => i.id === folder.id && i.type === 'folder');
                        const folderWasExpanded = existingFolder?.expanded || false;
                        
                        return {
                          id: folder.id,
                          title: folder.name,
                          type: "folder",
                          expanded: folderWasExpanded,
                          items: folder.items || []
                        };
                      }),
                      
                      // Include root files (those without a folder)
                      ...(p.rootFiles || []).map(f => ({
                        id: f.id,
                        title: f.name,
                        type: "file"
                      }))
                    ]
                  };
                }),
              };
            }
          } else if (sec.id === "updates") {
            // Updates aren't affected by project changes
            return {
              ...sec,
              items: sec.items.length > 0 ? sec.items : mockUpdates
            };
          } else {
            return sec;
          }
        });
      });
    } catch (e) {
      // Only show error if it's not an abort error
      if (e.name !== 'AbortError') {
        console.error(e);
        setError(e.response?.data?.detail || e.message);
      }
    } finally {
      if (signal.aborted === false) {
        setLoading(false);
      }
    }
  };

  // Create a debounced refresh function for specific projects
  const debouncedRefreshProject = useDebounce((projectId) => {
    fetchProjects(projectId);
  }, 1000); // Debounce by 1 second

  // fetch immediately when the component loads
  useEffect(() => {
    fetchProjects();
    
    // Cleanup function to abort any in-flight requests when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // kick off your first load when you expand "Projects"
  useEffect(() => {
    const proj = sections.find((s) => s.id === "projects");
    if (proj?.expanded && proj.items.length === 0) {
      fetchProjects();
    }
  }, [sections]);

  // API functions remain the same
  const createFolder = async (projectId, folderName, parentFolderId = null) => {
    try {
      const folderData = {
        name: folderName,
        project: projectId
      };
      
      // If parent folder ID is provided, include it in the request
      if (parentFolderId) {
        folderData.parent = parentFolderId;
      }
      
      const response = await authAxios.post('/api/files/folders/', folderData);
      
      // Only refresh the specific project
      debouncedRefreshProject(projectId);
      
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
  
  const createFile = async (projectId, fileName, isMain, folderId = null) => {
    const projectIdValue = parseInt(projectId, 10) || projectId;
    
    const fileData = {
      name: fileName,
      content: `% ${fileName}\n% Created in CoTeX\n\n\\documentclass{article}\n\n\\begin{document}\n\nYour content here\n\n\\end{document}`,
      project: projectIdValue,
      is_main: isMain
    };
    
    if (folderId) {
      fileData.folder = parseInt(folderId, 10) || folderId;
    }
    
    try {
      const response = await authAxios.post('/api/files/files/', fileData);
      
      // Only refresh the specific project
      debouncedRefreshProject(projectId);
      
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
  
  // Update the moveFile function
  const moveFile = async (fileId, targetFolderId, sourceProjectId, targetProjectId) => {
    try {
      console.log("🔄 moveFile called with:", {
        fileId,
        targetFolderId,
        sourceProjectId,
        targetProjectId
      });
      
      // Convert the IDs to numbers if they're strings
      const numFileId = parseInt(fileId, 10) || fileId;
      const numTargetFolderId = parseInt(targetFolderId, 10) || targetFolderId;
      
      // Find the file we're moving to use in optimistic updates
      let fileToMove = null;
      let fileName = null;
      
      // First search in the source project
      const sourceProject = sections.find(s => s.id === 'projects')
        ?.items.find(p => p.id === sourceProjectId);
      
      if (sourceProject) {
        // Check root files
        const rootFile = sourceProject.items.find(i => i.type === 'file' && i.id === numFileId);
        if (rootFile) {
          fileToMove = rootFile;
          fileName = rootFile.title;
        } else {
          // Check in folders
          for (const folder of sourceProject.items.filter(i => i.type === 'folder')) {
            const folderFile = folder.items?.find(i => i.id === numFileId);
            if (folderFile) {
              fileToMove = folderFile;
              fileName = folderFile.title;
              break;
            }
          }
        }
      }
      
      // Apply optimistic UI update first
      setSections((prevSections) => {
        return prevSections.map(section => {
          if (section.id === 'projects') {
            return {
              ...section,
              items: section.items.map(project => {
                if (project.id === sourceProjectId) {
                  // Find the file to move
                  let fileToMove = null;
                  let fileType = null;
                  
                  // First check root files
                  const newRootItems = project.items.filter(item => {
                    if (item.type === 'file' && item.id === numFileId) {
                      fileToMove = { ...item };
                      fileType = 'root';
                      return false;
                    }
                    return true;
                  });
                  
                  // If not found in root, check folders
                  const newItems = newRootItems.map(item => {
                    if (item.type === 'folder') {
                      // If this is the target folder, add the file here
                      if (item.id === numTargetFolderId && fileToMove) {
                        return {
                          ...item,
                          items: [...(item.items || []), fileToMove]
                        };
                      } 
                      // If not the target, check if file is in this folder
                      else if (item.items && item.items.length > 0) {
                        const newFolderItems = item.items.filter(folderItem => {
                          if (folderItem.id === numFileId) {
                            fileToMove = { ...folderItem };
                            fileType = 'folder';
                            return false;
                          }
                          return true;
                        });
                        
                        return {
                          ...item,
                          items: newFolderItems
                        };
                      }
                    }
                    return item;
                  });
                  
                  // If file was found in a folder and target is root (null)
                  if (fileType === 'folder' && numTargetFolderId === null && fileToMove) {
                    return {
                      ...project,
                      items: [...newItems, fileToMove]
                    };
                  }
                  
                  return {
                    ...project,
                    items: newItems
                  };
                }
                return project;
              })
            };
          }
          return section;
        });
      });
      
      // Make the API call
      const response = await authAxios.patch(`/api/files/files/${numFileId}/`, {
        folder: numTargetFolderId || null
      });
      
      console.log(`✅ File moved successfully:`, response.data);
      
      // Important: cancel any pending refreshes that might overwrite our optimistic update
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Only refresh if something unexpected happened in the server response
      const serverFolder = response.data.folder;
      const serverName = response.data.name;
      
      if ((serverFolder !== numTargetFolderId) || (serverName !== fileName)) {
        console.log("⚠️ Server returned unexpected data, refreshing...");
        // Only in this case do we refresh to get the correct state
        debouncedRefreshProject(sourceProjectId);
        
        if (targetProjectId && targetProjectId !== sourceProjectId) {
          debouncedRefreshProject(targetProjectId);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error moving file:', error);
      
      // If there was an error, refresh to restore the previous state
      debouncedRefreshProject(sourceProjectId);
      
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to move file'
      );
    }
  };

  // Event handlers
  const handleDragStart = (e, idx) => {
    dragItemIndex.current = idx;
    setDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
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
      old.map((sec, i) => {
        if (i === idx) {
          const expanded = !sec.expanded;
          // if this is the projects section and we're now opening it…
          if (sec.id === 'projects' && expanded && sec.items.length === 0) {
            fetchProjects();
          }
          return { ...sec, expanded };
        }
        return sec;
      })
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
    console.log("☑️  file clicked:", fileId);
    onFileSelect(fileId);
  };

  const createProject = async (projectName) => {
    const response = await authAxios.post(`/api/projects/`, {
      name: projectName
    });
    
    // Refresh all projects when creating a new one
    fetchProjects();
    
    return response.data;
  };
  
  // Handler functions for ProjectItem
  const handleAddFile = (projectId) => {
    setActiveProjectId(projectId);
    setFileModalOpen(true);
  };
  
  const handleAddFolder = (projectId) => {
    setActiveProjectId(projectId);
    setFolderModalOpen(true);
  };

  // Global refresh now includes abort controller for safety
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    setTimeout(() => setRefreshing(false), 500); // Show spinner for at least 500ms
  };

  // Function to render update items
  const renderUpdateItem = (item) => {
    let bgColor = 'bg-purple-800/30';
    let icon = null;
    
    if (item.type === 'commit') {
      icon = <span className="text-green-400">●</span>;
    } else if (item.type === 'note') {
      icon = <span className="text-yellow-400">●</span>;
    } else if (item.type === 'version') {
      icon = <span className="text-blue-400">●</span>;
    }
    
    return (
      <div key={item.id} className={`p-2 mb-2 rounded ${bgColor} hover:bg-purple-800/50 transition-colors`}>
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-sm font-medium">{item.text}</span>
        </div>
        <div className="text-xs text-gray-400">{item.date}</div>
      </div>
    );
  };

  // VS Code-style section header with actions
  const renderSectionHeader = (sec, idx) => {
    return (
      <div 
        className="flex w-full items-center px-4 py-2 hover:bg-[#27004A] cursor-pointer border-b border-[#37155F] group"
        onMouseEnter={() => setHoveredSection(sec.id)}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <button
          className="flex flex-1 items-center outline-none"
          onClick={() => toggleExpand(idx)}
        >
          <FiChevronRight
            className={`transform transition-transform duration-200 mr-1 text-gray-400 ${
              sec.expanded ? 'rotate-90' : ''
            }`}
            size={14}
          />
          <span className="text-xs font-medium text-left tracking-wider text-gray-400 flex-1">
            {sec.title}
          </span>
        </button>

        {/* VS Code-style action buttons */}
        {sec.id === 'projects' && (
          <div className={`flex items-center space-x-1 ${!hoveredSection || hoveredSection !== sec.id ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
            <button 
              className="p-1 rounded hover:bg-[#37155F] text-gray-400 hover:text-white transition-colors"
              onClick={() => setProjectModalOpen(true)}
              title="New Project"
            >
              <FiPlus size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-[290px] bg-[#230B38] text-[#F7EBFD] font-['Source_Code_Pro'] border-r border-[#37155F]">
      {/* Header with Logo/Title */}
      <div className="h-[42px] px-4 py-3 text-xl font-semibold border-b border-[#37155F] flex justify-between items-center">
        <span>CoTeX</span>
        <button 
          onClick={handleRefresh}
          className="p-1 rounded-full hover:bg-[#37155F] transition-colors"
          title="Refresh"
        >
          <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sections */}
      <div
        className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-[#37155F] scrollbar-track-[#230B38]"
        onDragOver={handleDragOver}
      >
        {/* Sections Container */}
        <div className="flex flex-col">
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
              {/* VS Code-style header */}
              {renderSectionHeader(sec, idx)}

              {sec.expanded && (
                <div className="overflow-hidden">
                  {sec.id === 'projects' ? (
                    <div className="bg-[#27004A]/40">
                      {loading && <div className="text-sm text-gray-300 p-4">Loading projects...</div>}
                      {error && <div className="text-sm text-red-400 p-4">{error}</div>}
                      
                      {sec.items.length === 0 && !loading && !error && (
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                          <div className="text-sm text-gray-300 mb-3">
                            No projects found
                          </div>
                          <button 
                            className="px-3 py-1.5 bg-[#37155F] hover:bg-[#4B2077] text-white rounded-md text-sm flex items-center transition-colors"
                            onClick={() => setProjectModalOpen(true)}
                          >
                            <FiPlus className="mr-1.5" size={14} />
                            New Project
                          </button>
                        </div>
                      )}
                      
                      {/* Projects List */}
                      <div className="py-1">
                        {sec.items.map(project => (
                          <ProjectItem 
                            key={project.id}
                            project={project}
                            onToggleProject={toggleProjectExpand}
                            onFileClick={handleFileClick}
                            onToggleFolder={toggleFolderExpand}
                            onAddFile={handleAddFile}
                            onAddFolder={handleAddFolder}
                            onMoveFile={moveFile}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#27004A]/40 p-3">
                      {sec.items && sec.items.length > 0 ? (
                        sec.items.map(item => renderUpdateItem(item))
                      ) : (
                        <p className="text-sm text-gray-300 p-2">No recent updates</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <ProjectModal 
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSubmit={createProject}
      />

      <FolderModal 
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onSubmit={createFolder}
        projectId={activeProjectId}
        onCreateFile={(fileData) => {
          // This ensures we use the folder's ID when creating a file
          return createFile(
            activeProjectId, 
            fileData.name,
            fileData.is_main, 
            fileData.folder
          );
        }}
      />

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