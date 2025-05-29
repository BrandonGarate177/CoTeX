import React from 'react';
import VideoAndButtons from './Auth';
import '../../index.css';

export default function RightSide() {
  return (
    <div className="relative w-full h-full bg-[#2a004d] overflow-hidden">

      {/* Glowing wave grid background */}
      <div className="absolute inset-0 bg-grid-pattern animated-grid wave-glow z-0" />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-12 z-10">
        <VideoAndButtons />

        {/* Subtitle */}
        <div className="text-white text-[20px] font-semibold font-['Source_Code_Pro'] leading-[26px]">
          Documentation has never been easier.
        </div>
      </div>

      {/* Footer (bottom aligned) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-10 z-10">
        <span className="text-[#F7EBFD] text-[22px] font-semibold font-['Source_Code_Pro'] leading-[28.6px]">
          CoTeX
        </span>
        <a
          href="#"
          className="text-white text-[20px] font-semibold font-['Source_Code_Pro'] leading-[26px] underline"
        >
          Terms of use
        </a>
      </div>
    </div>
  );
}
