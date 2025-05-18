import React, { useState, useEffect, useRef, useCallback } from 'react';


import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';


import {Markdown} from 'tiptap-markdown';


import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Document from '@tiptap/extension-document';
import Placeholder from '@tiptap/extension-placeholder';

import { common, createLowlight } from 'lowlight';
import { MathInline, MathBlock } from './extensions/MathInline';

import './EditorStyles.css';
import 'katex/dist/katex.min.css';

// Lowlight instance for code syntax highlighting
const lowlight = createLowlight(common);

export default function Editor() {
  const [width, setWidth] = useState(50); // Editor pane width (%)
  const [isResizing, setIsResizing] = useState(false);
  const [preview, setPreview] = useState('');
  const containerRef = useRef(null);

  // Initial markdown + LaTeX content
  const initialContent = `# Welcome to CoTeX

This is a markdown and LaTeX editor. You can write:

## Mathematics

$$E = mc^2$$

Or inline math like $f(x) = x^2$

## Code blocks

\`\`\`python
function helloWorld() {
  console.log("Hello, CoTeX!");
}
\`\`\`

## And more...
`;

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Document,
      Markdown,
      CodeBlockLowlight.configure({ lowlight }),
      MathInline,
      MathBlock,
      Placeholder.configure({ placeholder: 'Start writing your LaTeX/Markdown here...' }),
    ],
    content: initialContent,
    onCreate({ editor }) {
      setPreview(editor.getHTML());
    },
    onUpdate({ editor }) {
      setPreview(editor.getHTML());
    },
  });

  // Begin resizing
  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Handle mouse movements while resizing
  useEffect(() => {
    function onMouseMove(e) {
      if (!isResizing || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setWidth(Math.min(Math.max(percent, 20), 80));
    }
    function onMouseUp() {
      setIsResizing(false);
    }

    if (isResizing) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="flex h-full" ref={containerRef}>
      {/* Editor Pane */}
      <div
        className="overflow-auto rounded-md shadow-lg tiptap-container"
        style={{ width: `${width}%` }}
      >
        {/* Toolbar */}
        {editor && (
          <div className="tiptap-toolbar">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'is-active' : ''}
            >
              Bold
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'is-active' : ''}
            >
              Italic
            </button>
            <button onClick={() => editor.chain().focus().insertMathBlock().run()}>
              TeX Block
            </button>
            <button onClick={() => editor.chain().focus().insertMathInline().run()}>
              TeX Inline
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive('codeBlock') ? 'is-active' : ''}
            >
              Code Block
            </button>
          </div>
        )}

        {/* Editor Content */}
        <EditorContent editor={editor} className="tiptap-editor" />
      </div>

      {/* Resize Handle */}
      <div
        className="w-0.5 cursor-col-resize bg-purple-500 hover:bg-purple-300 transition-colors"
        onMouseDown={startResizing}
      />

      {/* Live Preview */}
      <div
        className="flex-grow p-4 overflow-auto rendered-preview"
        dangerouslySetInnerHTML={{ __html: preview }}
      />
    </div>
  );
}
