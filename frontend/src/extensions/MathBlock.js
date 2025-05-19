// src/extensions/MathBlock.js
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import MathBlockView from './MathBlockView'
import { InputRule } from '@tiptap/core'

export const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return { content: { default: '' } }
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="math-block"]' },
      { tag: 'div.math-block' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'math-block',
        class: 'math-block',
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockView)
  },

  addCommands() {
    return {
      insertMathBlock: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { content: 'E = mc^2' },
        });
      },
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\$\$([^$]+)\$\$/,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const start = range.from;
          const end = range.to;
          
          if (match && match[1]) {
            tr.replaceWith(
              start, 
              end, 
              this.type.create({ content: match[1].trim() })
            );
          }
        },
      }),
    ];
  },
})

// For backward compatibility
export default MathBlock;
