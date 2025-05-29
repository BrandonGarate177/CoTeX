import React from 'react';

export default function FileItem({ file, onClick }) {
  return (
    <div 
      className="px-3 py-1 text-sm rounded hover:bg-[#27004A] cursor-pointer flex items-center"
      onClick={() => onClick(file.fileId)}
    >
      <span className="flex-1">{file.title}</span>
      {file.isMain && (
        <span className="text-xs bg-purple-800 px-1 rounded">main</span>
      )}
    </div>
  );
}