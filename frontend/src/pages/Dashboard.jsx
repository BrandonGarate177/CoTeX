import React, { useState, useEffect } from "react";
import { authAxios } from "../utils/auth";
import LeftSide from "../components/dashboardPage/LeftSide";
import RightSide from "../components/dashboardPage/RightSide";

export default function Dashboard() {
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [fileContent, setFileContent]       = useState("");

  useEffect(() => {
    // guard against null/undefined/0
    if (selectedFileId == null) return;

    console.log("fetching content for fileId =", selectedFileId);
    authAxios
      .get(`/api/files/files/${selectedFileId}/`)
      .then((res) => setFileContent(res.data.content))
      .catch(console.error);
  }, [selectedFileId]);

  const handleContentChange = (newText) => {
    setFileContent(newText);
    if (selectedFileId == null) return;
    authAxios
      .patch(`/api/files/files/${selectedFileId}/`, { content: newText })
      .catch(console.error);
  };

  // Add useEffect to prevent scrolling when this component mounts
  useEffect(() => {
    // Prevent scrolling on the body when dashboard is mounted
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden bg-[#e0e0e0]">
      <LeftSide onFileSelect={setSelectedFileId} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <RightSide
          content={fileContent}
          onContentChange={handleContentChange}
        />
      </div>
    </div>
  );
}
