// importing everythin that goes into the left side of the dashboard


import React, { useState, useRef } from "react";
import Topbar from "./topbar";

export default function RightSide() {
  return (
    <div className="w-full h-full overflow-hidden relative">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a004d] to-[#35005c]" />
      
      {/* Grid background - contained within this component */}
      <div className="absolute inset-0 bg-grid-pattern animated-grid wave-glow z-0 
                     right-side-grid" /> {/* Added a specific class */}
      
      {/* Content positioned above the grid */}
      <div className="relative z-10 h-full">
        <Topbar />
        {/* Other content goes here */}
      </div>
    </div>
  );
}
