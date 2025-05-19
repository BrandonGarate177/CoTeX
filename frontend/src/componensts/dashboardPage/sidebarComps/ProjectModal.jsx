import React, { useState } from "react";

export default function ProjectModal({ isOpen, onClose, onSubmit }) {
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await onSubmit(projectName);
      setProjectName('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#230B38] text-[#F7EBFD] p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full p-2 bg-[#27004A] rounded text-[#F7EBFD] focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="Enter project name"
              autoFocus
            />
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