import React, { useState } from 'react';
import { 
  FiCode, 
  FiBold, 
  FiItalic, 
  FiHash, // Replace FiHeading with FiHash
  FiList, 
  FiLink, 
  FiImage,
  FiHelpCircle,
  FiChevronDown,
  FiZap  // For math function
} from 'react-icons/fi';
import { VscTable, VscGraphLine } from 'react-icons/vsc';

const EditorToolbar = () => {
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  
  const toggleHelpModal = () => {
    setHelpModalOpen(!helpModalOpen);
  };

  const toggleHeadingMenu = () => {
    setHeadingMenuOpen(!headingMenuOpen);
  };

  return (
    <div className="bg-[#27004A] border-b border-[#37155F] p-2 flex flex-wrap gap-1 justify-between items-center">
      {/* Left side tools */}
      <div className="flex flex-wrap gap-1">
        {/* Text formatting */}
        <div className="flex rounded overflow-hidden border border-[#37155F]">
          <button className="hover:bg-[#37155F] p-2 text-gray-300 hover:text-white transition-colors" title="Bold">
            <FiBold size={16} />
          </button>
          <button className="hover:bg-[#37155F] p-2 text-gray-300 hover:text-white transition-colors" title="Italic">
            <FiItalic size={16} />
          </button>
          <div className="relative">
            <button 
              className="hover:bg-[#37155F] p-2 text-gray-300 hover:text-white transition-colors flex items-center" 
              title="Headings"
              onClick={toggleHeadingMenu}
            >
              <FiHash size={16} />
              <FiChevronDown size={12} className="ml-1" />
            </button>
            
            {headingMenuOpen && (
              <div className="absolute top-full left-0 mt-1 bg-[#27004A] border border-[#37155F] rounded shadow-lg z-10 py-1 w-32">
                {[1, 2, 3, 4, 5, 6].map(level => (
                  <button 
                    key={level}
                    className="block w-full text-left px-3 py-1 hover:bg-[#37155F] text-gray-300 hover:text-white transition-colors"
                    onClick={() => setHeadingMenuOpen(false)}
                  >
                    H{level}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Content blocks */}
        <div className="flex rounded overflow-hidden border border-[#37155F]">
          <button className="hover:bg-[#37155F] p-2 text-gray-300 hover:text-white transition-colors" title="Insert Code Block (Ctrl+Shift+K)">
            <FiCode size={16} />
          </button>
          <button className="hover:bg-[#37155F] p-2 text-gray-300 hover:text-white transition-colors" title="Insert Math Formula (Ctrl+Shift+M)">
            <FiZap size={16} />
          </button>
          <button className="hover:bg-[#37155F] p-2 text-gray-300 hover:text-white transition-colors" title="Insert Table">
            <VscTable size={16} />
          </button>
        </div>
        
        {/* Lists and media */}
        <div className="flex rounded overflow-hidden border border-[#37155F]">
          <button className="hover:bg-[#37155F] p-2 text-gray-300 hover:text-white transition-colors" title="Bullet List">
            <FiList size={16} />
          </button>
          <button className="hover:bg-[#37155F] p-2 text-gray-300 hover:text-white transition-colors" title="Insert Link">
            <FiLink size={16} />
          </button>
          <button className="hover:bg-[#37155F] p-2 text-gray-300 hover:text-white transition-colors" title="Insert Image">
            <FiImage size={16} />
          </button>
          <button className="hover:bg-[#37155F] p-2 text-gray-300 hover:text-white transition-colors" title="Insert Graph or Chart">
            <VscGraphLine size={16} />
          </button>
        </div>
      </div>
      
      {/* Right side tools - Help */}
      <div>
        <button 
          className="hover:bg-[#37155F] p-2 rounded text-gray-300 hover:text-white transition-colors flex items-center"
          title="Help"
          onClick={toggleHelpModal}
        >
          <FiHelpCircle size={16} />
          <span className="ml-1 text-sm hidden sm:inline">Help</span>
        </button>
      </div>
      
      {/* Help Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#27004A] rounded-lg shadow-xl w-11/12 max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-[#37155F] flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Editor Help</h2>
              <button 
                onClick={toggleHelpModal}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Keyboard Shortcuts</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-300">Bold</div>
                  <div className="text-gray-400">Ctrl/⌘ + B</div>
                  
                  <div className="text-gray-300">Italic</div>
                  <div className="text-gray-400">Ctrl/⌘ + I</div>
                  
                  <div className="text-gray-300">Insert Code Block</div>
                  <div className="text-gray-400">Ctrl/⌘ + Shift + K</div>
                  
                  <div className="text-gray-300">Insert Math Block</div>
                  <div className="text-gray-400">Type $$ and press Enter</div>
                  
                  <div className="text-gray-300">Add New Line After Block</div>
                  <div className="text-gray-400">Shift + Enter</div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Markdown Syntax</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-300">Heading</div>
                  <div className="text-gray-400"># Heading 1, ## Heading 2, etc.</div>
                  
                  <div className="text-gray-300">Bold Text</div>
                  <div className="text-gray-400">**bold text**</div>
                  
                  <div className="text-gray-300">Italic Text</div>
                  <div className="text-gray-400">*italic text*</div>
                  
                  <div className="text-gray-300">Inline Code</div>
                  <div className="text-gray-400">`code`</div>
                  
                  <div className="text-gray-300">Code Block</div>
                  <div className="text-gray-400">```language<br/>code<br/>```</div>
                  
                  <div className="text-gray-300">Math Expression</div>
                  <div className="text-gray-400">$$<br/>E = mc^2<br/>$$</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-white mb-3">LaTeX Tips</h3>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-2">
                  <li>Use <span className="text-purple-300">\begin{'{'} document {'}'}</span> and <span className="text-purple-300">\end{'{'} document {'}'}</span> to define the document body</li>
                  <li>Create sections with <span className="text-purple-300">\section{'{'} title {'}'}</span> and <span className="text-purple-300">\subsection{'{'} subtitle {'}'}</span></li>
                  <li>Include graphics with <span className="text-purple-300">\includegraphics{'{'} filename {'}'}</span></li>
                  <li>Create lists with <span className="text-purple-300">\begin{'{'} itemize {'}'}</span> or <span className="text-purple-300">\begin{'{'} enumerate {'}'}</span></li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 border-t border-[#37155F] flex justify-end">
              <button 
                onClick={toggleHelpModal}
                className="px-4 py-2 bg-purple-800 hover:bg-purple-700 text-white rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorToolbar;