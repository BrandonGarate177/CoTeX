import React, { useState, useRef, useEffect } from 'react';
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

  // Mock updates for demonstration
  const mockUpdates = [
    { id: 1, type: 'commit', text: 'New commit: Update README.md', date: '2 hours ago' },
    { id: 2, type: 'note', text: 'Meeting notes: Discuss latex templates', date: 'Yesterday' },
    { id: 3, type: 'version', text: 'v1.2.0 released', date: '3 days ago' },
  ];

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      // With the modified API, we only need one call
      const resp = await authAxios.get("/api/projects/");
      
      // Either data.results (paginated) or data (unpaginated)
      const list = Array.isArray(resp.data)
        ? resp.data
        : resp.data.results;

      // Build the project folders mapping
      const folderMapping = {};
      list.forEach(project => {
        if (project.folders && project.folders.length > 0) {
          folderMapping[project.id] = project.folders;
        }
      });
      
      // Update the projectFolders state
      setProjectFolders(folderMapping);

      // We'll need to fetch files in folders
      const projectsWithNestedFiles = await Promise.all(list.map(async (project) => {
        // For each folder, fetch files inside it
        const foldersWithFiles = await Promise.all((project.folders || []).map(async (folder) => {
          try {
            // Fetch files for this folder
            const folderFilesResp = await authAxios.get(`/api/files/files/?folder=${folder.id}`);
            const folderFiles = Array.isArray(folderFilesResp.data) 
              ? folderFilesResp.data 
              : folderFilesResp.data.results || [];
            
            // Return the folder with its files added to items
            return {
              ...folder,
              items: folderFiles.map(file => ({
                id: file.id,
                title: file.name,
                type: "file"
              }))
            };
          } catch (error) {
            console.error(`Error fetching files for folder ${folder.id}:`, error);
            return { ...folder, items: [] };
          }
        }));
        
        // Return the project with updated folders
        return {
          ...project,
          folders: foldersWithFiles
        };
      }));

      setSections((secs) =>
        secs.map((sec) => {
          if (sec.id === "projects") {
            return {
              ...sec,
              items: projectsWithNestedFiles.map((p) => {
                return {
                  id: p.id,
                  title: p.name,
                  expanded: false,
                  items: [
                    // Include all folders with their files
                    ...(p.folders || []).map(folder => ({
                      id: folder.id,
                      title: folder.name,
                      type: "folder",
                      expanded: false,
                      items: folder.items || [] // Now includes files inside the folder
                    })),
                    
                    // Include root files (those without a folder)
                    ...(p.files || [])
                      .filter(f => !f.folder) // Only include files without a folder
                      .map(f => ({
                        id: f.id,
                        title: f.name,
                        type: "file"
                      }))
                  ]
                };
              }),
            };
          } else if (sec.id === "updates") {
            return {
              ...sec,
              items: mockUpdates
            };
          } else {
            return sec;
          }
        })
      );
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  // fetch immediately when the component loads
  useEffect(() => {
    fetchProjects();
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
  
  // Update the moveFile function to make it more robust
  const moveFile = async (fileId, targetFolderId, sourceProjectId, targetProjectId) => {
    try {
      console.log(`Moving file ${fileId} to folder ${targetFolderId}`);
      
      // Convert the IDs to numbers if they're strings
      const numFileId = parseInt(fileId, 10) || fileId;
      const numTargetFolderId = parseInt(targetFolderId, 10) || targetFolderId;
      
      // Make an API call to update the file's folder
      const response = await authAxios.patch(`/api/files/files/${numFileId}/`, {
        folder: numTargetFolderId || null // Use null to move to project root
      });
      
      console.log(`✅ File moved successfully:`, response.data);
      
      // Refresh projects to update the UI
      await fetchProjects();
      
      return response.data;
    } catch (error) {
      console.error('❌ Error moving file:', error);
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
          if (sec.id === 'projects' && expanded) {
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
    
    await fetchProjects();
    
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