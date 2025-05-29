import katex from "katex";
import { nanoid } from 'nanoid';

export function parseLine(line){
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
  
  // Task lists (Obsidian style)
  line = line.replace(/^\s*- \[ \]\s*(.+)$/g, '<div class="task-list-item"><input type="checkbox" disabled> $1</div>');
  line = line.replace(/^\s*- \[x\]\s*(.+)$/g, '<div class="task-list-item"><input type="checkbox" checked disabled> $1</div>');

  return `<p>${line}</p>`;
}

export function toBlocks(lines) {
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
      blocks.push({ id: nanoid(), type: "code", lang, content: buffer.join("\n") });
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
      blocks.push({ id: nanoid(), type: "math", content: buffer.join("\n") });
      continue;
    }

    // 3) plain line
    blocks.push({ id: nanoid(), type: "line", content: line });
    i++;
  }

  return blocks;
}