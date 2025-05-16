import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

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

// Add a FileModal component
function FileModal({ isOpen, onClose, onSubmit, projectId }) {
  const [fileName, setFileName] = useState('');
  const [isMainFile, setIsMainFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await onSubmit(projectId, fileName, isMainFile);
      setFileName('');
      setIsMainFile(false);
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

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the API URL, falling back to default if not set
      const apiUrl = process.env.REACT_APP_API_URL || '';
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }
      
      // Get projects from the API
      const response = await axios.get(`${apiUrl}/api/projects/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Log the full response structure for debugging
      console.log('API response:', response);
      console.log('Response data type:', typeof response.data);
      console.log('Response data:', response.data);
      
      // Handle different response formats
      let projectsArray = [];
      if (Array.isArray(response.data)) {
        // If response.data is already an array
        projectsArray = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // If response.data is an object with results property (common DRF pattern)
        if (Array.isArray(response.data.results)) {
          projectsArray = response.data.results;
        } else {
          // Try to convert the object to an array if possible
          projectsArray = Object.values(response.data);
        }
      }
      
      // Make sure projectsArray is actually an array before proceeding
      if (!Array.isArray(projectsArray)) {
        console.error('Could not extract projects array from response:', response.data);
        throw new Error('Unexpected API response format');
      }
      
      // Update the projects section with the fetched data
      setSections(prevSections => {
        return prevSections.map(section => {
          if (section.id === 'projects') {
            // Map the API response to our UI structure
            const projectItems = projectsArray.map(project => ({
              id: `project-${project.id}`,
              type: 'project',
              projectId: project.id,
              title: project.name,
              expanded: false,
              items: (project.files || []).map(file => ({
                id: `file-${file.id}`,
                type: 'file',
                fileId: file.id,
                title: file.name || file.filename || 'Unnamed file',
                isMain: !!file.is_main
              }))
            }));
            
            return {
              ...section,
              items: projectItems
            };
          }
          return section;
        });
      });
    } catch (err) {
      console.error('Failed to fetch projects:', err);
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

  const handleFileClick = (fileId) => {
    // You can implement file selection/opening logic here
    console.log(`Opening file with ID: ${fileId}`);
  };

  // Add createProject function
  const createProject = async (projectName) => {
    const apiUrl = process.env.REACT_APP_API_URL || '';
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Not authenticated. Please log in again.');
    }
    
    const response = await axios.post(`${apiUrl}/api/projects/`, 
      { name: projectName },
      { 
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    // After successful creation, refresh projects
    await fetchProjects();
    
    return response.data;
  };

  // Update the createFile function
  const createFile = async (projectId, fileName, isMain) => {
    const apiUrl = process.env.REACT_APP_API_URL || '';
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Not authenticated. Please log in again.');
    }
    
    console.log('Creating file with data:', { 
      name: fileName,
      content: `% ${fileName}\n% Created in CoTeX\n\n\\documentclass{article}\n\n\\begin{document}\n\nYour content here\n\n\\end{document}`,
      project: projectId,
      is_main: isMain 
    });
    
    try {
      // Make sure to use the correct endpoint - notice it's files/ not file/
      const response = await axios.post(`${apiUrl}/api/files/files/`, 
        { 
          name: fileName,
          content: `% ${fileName}\n% Created in CoTeX\n\n\\documentclass{article}\n\n\\begin{document}\n\nYour content here\n\n\\end{document}`,
          project: projectId,
          is_main: isMain 
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // After successful creation, refresh projects to show the new file
      await fetchProjects();
      
      return response.data;
    } catch (error) {
      console.error('Error creating file:', error.response?.data || error);
      // Re-throw with more details for better error handling
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.error || 
        error.message || 
        'Failed to create file'
      );
    }
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
                              {/* Add New File button next to project title */}
                              <button 
                                className="ml-2 px-1.5 text-xs bg-[#27004A] rounded-full hover:bg-purple-800 inline-flex items-center justify-center"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent toggling the project expansion
                                  setActiveProjectId(project.projectId);
                                  setFileModalOpen(true);
                                }}
                              >
                                +
                              </button>
                            </span>
                            <span
                              className={`text-xl transform transition-transform duration-200 ${
                                project.expanded ? 'rotate-90' : ''
                              }`}
                            >
                              {'>'}
                            </span>
                          </button>
                          
                          {/* Files for this Project */}
                          {project.expanded && (
                            <div className="ml-4 mt-1">
                              {/* Files List */}
                              {project.items.length === 0 ? (
                                <div className="text-sm text-gray-300 px-3 py-1">No files in this project</div>
                              ) : (
                                project.items.map(file => (
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
      
      {/* File Creation Modal */}
      <FileModal 
        isOpen={fileModalOpen}
        onClose={() => setFileModalOpen(false)}
        onSubmit={createFile}
        projectId={activeProjectId}
      />
    </div>
  );
}