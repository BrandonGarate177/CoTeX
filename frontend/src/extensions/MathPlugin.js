import { Plugin, PluginKey } from 'prosemirror-state';

export const MathPlugin = (editor) => {
  const inlineRegex = /\$([^$]+?)\$/g;
  const blockRegex = /\$\$([^$]+?)\$\$/g;

  return new Plugin({
    key: new PluginKey('mathConversionPlugin'),
    appendTransaction(transactions, oldState, newState) {
      // Skip if no changes
      if (!transactions.some(tr => tr.docChanged)) return null;
      
      const tr = newState.tr;
      let modified = false;

      // Process text nodes
      newState.doc.descendants((node, pos) => {
        if (!node.isText) return;
        
        const text = node.text || '';
        if (!text.includes('$')) return; // Quick check before regex
        
        // Handle inline math with a simple regex
        let match;
        let matches = [];
        
        // Find inline math expressions
        while ((match = inlineRegex.exec(text)) !== null) {
          matches.push({
            from: pos + match.index,
            to: pos + match.index + match[0].length,
            content: match[1],
            type: 'inline'
          });
        }
        
        // Reset regex and find block math expressions
        inlineRegex.lastIndex = 0;
        while ((match = blockRegex.exec(text)) !== null) {
          matches.push({
            from: pos + match.index,
            to: pos + match.index + match[0].length,
            content: match[1],
            type: 'block'
          });
        }
        
        // Apply replacements in reverse to avoid position shifts
        matches
          .sort((a, b) => b.from - a.from)
          .forEach(match => {
            try {
              const nodeType = match.type === 'block' 
                ? editor.schema.nodes.mathBlock
                : editor.schema.nodes.mathInline;
              
              tr.replaceWith(
                match.from,
                match.to,
                nodeType.create({ content: match.content })
              );
              modified = true;
            } catch (e) {
              console.error('Error converting math:', e);
            }
          });
      });

      return modified ? tr : null;
    }
  });
};

export default MathPlugin;