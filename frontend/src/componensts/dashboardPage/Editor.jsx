import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';

export default function Editor() {
  const [content, setContent] = useState('% Start writing your LaTeX/Markdown here\n\n# Welcome to CoTeX\n\nThis is a markdown and LaTeX editor. You can write:\n\n## Mathematics\n\n$$E = mc^2$$\n\nOr inline math like $f(x) = x^2$\n\n## Code blocks\n\n```python\ndef hello_world():\n    print("Hello, CoTeX!")\n```\n\n## And more...');
  const [isResizing, setIsResizing] = useState(false);
  const resizableRef = useRef(null);
  const initialWidth = 50; // Starting at 50% width
  const [width, setWidth] = useState(initialWidth);
  const containerRef = useRef(null);

  const onChange = React.useCallback((value) => {
    setContent(value);
    // Here you could implement auto-saving or sync with backend
  }, []);

  // Add resize functionality
  const startResizing = React.useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (mouseMoveEvent) => {
      if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        // Calculate percentage based on mouse position relative to container
        const mouseXRelativeToContainer = mouseMoveEvent.clientX - containerRect.left;
        const newWidth = (mouseXRelativeToContainer / containerRect.width) * 100;
        
        // Limit to reasonable bounds (20% to 80%)
        setWidth(Math.min(Math.max(newWidth, 20), 80));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Custom theme with semi-transparent background
  const semiTransparentTheme = EditorView.theme({
    '&': {
      backgroundColor: 'rgba(20, 20, 30, 0.5) !important', // More opaque background
    },
    '.cm-scroller': {
      backgroundColor: 'transparent !important',
    },
    '.cm-content': {
      backgroundColor: 'transparent !important',
    },
    '.cm-line': {
      backgroundColor: 'transparent !important',
    },
    '.cm-gutters': {
      backgroundColor: 'rgba(0, 0, 0, 0.4) !important',
      borderRight: '1px solid rgba(255, 255, 255, 0.1) !important',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.07) !important',
    },
  });

  return (
    <div className="flex h-full" ref={containerRef}>
      {/* Editor container with semi-transparent background */}
      <div 
        ref={resizableRef}
        className="overflow-auto rounded-md shadow-lg"
        style={{ width: `${width}%` }}
      >
        <CodeMirror
          value={content}
          height="100%"
          extensions={[markdown(), semiTransparentTheme]}
          onChange={onChange}
          theme="dark"
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            autocompletion: true,
          }}
          style={{ fontSize: '16px' }}
          className="h-full"
        />
      </div>
      
      {/* Resize handle */}
      <div
        className="w-0.5 cursor-col-resize bg-purple-500 hover:bg-purple-300 transition-colors"
        onMouseDown={startResizing}
      />
      
      {/* This empty div takes up the remaining space */}
      <div className="flex-grow"></div>
    </div>
  );
}