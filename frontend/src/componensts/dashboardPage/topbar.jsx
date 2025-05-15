import React from 'react';

export default function Topbar() {
  return (
    <div className="w-full h-[42px] bg-[#230B38] border-b border-white/50 flex items-center justify-between px-4 font-['Source_Code_Pro'] text-sm shadow-md">
      
      {/* Left Buttons */}
      <div className="flex space-x-3">
        <button className="bg-[#F7EBFD] text-black font-semibold rounded-full px-4 py-1 shadow-md hover:brightness-95 transition">
          Edit
        </button>
        <button className="bg-[#F7EBFD] text-black font-semibold rounded-full px-4 py-1 shadow-md hover:brightness-95 transition">
          Compile
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-[375px] h-[25px]">
        <div className="absolute inset-0 bg-[#F7EBFD] rounded-full shadow-md flex items-center px-2">
          <input
            type="text"
            placeholder="Search for a file"
            className="w-full h-full bg-[#F2D9FF] text-[#636363] font-semibold text-sm px-3 rounded-full outline-none"
          />
          <div className="w-[20px] h-[20px] bg-[#F2D9FF] rounded-full ml-2 shadow-md" />
        </div>
      </div>

      {/* Account */}
      <div>
        <button className="bg-[#F7EBFD] text-black font-semibold rounded-full px-4 py-1 shadow-md hover:brightness-95 transition">
          Account
        </button>
      </div>
    </div>
  );
}
