import React, { useRef, useEffect } from 'react';
import Prism from 'prismjs';

export default function CodeBlockEditor({
  id,
  content, 
  lang, 
  isActive, 
  blockIndex,
  commonLanguages,
  searchHighlight,
  handleLineClick,
  updateBlockContent,
  updateBlockLanguage,
  toggleFold,
  foldedBlocks,
  handleKeyDown,
  handleBlur,
  adjustTextareaHeight,
  textareaRef
}) {
  const localTextareaRef = useRef(null);
  const actualRef = isActive ? textareaRef : localTextareaRef;
  const isFolded = foldedBlocks[id];
  
  useEffect(() => {
    if (isActive && actualRef.current) {
      adjustTextareaHeight(actualRef.current);
    }
  }, [isActive, content, adjustTextareaHeight]);
  
  if (isActive) {
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
            onChange={(e) => updateBlockLanguage(blockIndex, e.target.value)}
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
  
  // Static render
  return (
    <div
      key={id}
      className={`code-block-container ${searchHighlight ? 'search-result current-result' : ''}`}
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
