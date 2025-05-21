import React, { useState, useEffect } from "react";
import { authAxios } from "../utils/auth";
import LeftSide from "../componensts/dashboardPage/LeftSide";
import RightSide from "../componensts/dashboardPage/RightSide";

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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#e0e0e0]">
      <LeftSide onFileSelect={setSelectedFileId} />

      <div className="flex-1 flex flex-col">
        <RightSide
          content={fileContent}
          onContentChange={handleContentChange}
        />
      </div>
    </div>
  );
}
