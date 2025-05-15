import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

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
                        console.log("Create new project clicked");
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
                                  console.log(`Add file to project ${project.projectId}`);
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
                              
                              {/* Remove the separate New File button that was here before */}
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
    </div>
  );
}