// importing everythin that goes into the left side of the dashboard

import React from "react";
import Topbar from "./topbar";
import Editor from "./Editor";

export default function RightSide() {
  return (
    <div className="w-full h-full overflow-hidden relative flex flex-col">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a004d] to-[#35005c]" />
      
      {/* Grid background - contained within this component */}
      <div className="absolute inset-0 bg-grid-pattern animated-grid wave-glow z-0 
                     right-side-grid" />
      
      {/* Content positioned above the grid */}
      <div className="relative z-10 h-full flex flex-col">
        <Topbar />
        
        {/* Editor container with padding */}
        <div className="flex-grow overflow-hidden p-4">
          <Editor />
        </div>
      </div>
    </div>
  );
}
