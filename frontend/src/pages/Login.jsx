import React from 'react';
import LeftSide from '../componensts/loginPage/LeftSide';
import RightSide from '../componensts/loginPage/RightSide';

export default function Login() {
  return (
    <div className="flex w-screen h-screen">
      {/* LEFT SIDE */}
      <div>
        <LeftSide />
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full h-full">
        <RightSide />
      </div>
    </div>
  );
}
