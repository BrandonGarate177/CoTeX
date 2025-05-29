// importing everythin that goes into the left side of the dashboard

import React from "react";
import Topbar from "./topbar";
import Editor from "../../components/editor/Editor";
import EditorToolbar from "../../components/editor/EditorToolbar";


// get the height and width of the window 

export default function RightSide({content, onContentChange}) {

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
        
        {/* Editor container with purple portrait shape */}
        <div className="flex-grow flex items-center justify-center p-4">
          <div
            className="rounded-lg shadow-lg flex flex-col"
            style={{
              width: "70vw",             
              height: "85vh",
              position:"absolute",
              backgroundColor: "#290C3B", 
              overflow: "hidden",        
              opacity: 0.8               
            }}
          >
            <EditorToolbar />
            
            <div className="flex-grow relative overflow-auto">
              <Editor
                content={content}
                onContentChange={onContentChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
