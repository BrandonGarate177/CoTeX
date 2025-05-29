import { useState, useEffect, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { parseLine, toBlocks } from '../utils/parser';
import markdownSyntaxHighlight from '../utils/syntaxHighlight';

export function useEditorLogic(content, onContentChange) {
  const [blocks, setBlocks] = useState(() => toBlocks(content.split('\n')));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [foldedBlocks, setFoldedBlocks] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const textareaRef = useRef(null);
  const editorRef = useRef(null);
  const searchInputRef = useRef(null);

  // all your effects (init on content change, autofocus, search logic, etc.)
  // and all your handlers (deleteBlock, insertBlockAfter, toggleFold, updateBlockContent, handleKeyDown, handleBlur…)

  // Example:
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

  // Add this function to your hook:

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
    
    // Implement more keyboard shortcuts from the original file as needed
    // Such as task list toggle, code blocks, math blocks, etc.
  };

  
  return {
    blocks,
    currentIndex,
    foldedBlocks,
    searchTerm,
    showSearch,
    searchResults,
    currentSearchIndex,
    textareaRef,
    editorRef,
    searchInputRef,
    setSearchTerm,
    setShowSearch,
    setCurrentSearchIndex,
    setCurrentIndex,
    updateBlockContent,
    updateBlockLanguage,
    toggleFold,
    toggleSearch,
    toggleTaskListItem,
    handleKeyDown,
    handleBlur,
    deleteBlock,
    insertBlockAfter,
    goToNextSearchResult,
    goToPrevSearchResult,
    createTaskList
  };
}
