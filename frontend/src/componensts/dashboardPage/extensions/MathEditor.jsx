import React, { useState } from 'react';

export default function MathEditor({ node, updateAttributes, editor }) {
  const [content, setContent] = useState(node.attrs.content);

  const handleChange = (e) => {
    setContent(e.target.value);
  };

  const handleBlur = () => {
    updateAttributes({ content });
  };

  return (
    <div className="math-editor">
      <textarea 
        value={content} 
        onChange={handleChange} 
        onBlur={handleBlur}
        placeholder="Enter LaTeX code here..."
        className="math-editor-textarea"
        rows={node.type.name === 'mathBlock' ? 4 : 1}
      />
    </div>
  );
}