import React, { useState, useEffect, useRef } from "react";
import katex from "katex";
import 'katex/dist/katex.min.css';
import { nanoid } from 'nanoid';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import './EditorStyles.css';

// Define syntax highlighting for markdown in editor
const markdownSyntaxHighlight = (text) => {
  // Simple markdown syntax highlighting
  if (!text) return '';
  
  // Replace with regex for headings
  let html = text.replace(/^(#{1,6})\s+(.+)$/gm, '<span class="md-heading">$1 $2</span>');
  
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<span class="md-bold">**$1**</span>');
  
  // Italic
  html = html.replace(/\*(.+?)\*\*/g, '<span class="md-italic">*$1*</span>');
  
  // Inline code
  html = html.replace(/`(.+?)`/g, '<span class="md-code">`$1`</span>');
  
  // Lists
  html = html.replace(/^(\s*)([*\-+])\s(.+)$/gm, '$1<span class="md-list-item">$2 $3</span>');
  
  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<span class="md-link">[$1]($2)</span>');
  
  return html;
};

function parseLine(line){
  // Code block
  if(/^```/.test(line)){
    return `<pre><code>${line.replace(/^```/, '')}</code></pre>`;
  }

  // Math block
  if (/^\$\$/.test(line)) {
    return `<div class="math-block">${katex.renderToString(
      line.replace(/^\$\$|\$\$$/g, ''),
      { displayMode: true, throwOnError: false }
    )}</div>`;
  }

  // Headers
  const hMatch = line.match(/^(#{1,6})\s*(.+)/);
  if (hMatch){
    const level = hMatch[1].length;
    return `<h${level}>${hMatch[2]}</h${level}>`;
  }

  // Math INLINE
  line = line
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  // code INLINE
  line = line.replace(/`(.+?)`/g, '<code>$1</code>');
  
  // Task lists (Obsidian style)
  line = line.replace(/^\s*- \[ \]\s*(.+)$/g, '<div class="task-list-item"><input type="checkbox" disabled> $1</div>');
  line = line.replace(/^\s*- \[x\]\s*(.+)$/g, '<div class="task-list-item"><input type="checkbox" checked disabled> $1</div>');

  return `<p>${line}</p>`;
}

// Going to render each line separately
function toBlocks(lines) {
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1) code fence
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();  // e.g. ```js
      i++;
      const buffer = [];
      // collect until closing ```
      while (i < lines.length && !lines[i].startsWith("```")) {
        buffer.push(lines[i]);
        i++;
      }
      // skip the closing ```
      i++;
      blocks.push({ id: nanoid(), type: "code", lang, content: buffer.join("\n") });
      continue;
    }

    // 2) math fence
    if (line.startsWith("$$")) {
      i++;
      const buffer = [];
      // collect until closing $$
      while (i < lines.length && !lines[i].startsWith("$$")) {
        buffer.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ id: nanoid(), type: "math", content: buffer.join("\n") });
      continue;
    }

    // 3) plain line
    blocks.push({ id: nanoid(), type: "line", content: line });
    i++;
  }

  return blocks;
}

const headerStyles = {
  h1: { fontSize: '2em', fontWeight: 'bold', margin: '0.67em 0' },
  h2: { fontSize: '1.5em', fontWeight: 'bold', margin: '0.83em 0' },
  h3: { fontSize: '1.17em', fontWeight: 'bold', margin: '1em 0' },
  h4: { fontSize: '1em', fontWeight: 'bold', margin: '1.33em 0' },
  h5: { fontSize: '0.83em', fontWeight: 'bold', margin: '1.67em 0' },
  h6: { fontSize: '0.67em', fontWeight: 'bold', margin: '2.33em 0' },
};

const commonLanguages = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'c', name: 'C' },
  { id: 'cpp', name: 'C++' },
  { id: 'bash', name: 'Bash' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'markdown', name: 'Markdown' },
  { id: 'sql', name: 'SQL' },
  { id: 'json', name: 'JSON' },
  { id: 'text', name: 'Plain Text' },
];

export default function Editor({ content = "", onContentChange }) {
  const [blocks, setBlocks] = useState(() => toBlocks(content.split("\n")));
  const [currentIndex, setCurrentIndex] = useState(0);
  const textareaRef = useRef(null);
  const editorRef = useRef(null);
  const blockEditableTypes = ["line", "code", "math"];
  const [foldedBlocks, setFoldedBlocks] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const searchInputRef = useRef(null);

  // Improve the adjustTextareaHeight function to be more robust
  const adjustTextareaHeight = (textarea) => {
    if (!textarea) return;
    
    // Reset height to auto first to get accurate scrollHeight measurement
    textarea.style.height = 'auto';
    
    // Add a small buffer (e.g., 2px) to prevent scrollbars from appearing
    textarea.style.height = `${textarea.scrollHeight + 2}px`;
  };

  // Scrolling behavior to ensure active block is visible
  const scrollToActiveBlock = (smooth = true) => {
    if (!editorRef.current) return;
    
    const activeElement = document.querySelector('.active-block');
    if (activeElement) {
      const container = editorRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();
      
      // Check if the active element is not fully visible
      if (activeRect.top < containerRect.top || activeRect.bottom > containerRect.bottom) {
        activeElement.scrollIntoView({
          block: 'center',
          behavior: smooth ? 'smooth' : 'auto'
        });
      }
    }
  };

  // Add these functions to your Editor component
  const deleteBlock = (index) => {
    if (blocks.length <= 1) return; // Don't delete the last block
    
    setBlocks(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
    
    setCurrentIndex(Math.min(index, blocks.length - 2));
  };

  const insertBlockAfter = (index) => {
    setBlocks(prev => {
      const copy = [...prev];
      copy.splice(index + 1, 0, { id: nanoid(), type: 'line', content: '' });
      return copy;
    });
    
    setCurrentIndex(index + 1);
  };

  // Add toggle fold function with animation
  const toggleFold = (blockId) => {
    setFoldedBlocks(prev => ({
      ...prev,
      [blockId]: !prev[blockId]
    }));
  };

  // Add task list toggle
  const toggleTaskListItem = (index) => {
    const block = blocks[index];
    if (block.type !== "line") return;
    
    const content = block.content;
    if (content.match(/^(\s*)- \[ \]\s(.+)$/)) {
      // Unchecked to checked
      updateBlockContent(index, content.replace(/^(\s*)- \[ \]\s(.+)$/, '$1- [x] $2'));
    } else if (content.match(/^(\s*)- \[x\]\s(.+)$/)) {
      // Checked to unchecked
      updateBlockContent(index, content.replace(/^(\s*)- \[x\]\s(.+)$/, '$1- [ ] $2'));
    }
  };

  // initialize if content prop changes
  useEffect(() => {
    setBlocks(toBlocks(content.split("\n")));
  }, [content]);

  // focus the textarea whenever currentIndex changes
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.focus();
      // place cursor at end
      if (blocks[currentIndex]?.type === "line") {
        const len = blocks[currentIndex]?.content?.length || 0;
        ta.setSelectionRange(len, len);
      }
    }
    
    // Scroll to make active block visible
    scrollToActiveBlock();
  }, [currentIndex, blocks]);

  // Update the useEffect to also adjust height when the component mounts
  useEffect(() => {
    adjustTextareaHeight(textareaRef.current);
  }, [blocks[currentIndex]?.content, currentIndex]); 

  // Search functionality
  useEffect(() => {
    if (searchTerm.length > 1) {
      const results = [];
      
      blocks.forEach((block, idx) => {
        if (block.content.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push(idx);
        }
      });
      
      setSearchResults(results);
      setCurrentSearchIndex(0);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, blocks]);

  // Jump to search result when currentSearchIndex changes
  useEffect(() => {
    if (searchResults.length > 0 && currentSearchIndex >= 0) {
      const blockIndex = searchResults[currentSearchIndex];
      setCurrentIndex(blockIndex);
    }
  }, [currentSearchIndex, searchResults]);

  // Focus search input when search is shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // utility to update the current block content
  const updateBlockContent = (idx, newContent) => {
    setBlocks((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], content: newContent };
      return copy;
    });
  };

  // Add this function to update the language of a code block
  const updateBlockLanguage = (blockIndex, newLang) => {
    setBlocks(prev => {
      const copy = [...prev];
      copy[blockIndex] = { 
        ...copy[blockIndex], 
        lang: newLang 
      };
      return copy;
    });
  };

  // when the user blurs out of textarea, notify parent
  const handleBlur = () => {
    // Convert blocks back to text
    const lines = [];
    blocks.forEach(block => {
      if (block.type === "code") {
        lines.push(`\`\`\`${block.lang || ""}`);
        lines.push(...block.content.split("\n"));
        lines.push("```");
      } else if (block.type === "math") {
        lines.push("$$");
        lines.push(...block.content.split("\n"));
        lines.push("$$");
      } else {
        lines.push(block.content);
      }
    });
    onContentChange?.(lines.join("\n"));
  };

  // Create a task list
  const createTaskList = () => {
    if (blocks[currentIndex]?.type !== 'line') return;
    
    updateBlockContent(currentIndex, '- [ ] New task');
  };

  // Obsidian-style search handling
  const toggleSearch = () => {
    setShowSearch(!showSearch);
    setSearchTerm('');
  };

  const goToNextSearchResult = () => {
    if (searchResults.length === 0) return;
    
    setCurrentSearchIndex((prev) => 
      prev >= searchResults.length - 1 ? 0 : prev + 1
    );
  };

  const goToPrevSearchResult = () => {
    if (searchResults.length === 0) return;
    
    setCurrentSearchIndex((prev) => 
      prev <= 0 ? searchResults.length - 1 : prev - 1
    );
  };

  // keyboard navigation and splitting logic
  const handleKeyDown = (e) => {
    const ta = textareaRef.current;
    if (!ta) return;

    // Check if currentIndex is valid and get the current block
    if (currentIndex < 0 || currentIndex >= blocks.length) {
      console.error("Invalid currentIndex:", currentIndex);
      return;
    }

    const currentBlock = blocks[currentIndex];
    if (!currentBlock) {
      console.error("Current block is undefined. Index:", currentIndex, "Blocks:", blocks);
      return;
    }
    
    // Search keyboard shortcut (Ctrl+F or Cmd+F)
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      toggleSearch();
      return;
    }
    
    // Escape to exit search
    if (e.key === 'Escape' && showSearch) {
      e.preventDefault();
      setShowSearch(false);
      return;
    }
    
    // Tab → insert a tab character
    if (e.key === "Tab") {
      e.preventDefault();
      const pos = ta.selectionStart;
      const val = ta.value;
      updateBlockContent(currentIndex, val.slice(0, pos) + "\t" + val.slice(pos));
      // restore cursor
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = pos + 1;
      }, 0);
      return;
    }
    
    const val = ta.value;
    const pos = ta.selectionStart;
    
    // Obsidian-style task list toggle (Ctrl+Enter)
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && currentBlock.type === 'line') {
      e.preventDefault();
      const content = currentBlock.content;
      
      if (content.match(/^(\s*)- \[ \]\s(.+)$/)) {
        // Toggle unchecked to checked
        updateBlockContent(currentIndex, content.replace(/^(\s*)- \[ \]\s(.+)$/, '$1- [x] $2'));
        return;
      } else if (content.match(/^(\s*)- \[x\]\s(.+)$/)) {
        // Toggle checked to unchecked
        updateBlockContent(currentIndex, content.replace(/^(\s*)- \[x\]\s(.+)$/, '$1- [ ] $2'));
        return;
      }
    }
    
    // Add Shift+Enter handling for text blocks
    if (e.key === "Enter" && e.shiftKey && currentBlock.type === "line") {
      e.preventDefault();
      
      // Split content at cursor position
      const before = val.slice(0, pos);
      const after = val.slice(pos);
      
      // Update current block with content before cursor
      updateBlockContent(currentIndex, before);
      
      // Insert a new line block after current one
      setBlocks(prev => {
        const copy = [...prev];
        copy.splice(currentIndex + 1, 0, { id: nanoid(), type: "line", content: after });
        return copy;
      });
      
      // Move cursor to the new block
      setCurrentIndex(currentIndex + 1);
      return;
    }
    
    // Obsidian-style "continue list" behavior
    if (e.key === "Enter" && !e.shiftKey && currentBlock.type === "line") {
      const listMatch = currentBlock.content.match(/^(\s*)([-*+]|\d+\.)\s(.*)$/);
      const taskMatch = currentBlock.content.match(/^(\s*)- \[([ x])\]\s(.*)$/);
      
      if ((listMatch || taskMatch) && pos === val.length) {
        e.preventDefault();
        
        if (taskMatch && taskMatch[3] === '') {
          // Empty task item - remove it
          updateBlockContent(currentIndex, '');
          return;
        } else if (listMatch && listMatch[3] === '') {
          // Empty list item - remove it
          updateBlockContent(currentIndex, '');
          return;
        }
        
        // Continue the list with a new item
        const newContent = taskMatch 
          ? `${taskMatch[1]}- [ ] ` 
          : `${listMatch[1]}${listMatch[2]} `;
          
        setBlocks(prev => {
          const copy = [...prev];
          copy.splice(currentIndex + 1, 0, { id: nanoid(), type: "line", content: newContent });
          return copy;
        });
        
        setCurrentIndex(currentIndex + 1);
        return;
      }
    }
    
    // Handle code fence creation
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      currentBlock.type === "line" &&
      /^\s*```(.*)$/.test(currentBlock.content)
    ) {
      e.preventDefault();
      const lang = (currentBlock.content.match(/^\s*```(.*)$/)[1] || "").trim();
      
      setBlocks(prev => {
        const copy = [...prev];
        // Replace the fence line with a code block structure
        copy.splice(
          currentIndex,
          1,
          { id: nanoid(), type: "line", content: `\`\`\`${lang}` },
          { id: nanoid(), type: "code", lang, content: "" },
          { id: nanoid(), type: "line", content: "```" }
        );
        return copy;
      });
      
      // Move to the content block
      setCurrentIndex(currentIndex + 1);
      return;
    }
    
    // Handle math fence creation
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      currentBlock.type === "line" &&
      /^\s*\$\$(.*)$/.test(currentBlock.content)
    ) {
      e.preventDefault();
      
      setBlocks(prev => {
        const copy = [...prev];
        copy.splice(
          currentIndex,
          1,
          { id: nanoid(), type: "line", content: "$$" },
          { id: nanoid(), type: "math", content: "" },
          { id: nanoid(), type: "line", content: "$$" }
        );
        return copy;
      });
      
      setCurrentIndex(currentIndex + 1);
      return;
    }
    
    // Shift+Enter to exit a code/math block
    if (
      e.key === "Enter" &&
      e.shiftKey &&
      (currentBlock.type === "code" || currentBlock.type === "math")
    ) {
      e.preventDefault();
      
      // Find the closing fence block
      const closingBlockIndex = currentIndex + 1;
      
      // Insert an empty line after the closing fence
      setBlocks(prev => {
        const copy = [...prev];
        copy.splice(closingBlockIndex + 1, 0, { id: nanoid(), type: "line", content: "" });
        return copy;
      });
      
      // Move focus to the new empty line
      setCurrentIndex(closingBlockIndex + 1);
      return;
    }
    
    // Regular Enter within a code/math block should just insert a newline
    if (e.key === "Enter" && (currentBlock.type === "code" || currentBlock.type === "math")) {
      // Let the default behavior happen - textareas handle newlines naturally
      return;
    }
    
    // For normal lines, also let the textarea handle the newline
    if (e.key === "Enter" && currentBlock.type === "line") {
      // Don't prevent default - let the textarea handle the newline
      return;
    }
    
    // ↑: move up if at start
    if (e.key === "ArrowUp" && pos === 0 && currentIndex > 0) {
      e.preventDefault();
      setCurrentIndex((i) => i - 1);
      return;
    }

    // ↓: move down if at end
    if (e.key === "ArrowDown" && pos === val.length && currentIndex < blocks.length - 1) {
      e.preventDefault();
      setCurrentIndex((i) => i + 1);
      return;
    }

    // Obsidian-style Command/Ctrl + [ for indent and Command/Ctrl + ] for outdent
    if (currentBlock.type === "line" && (e.ctrlKey || e.metaKey)) {
      if (e.key === '[') {
        e.preventDefault();
        updateBlockContent(currentIndex, '  ' + currentBlock.content);
        return;
      }
      
      if (e.key === ']' && currentBlock.content.startsWith('  ')) {
        e.preventDefault();
        updateBlockContent(currentIndex, currentBlock.content.substring(2));
        return;
      }
    }

    // Command/Ctrl + Shift + K to create a code block
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'k') {
      e.preventDefault();
      
      // Current position
      const pos = ta.selectionStart;
      const val = ta.value;
      const before = val.slice(0, pos);
      const after = val.slice(pos);
      
      // If we're in a line block, replace it with a code structure
      if (currentBlock.type === 'line') {
        setBlocks(prev => {
          const copy = [...prev];
          // Replace current block
          copy.splice(
            currentIndex,
            1,
            { id: nanoid(), type: "line", content: before },
            { id: nanoid(), type: "code", lang: "javascript", content: "" },
            { id: nanoid(), type: "line", content: after }
          );
          return copy;
        });
        
        // Move to the code block
        setCurrentIndex(currentIndex + 1);
      }
      return;
    }
    
    // Command/Ctrl + Shift + M to create a math block (Obsidian-style)
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'm') {
      e.preventDefault();
      
      const pos = ta.selectionStart;
      const val = ta.value;
      const before = val.slice(0, pos);
      const after = val.slice(pos);
      
      if (currentBlock.type === 'line') {
        setBlocks(prev => {
          const copy = [...prev];
          copy.splice(
            currentIndex,
            1,
            { id: nanoid(), type: "line", content: before },
            { id: nanoid(), type: "math", content: "" },
            { id: nanoid(), type: "line", content: after }
          );
          return copy;
        });
        
        setCurrentIndex(currentIndex + 1);
      }
      return;
    }
    
    // Command/Ctrl + Shift + T to create a task item (Obsidian-style)
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 't') {
      e.preventDefault();
      
      if (currentBlock.type === 'line') {
        createTaskList();
      }
      return;
    }
  };

  // click on a rendered line to start editing there
  const handleLineClick = (id) => {
    const index = blocks.findIndex(block => block.id === id);
    setCurrentIndex(index);
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Search bar - Obsidian style */}
      {showSearch && (
        <div className="search-bar" style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          backgroundColor: '#1e1e1e',
          padding: '8px 12px',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          width: '70%',
          maxWidth: '400px'
        }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                goToNextSearchResult();
              } else if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                goToPrevSearchResult();
              }
            }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'white',
              width: '100%',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <div className="search-info" style={{
            display: 'flex',
            alignItems: 'center',
            marginLeft: '10px',
            color: '#aaa',
            fontSize: '12px'
          }}>
            {searchResults.length > 0 ? (
              <>
                <span>{currentSearchIndex + 1}/{searchResults.length}</span>
                <button 
                  onClick={goToPrevSearchResult}
                  style={{ background: 'none', border: 'none', color: '#aaa', margin: '0 4px', cursor: 'pointer' }}
                >
                  ↑
                </button>
                <button 
                  onClick={goToNextSearchResult}
                  style={{ background: 'none', border: 'none', color: '#aaa', margin: '0 4px', cursor: 'pointer' }}
                >
                  ↓
                </button>
              </>
            ) : searchTerm.length > 1 ? (
              <span>No results</span>
            ) : null}
            <button 
              onClick={() => setShowSearch(false)}
              style={{ background: 'none', border: 'none', color: '#aaa', marginLeft: '8px', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div
        ref={editorRef}
        className="editor obsidian-style"
        style={{
          lineHeight: "1.5",
          width: "100%",
          height: "100%",
          overflowY: "auto",  // Important: allows scrolling
          overflowX: "hidden",
          color: "#fff",
          padding: "0 16px",
          position: "relative",
          flex: 1
        }}
      >
        {/* Blocks rendering */}
        {blocks.map((block, blockIndex) => {
          const { id, type, content, lang } = block;
          const isActiveBlock = id === blocks[currentIndex]?.id;

          // If this is the currently edited block
          if (isActiveBlock && type === "code") {
            return (
              <div key={id} className="code-block-container active-block" style={{ position: 'relative' }}>
                <div className="code-block-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#1e1e1e',
                  padding: '4px 8px',
                  borderTopLeftRadius: '4px',
                  borderTopRightRadius: '4px',
                  borderBottom: '1px solid #444'
                }}>
                  <select
                    value={lang || 'text'}
                    onChange={(e) => updateBlockLanguage(currentIndex, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#ccc',
                      border: 'none',
                      fontSize: '0.8em',
                      cursor: 'pointer'
                    }}
                  >
                    {commonLanguages.map(language => (
                      <option key={language.id} value={language.id}>
                        {language.name}
                      </option>
                    ))}
                  </select>
                  <span style={{ color: '#999', fontSize: '0.7em' }}>
                    Press Shift+Enter to exit
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => updateBlockContent(currentIndex, e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    onInput={() => adjustTextareaHeight(textareaRef.current)}
                    style={{
                      width: "100%",
                      fontFamily: "monospace",
                      padding: "8px",
                      backgroundColor: "#1e1e1e",
                      color: "#fff",
                      border: "none",
                      overflow: 'hidden',
                      resize: 'none',
                      minHeight: '100px'
                    }}
                  />
                  {content && (
                    <div className="live-preview" style={{
                      padding: '8px',
                      backgroundColor: '#2a2a2a',
                      borderTop: '1px solid #444',
                      borderBottomLeftRadius: '4px',
                      borderBottomRightRadius: '4px'
                    }}>
                      <pre style={{ margin: 0, width: '100%', overflow: 'auto' }}>
                        <code 
                          className={`language-${lang || 'text'}`}
                          dangerouslySetInnerHTML={{
                            __html: Prism.highlight(
                              content,
                              Prism.languages[lang] || Prism.languages.text,
                              lang || 'text'
                            )
                          }}
                        />
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (isActiveBlock && type === "math") {
            return (
              <div key={id} className="math-block-container active-block" style={{ position: 'relative' }}>
                <div className="math-block-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#1e1e1e',
                  padding: '4px 8px',
                  borderTopLeftRadius: '4px',
                  borderTopRightRadius: '4px',
                  borderBottom: '1px solid #444'
                }}>
                  <span style={{ color: '#ccc', fontSize: '0.8em' }}>Math</span>
                  <span style={{ color: '#999', fontSize: '0.7em' }}>
                    Press Shift+Enter to exit
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => updateBlockContent(currentIndex, e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    onInput={() => adjustTextareaHeight(textareaRef.current)}
                    style={{
                      width: "100%",
                      fontFamily: "monospace",
                      padding: "8px",
                      backgroundColor: "#1e1e1e",
                      color: "#fff",
                      border: "none",
                      overflow: 'hidden',
                      resize: 'none',
                      minHeight: '60px'
                    }}
                  />
                  {content && (
                    <div className="math-preview" style={{
                      padding: '12px',
                      backgroundColor: '#2a2a2a',
                      borderTop: '1px solid #444',
                      borderBottomLeftRadius: '4px',
                      borderBottomRightRadius: '4px',
                      textAlign: 'center'
                    }}>
                      <div dangerouslySetInnerHTML={{
                        __html: katex.renderToString(content, {
                          displayMode: true,
                          throwOnError: false,
                        })
                      }} />
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (isActiveBlock) {
            const isCode = type === "code";
            const isMath = type === "math";
            
            // Enhance text blocks with Obsidian-style editor features
            return (
              <div 
                key={id} 
                className="text-block-container active-block"
                style={{
                  position: 'relative',
                  padding: '2px 0',
                  backgroundColor: 'rgba(55, 21, 95, 0.3)',
                  borderRadius: '4px'
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => updateBlockContent(currentIndex, e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  onInput={() => adjustTextareaHeight(textareaRef.current)}
                  style={{
                    width: "100%",
                    fontFamily: isCode || isMath ? "monospace" : "inherit",
                    padding: "4px 6px",
                    backgroundColor: "transparent",
                    color: "#fff",
                    fontSize: content.startsWith('#') ? 
                      headerStyles[`h${content.match(/^#+/)[0].length}`]?.fontSize || 'inherit' : 
                      'inherit',
                    overflow: 'hidden',
                    resize: 'none',
                    minHeight: '24px',
                    border: 'none',
                    outline: 'none'
                  }}
                />
                
                {/* Markdown syntax highlighting overlay */}
                {type === "line" && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '6px',
                      pointerEvents: 'none',
                      fontFamily: 'inherit',
                      fontSize: content.startsWith('#') ? 
                        headerStyles[`h${content.match(/^#+/)[0].length}`]?.fontSize || 'inherit' : 
                        'inherit',
                      opacity: 0, // Hidden but preserves layout
                      color: 'transparent'
                    }}
                    dangerouslySetInnerHTML={{ __html: markdownSyntaxHighlight(content) }}
                  />
                )}
              </div>
            );
          }

          // Render a blank spacer for an empty line
          if (type === "line" && content === "") {
            return (
              <div
                key={id}
                className={`empty-block ${blockIndex === searchResults[currentSearchIndex] ? 'search-result current-result' : ''}`}
                style={{
                  height: "1.5em",
                  cursor: "text",
                  backgroundColor: blockIndex === searchResults[currentSearchIndex] ? 'rgba(255, 204, 0, 0.2)' : 'transparent',
                  borderRadius: '4px',
                  transition: 'background-color 0.3s'
                }}
                onClick={() => handleLineClick(id)}
              />
            );
          }
          
          // Static renders for non-active blocks
          if (type === "code") {
            const isFolded = foldedBlocks[id];
            
            return (
              <div
                key={id}
                className={`code-block-container ${blockIndex === searchResults[currentSearchIndex] ? 'search-result current-result' : ''}`}
                style={{ 
                  position: 'relative',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '8px',
                  marginTop: '8px',
                  border: '1px solid #444',
                  backgroundColor: blockIndex === searchResults[currentSearchIndex] ? 'rgba(255, 204, 0, 0.1)' : 'transparent'
                }}
              >
                <div className="code-block-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#1e1e1e',
                  padding: '4px 8px',
                  borderBottom: isFolded ? 'none' : '1px solid #444'
                }}>
                  <span style={{ color: '#aaa', fontSize: '0.8em' }}>
                    {commonLanguages.find(l => l.id === lang)?.name || 'Plain Text'}
                  </span>
                  <div className="code-block-actions" style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFold(id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#aaa',
                        cursor: 'pointer',
                        fontSize: '0.8em'
                      }}
                      title={isFolded ? "Expand" : "Collapse"}
                    >
                      {isFolded ? "+" : "-"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(content);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#aaa',
                        cursor: 'pointer',
                        fontSize: '0.8em'
                      }}
                      title="Copy code"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    maxHeight: isFolded ? '0' : '500px', 
                    transition: 'max-height 0.3s ease',
                    overflow: 'hidden'
                  }}
                >
                  {!isFolded && (
                    <div
                      onClick={() => handleLineClick(id)}
                      style={{ cursor: "text", padding: '8px', backgroundColor: '#1e1e1e' }}
                    >
                      <pre style={{ margin: 0, width: '100%', overflow: 'auto' }}>
                        <code 
                          className={`language-${lang || 'text'}`}
                          dangerouslySetInnerHTML={{
                            __html: content ? Prism.highlight(
                              content,
                              Prism.languages[lang] || Prism.languages.text,
                              lang || 'text'
                            ) : "\u200B"
                          }}
                        />
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          }
          
          if (type === "math") {
            return (
              <div
                key={id}
                className={`math-block-container ${blockIndex === searchResults[currentSearchIndex] ? 'search-result current-result' : ''}`}
                style={{ 
                  position: 'relative',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '8px',
                  marginTop: '8px',
                  border: '1px solid #444',
                  backgroundColor: blockIndex === searchResults[currentSearchIndex] ? 'rgba(255, 204, 0, 0.1)' : 'transparent'
                }}
              >
                <div className="math-block-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#1e1e1e',
                  padding: '4px 8px',
                  borderBottom: '1px solid #444'
                }}>
                  <span style={{ color: '#aaa', fontSize: '0.8em' }}>Math</span>
                  <div className="math-block-actions" style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(content);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#aaa',
                        cursor: 'pointer',
                        fontSize: '0.8em'
                      }}
                      title="Copy math"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div
                  onClick={() => handleLineClick(id)}
                  style={{ 
                    cursor: "text", 
                    padding: '12px', 
                    backgroundColor: '#1e1e1e', 
                    textAlign: 'center'
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      content.trim() === ""
                        ? "&nbsp;"
                        : katex.renderToString(content, {
                            displayMode: true,
                            throwOnError: false,
                          }),
                  }}
                />
              </div>
            );
          }
          
          // Improved Obsidian-style plain line with task list support
          return (
            <div 
              key={id} 
              className={`editor-block ${blockIndex === searchResults[currentSearchIndex] ? 'search-result current-result' : ''}`} 
              style={{ 
                position: 'relative',
                padding: '4px 0',
                borderRadius: '4px',
                backgroundColor: blockIndex === searchResults[currentSearchIndex] ? 'rgba(255, 204, 0, 0.1)' : 'transparent'
              }}
            >
              <div
                onClick={() => handleLineClick(id)}
                className={content.match(/^(\s*)- \[([ x])\]\s(.+)$/) ? 'task-list-item' : ''}
                style={{ 
                  cursor: "text",
                  ...(content.startsWith('#') ? 
                    headerStyles[`h${content.match(/^#+/)[0].length}`] || {} : 
                    {}),
                  position: 'relative',
                  padding: '2px 0'
                }}
              >
                {/* Task list checkbox rendered separately for interactivity */}
                {content.match(/^(\s*)- \[([ x])\]\s(.+)$/) ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <input
                      type="checkbox"
                      checked={content.includes('[x]')}
                      onChange={() => toggleTaskListItem(blockIndex)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        marginRight: '6px', 
                        marginTop: '3px',
                        cursor: 'pointer'
                      }}
                    />
                    <div
                      dangerouslySetInnerHTML={{
                        __html: parseLine(content.replace(/^(\s*)- \[([ x])\]\s/, '')),
                      }}
                      style={{
                        textDecoration: content.includes('[x]') ? 'line-through' : 'none',
                        color: content.includes('[x]') ? '#aaa' : 'inherit',
                        flexGrow: 1
                      }}
                    />
                  </div>
                ) : (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: parseLine(content),
                    }}
                  />
                )}
              </div>
              
              <div className="block-actions">
                <button 
                  onClick={(e) => { e.stopPropagation(); insertBlockAfter(blocks.findIndex(b => b.id === id)); }}
                  style={{ marginRight: '4px', background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}
                >
                  +
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteBlock(blocks.findIndex(b => b.id === id)); }}
                  style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Keyboard shortcuts help tooltip - show when editor is focused */}
      <div className="keyboard-shortcuts" style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        color: '#999',
        fontSize: '12px',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: '4px 8px',
        borderRadius: '4px',
        pointerEvents: 'none'
      }}>
        Ctrl+F: Search | Ctrl+Shift+T: Task | Ctrl+[/]: Indent/Outdent
      </div>
    </div>
  );
}