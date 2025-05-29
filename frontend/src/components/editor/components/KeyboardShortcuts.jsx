import React from 'react';

export default function KeyboardShortcuts() {
  return (
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
  );
}
