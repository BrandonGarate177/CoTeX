import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Regular expressions for math input
const inlineInputRegex = /(?:^|\s)\$(\S(?:.*?\S)?)\$/;
const blockInputRegex = /^\$\$([\s\S]+?)\$\$$/;

// Math inline node
export const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      content: { default: '' },
    };
  },

  parseHTML() {
    return [
      { tag: 'span[data-type="math-inline"]' },
      { tag: 'span.math-inline' },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const content = node.attrs.content || '';
    const html = katex.renderToString(content, {
      throwOnError: false,
      displayMode: false,
    });
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'math-inline',
        class: 'math-inline',
        innerHTML: html,
      }),
    ];
  },

  addCommands() {
    return {
      insertMathInline:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { content: 'x^2' },
            })
            .run();
        },
    };
  },

  addInputRules() {
    return [
      {
        find: inlineInputRegex,
        handler: ({ state, range, match }) => {
          const content = match[1];
          if (!content) return false;
          const { tr } = state;
          tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ content })
          );
          return true;
        },
      },
    ];
  },
});

// Math block node
export const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      content: { default: '' },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="math-block"]' },
      { tag: 'div.math-block' },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const content = node.attrs.content || '';
    const html = katex.renderToString(content, {
      throwOnError: false,
      displayMode: true,
    });
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'math-block',
        class: 'math-block',
        innerHTML: html,
      }),
    ];
  },

  addCommands() {
    return {
      insertMathBlock:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { content: 'E = mc^2' },
            })
            .run();
        },
    };
  },

  addInputRules() {
    return [
      {
        find: blockInputRegex,
        handler: ({ state, range, match }) => {
          const content = match[1];
          if (!content) return false;
          const { tr } = state;
          tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ content })
          );
          return true;
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey('mathBlockPlugin');
    const nodeType = this.type;
    return [
      new Plugin({
        key: pluginKey,
        props: {
          handlePaste(view, event) {
            const text = event.clipboardData?.getData('text/plain') || '';
            if (text.startsWith('$$') && text.endsWith('$$')) {
              const content = text.slice(2, -2);
              const { state } = view;
              const tr = state.tr.replaceSelectionWith(
                nodeType.create({ content })
              );
              view.dispatch(tr);
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});

// Plugin to convert existing dollar-sign math to nodes
export const MathPlugin = (editor) => {
  const inlineRegex = /\$([^$]+?)\$/g;
  const blockRegex = /\$\$([\s\S]+?)\$\$/g;

  return new Plugin({
    key: new PluginKey('mathConversionPlugin'),
    appendTransaction(transactions, oldState, newState) {
      const tr = newState.tr;
      let modified = false;

      newState.doc.descendants((node, pos) => {
        if (!node.isText) return;
        const text = node.text || '';
        let match;

        // Convert block math first
        while ((match = blockRegex.exec(text))) {
          const [fullMatch, content] = match;
          const from = pos + match.index;
          const to = from + fullMatch.length;
          tr.replaceWith(
            from,
            to,
            editor.schema.nodes.mathBlock.create({ content })
          );
          modified = true;
        }

        // Then inline math
        while ((match = inlineRegex.exec(text))) {
          const [fullMatch, content] = match;
          const from = pos + match.index;
          const to = from + fullMatch.length;
          tr.replaceWith(
            from,
            to,
            editor.schema.nodes.mathInline.create({ content })
          );
          modified = true;
        }
      });

      return modified ? tr : null;
    },
  });
};
