import React, { useState } from 'react';
import LoginModal from './loginModal';
import SignUpModal from './signupModal';

export default function VideoAndButtons() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div className="w-[570px]">
      {/* YouTube Video with proper 16:9 aspect ratio */}
      <div className="w-full mb-6 overflow-hidden rounded-lg shadow-md aspect-video">
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/FIOFdt_JjQk?autoplay=1"
          title="CoTeX Product Demo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          frameBorder="0"
          allowFullScreen
        ></iframe>
      </div>

      {/* Auth Buttons */}
      <div className="flex justify-center space-x-6">
        <button
          onClick={() => setShowLogin(true)}
          className="w-[170px] h-[44px] bg-[#F7EBFD] shadow-md rounded-full text-black text-[20px] font-semibold font-['Source_Code_Pro']"
        >
          LOGIN
        </button>

        <button
          onClick={() => setShowSignup(true)}
          className="w-[170px] h-[44px] bg-[#F7EBFD] shadow-md rounded-full text-black text-[20px] font-semibold font-['Source_Code_Pro']"
        >
          SIGN UP
        </button>
      </div>

      {/* Popup Modals */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      <SignUpModal isOpen={showSignup} onClose={() => setShowSignup(false)} />
    </div>
  );
}
