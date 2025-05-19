import React from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { NodeViewWrapper } from '@tiptap/react' // Import NodeViewWrapper

export default function MathInlineView({ node }) {
  const html = katex.renderToString(node.attrs.content || '', {
    throwOnError: false,
    displayMode: false,
  })
  
  // Wrap the component in NodeViewWrapper
  return (
    <NodeViewWrapper className="react-component math-inline-wrapper">
      <span
        className="math-inline"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </NodeViewWrapper>
  )
}