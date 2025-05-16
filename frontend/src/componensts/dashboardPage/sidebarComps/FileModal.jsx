import React, { useState } from "react";

export default function FileModal({ isOpen, onClose, onSubmit, projectId, folders = [] }) {
  const [fileName, setFileName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [isMainFile, setIsMainFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await onSubmit(projectId, fileName, isMainFile, selectedFolder || null);
      setFileName('');
      setIsMainFile(false);
      setSelectedFolder('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create file');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#230B38] text-[#F7EBFD] p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Create New File</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full p-2 bg-[#27004A] rounded text-[#F7EBFD] focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="Enter file name (e.g. main.tex)"
              autoFocus
            />
          </div>
          
          {folders.length > 0 && (
            <div className="mb-4">
              <label className="block mb-2">Folder (optional)</label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full p-2 bg-[#27004A] rounded text-[#F7EBFD] focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="">Root (No folder)</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isMainFile}
                onChange={(e) => setIsMainFile(e.target.checked)}
                className="mr-2"
              />
              Set as main file
            </label>
          </div>
          
          {error && <p className="text-red-400 mb-4">{error}</p>}
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-800 rounded hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}