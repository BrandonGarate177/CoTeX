import React, { useState, useEffect } from 'react';

export default function LeftSide() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [whyText, setWhyText] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  
  const staticPart = `const project = "A 15k-line legacy codebase.";
  const cotex = {
    for: project,
    letsYou: ["document", "annotate", "breathe"],
    why: `;
  
  // Multiple messages to cycle through
  const messages = [
    '"Code deserves better Notes.";\n  }',
    '"Documentation should be a joy.";\n  }',
    '"Legacy code needs love too.";\n  }',
    '"Every function deserves clarity.";\n  }'
  ];
  
  const typingSpeed = 120; // milliseconds per character
  const deletingSpeed = 20; // faster deletion speed
  const pauseTime = 2000; // pause time at full text and empty text
  
  useEffect(() => {
    let timeout;
    const currentMessage = messages[messageIndex];
    
    if (isDeleting) {
      if (whyText === '') {
        // Pause before starting to type again
        timeout = setTimeout(() => {
          setIsDeleting(false);
          // Move to next message when deleted
          setMessageIndex((messageIndex + 1) % messages.length);
        }, pauseTime);
      } else {
        // Delete one character
        timeout = setTimeout(() => {
          setWhyText(whyText.slice(0, whyText.length - 1));
        }, deletingSpeed);
      }
    } else {
      if (whyText === currentMessage) {
        // Pause before starting to delete
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, pauseTime);
      } else {
        // Type one character
        timeout = setTimeout(() => {
          setWhyText(currentMessage.slice(0, whyText.length + 1));
        }, typingSpeed);
      }
    }
    
    return () => clearTimeout(timeout);
  }, [whyText, isDeleting, messageIndex, messages]);
  
  // Combine the static and dynamic parts for display
  const displayText = staticPart + whyText;
  
  return (
    <div className="relative w-[600px] h-[100vh] bg-[#230B38]">
      <h1 className="absolute top-[239px] left-[97px] text-[#F7EBFD] text-[78px] font-semibold font-['Source_Code_Pro'] leading-[101.4px]">
        CoTeX
      </h1>
      <p className="absolute top-[357px] left-[97px] text-[#F7EBFD] text-[32px] font-semibold font-['Source_Code_Pro'] leading-[48px] text-justify">
        Notes... but for Code
      </p>
      <pre className="absolute top-[445px] left-[97px] text-[#F7EBFD] text-[14px] leading-[26px] font-mono whitespace-pre-wrap max-w-[450px]">
        {displayText}
        <span className="inline-block w-[2px] h-[24px] bg-[#F7EBFD] ml-1 animate-blink align-middle"></span>
      </pre>
    </div>
  );
}

