import React, { useState } from "react";

export default function FolderModal({ isOpen, onClose, onSubmit, projectId }) {
  const [folderName, setFolderName] = useState('');
  const [createFile, setCreateFile] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isMainFile, setIsMainFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Create folder first
      const folder = await onSubmit(projectId, folderName);
      
      // If user wants to create a file as well
      if (createFile && fileName.trim()) {
        // We'll need to pass the folder creation callback and file creation callback
        if (typeof onSubmit.createFile === 'function') {
          await onSubmit.createFile(projectId, fileName, isMainFile, folder.id);
        }
      }
      
      // Reset form
      setFolderName('');
      setCreateFile(false);
      setFileName('');
      setIsMainFile(false);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#230B38] text-[#F7EBFD] p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Create New Folder</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full p-2 bg-[#27004A] rounded text-[#F7EBFD] focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="Enter folder name"
              autoFocus
            />
          </div>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={createFile}
                onChange={(e) => setCreateFile(e.target.checked)}
                className="mr-2"
              />
              Create file in this folder
            </label>
          </div>

          {createFile && (
            <>
              <div className="mb-4">
                <label className="block mb-2">File Name</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full p-2 bg-[#27004A] rounded text-[#F7EBFD] focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="Enter file name (e.g. main.tex)"
                />
              </div>
              
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
            </>
          )}
          
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
