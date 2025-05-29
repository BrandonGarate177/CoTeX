import React, { useRef } from 'react';
import katex from 'katex';

export default function MathBlockEditor({
  id,
  content, 
  isActive, 
  blockIndex,
  searchHighlight,
  handleLineClick,
  updateBlockContent,
  toggleFold,
  foldedBlocks,
  handleKeyDown,
  handleBlur,
  adjustTextareaHeight,
  textareaRef
}) {
  const localTextareaRef = useRef(null);
  
  if (isActive) {
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
            onChange={(e) => updateBlockContent(blockIndex, e.target.value)}
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
  
  return (
    <div
      key={id}
      className={`math-block-container ${searchHighlight ? 'search-result current-result' : ''}`}
      style={{ 
        position: 'relative',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '8px',
        marginTop: '8px',
        border: '1px solid #444',
        backgroundColor: searchHighlight ? 'rgba(255, 204, 0, 0.1)' : 'transparent'
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
