// src/extensions/MathInline.js
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import MathInlineView from './MathInlineView'
import { InputRule } from '@tiptap/core'

export const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return { content: { default: '' } }
  },

  parseHTML() {
    return [
      { tag: 'span[data-type="math-inline"]' },
      { tag: 'span.math-inline' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'math-inline',
        class: 'math-inline',
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathInlineView)
  },

  addCommands() {
    return {
      insertMathInline: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { content: 'x^2' },
        });
      },
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\$([^$]+)\$/,
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
export default MathInline;
