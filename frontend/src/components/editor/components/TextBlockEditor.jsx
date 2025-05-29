import React from 'react';
import markdownSyntaxHighlight from '../utils/syntaxHighlight';

export default function TextBlockEditor({
  id,
  content, 
  isActive, 
  blockIndex,
  searchHighlight,
  headerStyles,
  handleLineClick,
  updateBlockContent,
  toggleTaskListItem,
  insertBlockAfter,
  deleteBlock,
  blocks,
  handleKeyDown,
  handleBlur,
  adjustTextareaHeight,
  textareaRef,
  parseLine
}) {
  if (isActive) {
    const isCode = false;
    const isMath = false;
    
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
          onChange={(e) => updateBlockContent(blockIndex, e.target.value)}
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
              headerStyles[`h${content.match(/^#+/)?.[0].length || 1}`]?.fontSize || 'inherit' : 
              'inherit',
            overflow: 'hidden',
            resize: 'none',
            minHeight: '24px',
            border: 'none',
            outline: 'none'
          }}
        />
        
        {/* Markdown syntax highlighting overlay */}
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '6px',
            pointerEvents: 'none',
            fontFamily: 'inherit',
            fontSize: content.startsWith('#') ? 
              headerStyles[`h${content.match(/^#+/)?.[0].length || 1}`]?.fontSize || 'inherit' : 
              'inherit',
            opacity: 0, // Hidden but preserves layout
            color: 'transparent'
          }}
          dangerouslySetInnerHTML={{ __html: markdownSyntaxHighlight(content) }}
        />
      </div>
    );
  }
  
  // Empty line
  if (content === "") {
    return (
      <div
        key={id}
        className={`empty-block ${searchHighlight ? 'search-result current-result' : ''}`}
        style={{
          height: "1.5em",
          cursor: "text",
          backgroundColor: searchHighlight ? 'rgba(255, 204, 0, 0.2)' : 'transparent',
          borderRadius: '4px',
          transition: 'background-color 0.3s'
        }}
        onClick={() => handleLineClick(id)}
      />
    );
  }
  
  // Render a task list item or a normal line
  return (
    <div 
      key={id} 
      className={`editor-block ${searchHighlight ? 'search-result current-result' : ''}`} 
      style={{ 
        position: 'relative',
        padding: '4px 0',
        borderRadius: '4px',
        backgroundColor: searchHighlight ? 'rgba(255, 204, 0, 0.1)' : 'transparent'
      }}
    >
      <div
        onClick={() => handleLineClick(id)}
        className={content.match(/^(\s*)- \[([ x])\]\s(.+)$/) ? 'task-list-item' : ''}
        style={{ 
          cursor: "text",
          ...(content.startsWith('#') ? 
            headerStyles[`h${content.match(/^#+/)?.[0].length || 1}`] || {} : 
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
          onClick={(e) => { 
            e.stopPropagation(); 
            insertBlockAfter(blocks.findIndex(b => b.id === id)); 
          }}
          style={{ 
            marginRight: '4px', 
            background: 'transparent', 
            border: 'none', 
            color: '#aaa', 
            cursor: 'pointer' 
          }}
        >
          +
        </button>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            deleteBlock(blocks.findIndex(b => b.id === id)); 
          }}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: '#aaa', 
            cursor: 'pointer' 
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
