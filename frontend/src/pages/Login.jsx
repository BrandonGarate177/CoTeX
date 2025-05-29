import React from 'react';
import LeftSide from '../components/loginPage/LeftSide';
import RightSide from '../components/loginPage/RightSide';

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
