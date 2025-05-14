import React from 'react';


export default function LeftSide() {
    return (

    // ToDO: Make This the height of the screen
    // Also fix the Fonts and positioning when i feel like it
        
      <div className="relative w-[600px] h-[100vh] bg-[#411D62]">
        <h1 className="absolute top-[239px] left-[97px] text-[#F7EBFD] text-[78px] font-semibold font-['Source_Code_Pro'] leading-[101.4px]">
          CoTeX
        </h1>
        <p className="absolute top-[357px] left-[97px] text-[#F7EBFD] text-[32px] font-semibold font-['Source_Code_Pro'] leading-[48px] text-justify">
          Notes... but for Code
        </p>
      </div>


    );
  }