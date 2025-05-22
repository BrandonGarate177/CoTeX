import React, { useState, useEffect, useRef, useMemo } from "react";
import katex from "katex";
import 'katex/dist/katex.min.css';
import { nanoid } from 'nanoid';
import Prism from 'prismjs'; // Add this import
import 'prismjs/themes/prism-tomorrow.css'; // Or another theme
// Add common language support
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import './EditorStyles.css'

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
  const blockEditableTypes = ["line", "code", "math"];
  const [foldedBlocks, setFoldedBlocks] = useState({});

  // Improve the adjustTextareaHeight function to be more robust
  const adjustTextareaHeight = (textarea) => {
    if (!textarea) return;
    
    // Reset height to auto first to get accurate scrollHeight measurement
    textarea.style.height = 'auto';
    
    // Add a small buffer (e.g., 2px) to prevent scrollbars from appearing
    textarea.style.height = `${textarea.scrollHeight + 2}px`;
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

  // Add toggle fold function
  const toggleFold = (blockId) => {
    setFoldedBlocks(prev => ({
      ...prev,
      [blockId]: !prev[blockId]
    }));
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
  }, [currentIndex, blocks]);

  // Update the useEffect to also adjust height when the component mounts
  useEffect(() => {
    adjustTextareaHeight(textareaRef.current);
  }, [blocks[currentIndex]?.content, currentIndex]); // Add currentIndex as dependency

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

    // Add this new shortcut handler for code blocks
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
  };

  // click on a rendered line to start editing there
  const handleLineClick = (id) => {
    const index = blocks.findIndex(block => block.id === id);
    setCurrentIndex(index);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        className="editor"
        style={{
          lineHeight: "1.5",
          width: "100%",
          height: "100%",
          overflowY: "auto",
          color: "#fff",
          padding: "0 16px" // Add some padding for better readability
        }}
      >
        {blocks.map((block) => {
          const { id, type, content, lang } = block;

          // If this is the currently edited block
          if (id === blocks[currentIndex]?.id && type === "code") {
            return (
              <div key={id} className="code-block-container" style={{ position: 'relative' }}>
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

          if (id === blocks[currentIndex]?.id && type === "math") {
            return (
              <div key={id} className="math-block-container" style={{ position: 'relative' }}>
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

          if (id === blocks[currentIndex]?.id) {
            const isCode = type === "code";
            const isMath = type === "math";
            
            return (
              <textarea
                key={id}
                ref={textareaRef}
                value={content}
                onChange={(e) => updateBlockContent(currentIndex, e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onInput={() => adjustTextareaHeight(textareaRef.current)}
                style={{
                  width: "100%",
                  fontFamily: isCode || isMath ? "monospace" : "inherit",
                  padding: "4px",
                  backgroundColor: "#290C3B",
                  color: "#fff",
                  fontSize: content.startsWith('#') ? 
                    headerStyles[`h${content.match(/^#+/)[0].length}`]?.fontSize || 'inherit' : 
                    'inherit',
                  overflow: 'hidden',
                  resize: 'none',
                  minHeight: '24px', // Set a reasonable minimum height
                }}
              />
            );
          }

          // NEW: render a blank spacer for an empty line
          if (type === "line" && content === "") {
            return (
              <div
                key={id}
                style={{
                  height: "1em",     // adjust vertical gap here
                  cursor: "text",
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
                className="code-block-container"
                style={{ 
                  position: 'relative',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '8px',
                  marginTop: '8px',
                  border: '1px solid #444'
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
            );
          }
          
          if (type === "math") {
            return (
              <div
                key={id}
                className="math-block-container"
                style={{ 
                  position: 'relative',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '8px',
                  marginTop: '8px',
                  border: '1px solid #444'
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
          
          // Plain line
          return (
            <div key={id} style={{ position: 'relative' }}>
              <div
                onClick={() => handleLineClick(id)}
                style={{ 
                  cursor: "text",
                  ...(content.startsWith('#') ? 
                    headerStyles[`h${content.match(/^#+/)[0].length}`] || {} : 
                    {})
                }}
                dangerouslySetInnerHTML={{
                  __html: parseLine(content),
                }}
              />
              <div 
                style={{ 
                  position: 'absolute', 
                  right: '8px', 
                  top: '4px', 
                  display: 'none',
                  '.editor:hover &': { display: 'block' }
                }}
                className="block-actions"
              >
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
    </div>
  );
}