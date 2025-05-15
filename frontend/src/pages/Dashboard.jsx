import React from 'react';
import LeftSide from '../componensts/dashboardPage/LeftSide';
import RightSide from '../componensts/dashboardPage/RightSide';

// import NoteEditor from '../components/dashboardPage/NoteEditor';
// import PreviewPane from '../components/dashboardPage/PreviewPane';

export default function Dashboard() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#e0e0e0]">
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left side with Sidebar */}
      <LeftSide />
      
      {/* Right side with Topbar and content */}
      <div className="flex-1 flex flex-col">
        <RightSide />
      </div>
    </div>


    </div>
  );
}
