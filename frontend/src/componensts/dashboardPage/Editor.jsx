import React, { useState, useEffect } from 'react';
import { 
  MDXEditor, 
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  tablePlugin,
  codeBlockPlugin,
  linkPlugin,
  imagePlugin,
  frontmatterPlugin,
  diffSourcePlugin,
  toolbarPlugin,
  InsertCodeBlock,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import './EditorStyles.css';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Editor({ initialContent = '# Welcome to CoTeX\n\nStart writing your document here...', onContentChange }) {
  const [markdown, setMarkdown] = useState(initialContent);
  const [editorHeight, setEditorHeight] = useState('600px');

  // Adjust editor height based on window size
  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.innerHeight;
      setEditorHeight(`${Math.max(400, viewportHeight * 0.7)}px`);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChange = (content) => {
    setMarkdown(content);
    if (onContentChange) {
      onContentChange(content);
    }
  };

  // Define a custom code block editor descriptor
  const customCodeBlockDescriptor = {
    match: (node) => node.name ==='fencedCode',
    priority: 1,
    name: 'custom-code-block',
    Editor: ({code, language, onChange}) => {
      // Safe handler for onChange - checks if it's a function first
      const handleChange = (e) => {
        if (typeof onChange === 'function') {
          onChange(e.target.value);
        }
      };
      
      return (
        <div style={{ 
          position: 'relative',
          backgroundColor: 'rgba(20, 20, 20, 0.8)',
          borderRadius: '4px',
          padding: '8px',
          margin: '8px 0'
        }}>
          <div style={{ 
            position: 'absolute', 
            top: '4px', 
            right: '8px', 
            fontSize: '12px',
            color: '#aaa',
            padding: '2px 6px',
            borderRadius: '3px',
            backgroundColor: 'rgba(0,0,0,0.3)'
          }}>
            {language || 'text'}
          </div>
          <SyntaxHighlighter 
            language={language || 'text'} 
            style={tomorrow}
            customStyle={{
              margin: '0',
              padding: '16px 8px 8px 8px',
              backgroundColor: 'transparent',
              color: 'white'
            }}
          >
            {code || ''}
          </SyntaxHighlighter>
          <textarea
            value={code || ''}
            onChange={handleChange} // Use our safe handler
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'text'
            }}
          />
        </div>
      );
    }
  };

  return (
    <div 
      className="cotex-editor-container" 
      style={{ 
        height: editorHeight,
        backgroundColor: 'rgba(40, 44, 52, 0.85)',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}
    >
      <MDXEditor
        markdown={markdown}
        onChange={handleChange}
        contentEditableClassName="cotex-editor-content"
        className="cotex-mdx-editor"
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <> 
                <UndoRedo />
                <BoldItalicUnderlineToggles />
                <BlockTypeSelect />
                <CreateLink />
                <InsertCodeBlock />
              </>
            )
          }),
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin({
            codeBlock: {
              trigger: '```',
              shortcut: 'Enter'
            }
          }),
          tablePlugin(),
          codeBlockPlugin({ 
            defaultLanguage: 'latex',
            codeBlockEditorDescriptors: [customCodeBlockDescriptor], // IMPORTANT: Register the descriptor here
            enabledLanguages: ['latex', 'tex', 'python', 'javascript', 'html', 'css', 'java', 'c', 'cpp'],
            usageStatistics: false
          }),
          linkPlugin(),
          imagePlugin(),
          frontmatterPlugin(),
          diffSourcePlugin({
            viewMode: 'rich-text',
            diffMarkdown: markdown,
          }),
        ]}
      />
    </div>
  );
}