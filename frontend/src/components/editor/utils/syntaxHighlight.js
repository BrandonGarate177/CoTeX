export default function markdownSyntaxHighlight(text) {
  // Simple markdown syntax highlighting
  if (!text) return '';
  
  // Replace with regex for headings
  let html = text.replace(/^(#{1,6})\s+(.+)$/gm, '<span class="md-heading">$1 $2</span>');
  
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<span class="md-bold">**$1**</span>');
  
  // Italic
  html = html.replace(/\*(.+?)\*\*/g, '<span class="md-italic">*$1*</span>');
  
  // Inline code
  html = html.replace(/`(.+?)`/g, '<span class="md-code">`$1`</span>');
  
  // Lists
  html = html.replace(/^(\s*)([*\-+])\s(.+)$/gm, '$1<span class="md-list-item">$2 $3</span>');
  
  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<span class="md-link">[$1]($2)</span>');
  
  return html;
};
