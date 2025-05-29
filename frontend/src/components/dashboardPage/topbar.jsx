import React from 'react';

export default function Topbar() {
  return (
    <div className="w-full h-[42px] bg-[#230B38] flex items-center justify-between px-4 font-['Source_Code_Pro'] border-b border-[#37155F] text-sm shadow-md">

      {/* Account */}
      <div className="absolute right-4 flex items-center">
        <button className="bg-[#F7EBFD] text-black font-semibold rounded-md px-4 py-1 shadow-md hover:brightness-95 transition">
          Account
        </button>
      </div>

      



    </div>
  );
}
