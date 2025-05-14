import React from 'react';

export default function VideoAndButtons() {
  return (
    <div className="relative w-[570px] h-[335px]">
      {/* Video placeholder */}
      <div className="w-full h-[250px] bg-[#D9D9D9]" />

      {/* Login Button */}
      <div className="absolute top-[291px] left-[90px] w-[170px] h-[44px]">
        <div
          className="w-full h-full bg-[#F7EBFD] shadow-md rounded-full flex items-center justify-center cursor-pointer"
          onClick={() => alert('Login clicked!')}
        >
          <span className="text-black text-[20px] font-semibold font-['Source_Code_Pro'] leading-[26px]">
            Login
          </span>
        </div>
      </div>

      {/* Sign Up Button */}
      <div className="absolute top-[291px] left-[320px] w-[170px] h-[44px]">
        <div
          className="w-full h-full bg-[#F7EBFD] shadow-md rounded-full flex items-center justify-center cursor-pointer"
          onClick={() => alert('Sign Up clicked!')}
        >
          <span className="text-black text-[20px] font-semibold font-['Source_Code_Pro'] leading-[26px]">
            SIGN UP
          </span>
        </div>
      </div>
    </div>
  );
}
