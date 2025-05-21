import React, { useState, useEffect, useRef} from "react";
import katex from "katex";
import 'katex/dist/katex.min.css';

function parseLine(line){
  // Code block
  if(/^```/.test(line)){
    return `<pre><code>${line.replace(/^```/, '')}</code></pre>`;
  }

  // Math block
  if (/^\$\$/.test(line)) {
    return `<div class="math-block">${katex.renderToString(
      line.replace(/^\$\$|\$\$$/g, ''),
      { displayMode: true, throwOnError: false }
    )}</div>`;
  }

  // Headers
  const hMatch = line.match(/^(#{1,6})\s*(.+)/);
  if (hMatch){
    const level = hMatch[1].length;
    return `<h${level}>${hMatch[2]}</h${level}>`;
  }

  // Math INLINE
  line = line
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  // code INLINE
  line = line.replace(/`(.+?)`/g, '<code>$1</code>');
  return `<p>${line}</p>`;
}

// Going to render each line separately
function toBlocks(lines) {
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1) code fence
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();  // e.g. ```js
      i++;
      const buffer = [];
      // collect until closing ```
      while (i < lines.length && !lines[i].startsWith("```")) {
        buffer.push(lines[i]);
        i++;
      }
      // skip the closing ```
      i++;
      blocks.push({ type: "code", lang, content: buffer.join("\n") });
      continue;
    }

    // 2) math fence
    if (line.startsWith("$$")) {
      i++;
      const buffer = [];
      // collect until closing $$
      while (i < lines.length && !lines[i].startsWith("$$")) {
        buffer.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: "math", content: buffer.join("\n") });
      continue;
    }

    // 3) plain line
    blocks.push({ type: "line", content: line });
    i++;
  }

  return blocks;
}

const headerStyles = {
  h1: { fontSize: '2em', fontWeight: 'bold', margin: '0.67em 0' },
  h2: { fontSize: '1.5em', fontWeight: 'bold', margin: '0.83em 0' },
  h3: { fontSize: '1.17em', fontWeight: 'bold', margin: '1em 0' },
  h4: { fontSize: '1em', fontWeight: 'bold', margin: '1.33em 0' },
  h5: { fontSize: '0.83em', fontWeight: 'bold', margin: '1.67em 0' },
  h6: { fontSize: '0.67em', fontWeight: 'bold', margin: '2.33em 0' },
};

export default function Editor({ content = "", onContentChange }) {
  const [blocks, setBlocks] = useState(() => toBlocks(content.split("\n")));
  const [currentIndex, setCurrentIndex] = useState(0);
  const textareaRef = useRef(null);
  const blockEditableTypes = ["line", "code", "math"];

  // initialize if content prop changes
  useEffect(() => {
    setBlocks(toBlocks(content.split("\n")));
  }, [content]);

  // focus the textarea whenever currentIndex changes
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.focus();
      // place cursor at end
      if (blocks[currentIndex]?.type === "line") {
        const len = blocks[currentIndex]?.content?.length || 0;
        ta.setSelectionRange(len, len);
      }
    }
  }, [currentIndex, blocks]);

  // utility to update the current block content
  const updateBlockContent = (idx, newContent) => {
    setBlocks((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], content: newContent };
      return copy;
    });
  };

  // when the user blurs out of textarea, notify parent
  const handleBlur = () => {
    // Convert blocks back to text
    const lines = [];
    blocks.forEach(block => {
      if (block.type === "code") {
        lines.push(`\`\`\`${block.lang || ""}`);
        lines.push(...block.content.split("\n"));
        lines.push("```");
      } else if (block.type === "math") {
        lines.push("$$");
        lines.push(...block.content.split("\n"));
        lines.push("$$");
      } else {
        lines.push(block.content);
      }
    });
    onContentChange?.(lines.join("\n"));
  };

  // keyboard navigation and splitting logic
  const handleKeyDown = (e) => {
    const ta = textareaRef.current;
    if (!ta) return;

    // Tab → insert a tab character
    if (e.key === "Tab") {
      e.preventDefault();
      const pos = ta.selectionStart;
      const val = ta.value;
      updateBlockContent(currentIndex, val.slice(0, pos) + "\t" + val.slice(pos));
      // restore cursor
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = pos + 1;
      }, 0);
      return;
    }
    
    const val = ta.value;
    const pos = ta.selectionStart;
    const currentBlock = blocks[currentIndex];
    
    // Handle code fence creation
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      currentBlock.type === "line" &&
      /^\s*```(.*)$/.test(currentBlock.content)
    ) {
      e.preventDefault();
      const lang = (currentBlock.content.match(/^\s*```(.*)$/)[1] || "").trim();
      
      setBlocks(prev => {
        const copy = [...prev];
        // Replace the fence line with a code block structure
        copy.splice(
          currentIndex,
          1,
          { type: "line", content: `\`\`\`${lang}` },
          { type: "code", lang, content: "" },
          { type: "line", content: "```" }
        );
        return copy;
      });
      
      // Move to the content block
      setCurrentIndex(currentIndex + 1);
      return;
    }
    
    // Handle math fence creation
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      currentBlock.type === "line" &&
      /^\s*\$\$(.*)$/.test(currentBlock.content)
    ) {
      e.preventDefault();
      
      setBlocks(prev => {
        const copy = [...prev];
        copy.splice(
          currentIndex,
          1,
          { type: "line", content: "$$" },
          { type: "math", content: "" },
          { type: "line", content: "$$" }
        );
        return copy;
      });
      
      setCurrentIndex(currentIndex + 1);
      return;
    }
    
    // Shift+Enter to exit a code/math block
    if (
      e.key === "Enter" &&
      e.shiftKey &&
      (currentBlock.type === "code" || currentBlock.type === "math")
    ) {
      e.preventDefault();
      
      // Find the closing fence block
      const closingBlockIndex = currentIndex + 1;
      
      // Insert an empty line after the closing fence
      setBlocks(prev => {
        const copy = [...prev];
        copy.splice(closingBlockIndex + 1, 0, { type: "line", content: "" });
        return copy;
      });
      
      // Move focus to the new empty line
      setCurrentIndex(closingBlockIndex + 1);
      return;
    }
    
    // Regular Enter within a code/math block should just insert a newline
    if (e.key === "Enter" && (currentBlock.type === "code" || currentBlock.type === "math")) {
      // Let the default behavior happen - textareas handle newlines naturally
      return;
    }
    
    // ↑: move up if at start
    if (e.key === "ArrowUp" && pos === 0 && currentIndex > 0) {
      e.preventDefault();
      setCurrentIndex((i) => i - 1);
      return;
    }

    // ↓: move down if at end
    if (e.key === "ArrowDown" && pos === val.length && currentIndex < blocks.length - 1) {
      e.preventDefault();
      setCurrentIndex((i) => i + 1);
      return;
    }

    // Enter in a normal line: split line into two
    if (e.key === "Enter" && currentBlock.type === "line") {
      e.preventDefault();
      const before = val.slice(0, pos);
      const after = val.slice(pos);
      
      setBlocks((prev) => {
        const copy = [...prev];
        // Replace current block with before, insert after as new block
        copy.splice(currentIndex, 1, 
          { type: "line", content: before }, 
          { type: "line", content: after }
        );
        return copy;
      });
      
      // Move focus to the newly created line
      setCurrentIndex((i) => i + 1);
    }
  };

  // click on a rendered line to start editing there
  const handleLineClick = (idx) => {
    setCurrentIndex(idx);
  };

  return (
    <div
      className="editor"
      style={{
        lineHeight: "1.5",
        width: "100%",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {blocks.map((block, bIdx) => {
        // If this is the currently edited block
        if (bIdx === currentIndex) {
          const isCode = block.type === "code";
          const isMath = block.type === "math";
          
          return (
            <textarea
              key={bIdx}
              ref={textareaRef}
              value={block.content}
              onChange={(e) => updateBlockContent(bIdx, e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              rows={isCode || isMath ? Math.max(3, block.content.split("\n").length) : 1}
              style={{
                width: "100%",
                fontFamily: isCode || isMath ? "monospace" : "inherit",
                padding: "4px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: block.content.startsWith('#') ? 
                  headerStyles[`h${block.content.match(/^#+/)[0].length}`]?.fontSize || 'inherit' : 
                  'inherit',
              }}
            />
          );
        }

        // NEW: render a blank spacer for an empty line
        if (block.type === "line" && block.content === "") {
          return (
            <div
              key={bIdx}
              style={{
                height: "1em",     // adjust vertical gap here
                cursor: "text",
              }}
              onClick={() => handleLineClick(bIdx)}
            />
          );
        }
        
        // Static renders for non-active blocks
        if (block.type === "code") {
          return (
            <pre key={bIdx} onClick={() => handleLineClick(bIdx)} style={{ cursor: "text" }}>
              <code>
                {block.content}
              </code>
            </pre>
          );
        }
        
        if (block.type === "math") {
          return (
            <div
              key={bIdx}
              className="math-block"
              onClick={() => handleLineClick(bIdx)}
              style={{ cursor: "text" }}
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(block.content, {
                  displayMode: true,
                  throwOnError: false,
                }),
              }}
            />
          );
        }
        
        // Plain line
        return (
          <div
            key={bIdx}
            onClick={() => handleLineClick(bIdx)}
            style={{ 
              cursor: "text",
              ...(block.content.startsWith('#') ? 
                headerStyles[`h${block.content.match(/^#+/)[0].length}`] || {} : 
                {})
            }}
            dangerouslySetInnerHTML={{
              __html: parseLine(block.content),
            }}
          />
        );
      })}
    </div>
  );
}