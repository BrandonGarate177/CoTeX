import React, { useState, useRef, useEffect } from 'react';

const initialSections = [
  {
    id: 'projects',
    title: 'Projects',
    content: 'Your projects will appear here',
    expanded: false,
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
  const dragItemIndex = useRef(null);
  const sectionRefs = useRef([]);

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

  return (
    <div className="flex flex-col h-screen w-[290px] bg-[#230B38] text-[#F7EBFD] font-['Source_Code_Pro']">
      {/* Header with Logo/Title */}
      <div className="px-4 py-4 text-2xl font-semibold">CoTeX</div>

      {/* Sections - Now with left alignment */}
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
                {/* Left aligned title */}
                <span className="flex-1 text-lg text-left">{sec.title}</span>
                <span
                  className={`text-2xl transform transition-transform duration-200 ${
                    sec.expanded ? 'rotate-90' : ''
                  }`}
                >
                  {'>'}
                </span>
              </button>

              {sec.expanded && (
                <div className="mt-1 bg-[#27004A] rounded px-3 py-2">
                  <p className="text-sm text-gray-300">{sec.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
