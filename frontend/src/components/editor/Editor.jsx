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
import './styles/EditorStyles.css';

// Import utilities
import markdownSyntaxHighlight from './utils/syntaxHighlight';
import { parseLine, toBlocks } from './utils/parser';

// Import configs
import { headerStyles } from './config/headerStyles';
import { commonLanguages } from './config/commonLanguages';

// Import components
import CodeBlockEditor from './components/CodeBlockEditor';
import MathBlockEditor from './components/MathBlockEditor';
import TextBlockEditor from './components/TextBlockEditor';
import SearchBar from './components/SearchBar';
import KeyboardShortcuts from './components/KeyboardShortcuts';

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
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchResults={searchResults}
          currentSearchIndex={currentSearchIndex}
          goToNextSearchResult={goToNextSearchResult}
          goToPrevSearchResult={goToPrevSearchResult}
          setShowSearch={setShowSearch}
          searchInputRef={searchInputRef}
        />
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
          const isActiveBlock = blockIndex === currentIndex;
          const searchHighlight = blockIndex === searchResults[currentSearchIndex];

          if (type === "code") {
            return (
              <CodeBlockEditor
                key={id}
                id={id}
                content={content}
                lang={lang}
                isActive={isActiveBlock}
                blockIndex={blockIndex}
                commonLanguages={commonLanguages}
                searchHighlight={searchHighlight}
                handleLineClick={handleLineClick}
                updateBlockContent={updateBlockContent}
                updateBlockLanguage={updateBlockLanguage}
                toggleFold={toggleFold}
                foldedBlocks={foldedBlocks}
                handleKeyDown={handleKeyDown}
                handleBlur={handleBlur}
                adjustTextareaHeight={adjustTextareaHeight}
                textareaRef={isActiveBlock ? textareaRef : null}
              />
            );
          }

          if (type === "math") {
            return (
              <MathBlockEditor
                key={id}
                id={id}
                content={content}
                isActive={isActiveBlock}
                blockIndex={blockIndex}
                searchHighlight={searchHighlight}
                handleLineClick={handleLineClick}
                updateBlockContent={updateBlockContent}
                toggleFold={toggleFold}
                foldedBlocks={foldedBlocks}
                handleKeyDown={handleKeyDown}
                handleBlur={handleBlur}
                adjustTextareaHeight={adjustTextareaHeight}
                textareaRef={isActiveBlock ? textareaRef : null}
              />
            );
          }

          // Text block / line
          return (
            <TextBlockEditor
              key={id}
              id={id}
              content={content}
              isActive={isActiveBlock}
              blockIndex={blockIndex}
              searchHighlight={searchHighlight}
              headerStyles={headerStyles}
              handleLineClick={handleLineClick}
              updateBlockContent={updateBlockContent}
              toggleTaskListItem={toggleTaskListItem}
              insertBlockAfter={insertBlockAfter}
              deleteBlock={deleteBlock}
              blocks={blocks}
              handleKeyDown={handleKeyDown}
              handleBlur={handleBlur}
              adjustTextareaHeight={adjustTextareaHeight}
              textareaRef={isActiveBlock ? textareaRef : null}
              parseLine={parseLine}
            />
          );
        })}
      </div>
      
      <KeyboardShortcuts />
    </div>
  );
}