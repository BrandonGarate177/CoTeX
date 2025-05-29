import React from 'react';

export default function SearchBar({
  searchTerm,
  setSearchTerm,
  searchResults,
  currentSearchIndex,
  goToNextSearchResult,
  goToPrevSearchResult,
  setShowSearch,
  searchInputRef
}) {
  return (
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
  );
}
