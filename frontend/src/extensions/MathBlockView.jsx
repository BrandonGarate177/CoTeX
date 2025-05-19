import React from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { NodeViewWrapper } from '@tiptap/react' // Import NodeViewWrapper

export default function MathBlockView({ node }) {
  // render in displayMode
  const html = katex.renderToString(node.attrs.content || '', {
    throwOnError: false,
    displayMode: true,
  })
  
  // Wrap the component in NodeViewWrapper
  return (
    <NodeViewWrapper className="react-component math-block-wrapper">
      <div
        className="math-block"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </NodeViewWrapper>
  )
}