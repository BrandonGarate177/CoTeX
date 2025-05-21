import React, { useState, useRef, useEffect } from 'react';
import { authAxios } from '../../utils/auth';

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
    title: 'Projects',
    content: null,
    expanded: false,
    items: []
  },
  {
    id: 'updates',
    title: 'Updates',
    content: 'Your updates will appear here',
    expanded: false,
  },
];

export default function Sidebar() {
  // State variables remain the same
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

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await authAxios.get("/api/projects/");
      // Either data.results (paginated) or data (unpaginated)
      const list = Array.isArray(resp.data)
        ? resp.data
        : resp.data.results;

      setSections((secs) =>
        secs.map((sec) =>
          sec.id === "projects"
            ? {
                ...sec,
                items: list.map((p) => ({
                  id: p.id,
                  title: p.name,
                  expanded: false,
                  // <-- here we inject the files
                  items: p.files.map((f) => ({
                    id: f.id,
                    title: f.name,
                    type: "file",
                  })),
                })),
              }
            : sec
        )
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
    fetchProjects()
  }, [])

  // kick off your first load when you expand “Projects”
  useEffect(() => {
    const proj = sections.find((s) => s.id === "projects");
    if (proj?.expanded && proj.items.length === 0) {
      fetchProjects();
    }
  }, [sections]);

  // API functions remain the same
  const createFolder = async (projectId, folderName) => {
    try {
      const response = await authAxios.post('/api/files/folders/', {
        name: folderName,
        project: projectId
      });
      
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
  
  // Event handlers remain the same
  const handleDragStart = (e, idx) => {
    dragItemIndex.current = idx;
    setDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = (e) => {
    // Keep the existing implementation
    // ...
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
    console.log(`Opening file with ID: ${fileId}`);
    // Implement file opening logic
  };

  const createProject = async (projectName) => {
    const response = await authAxios.post(`/api/projects/`, {
      name: projectName
    });
    
    await fetchProjects();
    
    return response.data;
  };
  
  // Add these new handler functions to pass to ProjectItem
  const handleAddFile = (projectId) => {
    setActiveProjectId(projectId);
    setFileModalOpen(true);
  };
  
  const handleAddFolder = (projectId) => {
    setActiveProjectId(projectId);
    setFolderModalOpen(true);
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
                <span className="flex-1 text-lg text-left">
                  {sec.title}
                  {sec.id === 'projects' && (
                    <button 
                      className="ml-2 px-2 text-sm bg-[#27004A] rounded-full hover:bg-purple-800 inline-flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
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
                      
                      {sec.items.length === 0 && !loading && !error && (
                        <div className="text-sm text-gray-300 p-2">No projects found. Create one to get started!</div>
                      )}
                      
                      {/* Use ProjectItem component here */}
                      {sec.items.map(project => (
                        <ProjectItem 
                          key={project.id}
                          project={project}
                          onToggleProject={toggleProjectExpand}
                          onFileClick={handleFileClick}
                          onToggleFolder={toggleFolderExpand}
                          onAddFile={handleAddFile}
                          onAddFolder={handleAddFolder}
                        />
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