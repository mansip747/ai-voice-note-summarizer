// src/modules/Dashboard/components/Header/Header.jsx
import React, { useRef, useState } from "react";
import { FiUpload } from "react-icons/fi";
import "./Header.scss";

const Header = ({ onFileUpload, isRecording }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  // Handle click on upload button
  const handleUploadClick = () => {
    if (isRecording) {
      return;
    }
    fileInputRef.current?.click();
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    if (isRecording) {
      return;
    }
    setIsDragging(true);
  };

  // Handle drag leave
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (isRecording) {
      return;
    }

    const file = e.dataTransfer.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div
      className={`dashboard-header ${isRecording ? "recording-active" : ""}`}
    >
      {/* Title Section - Standalone */}
      <div className="header-title-section">
        <h1 className="header-title">AI Voice Summarizer</h1>
      </div>

      {/* ✅ Content Box - Description + Upload Button with Drag & Drop */}
      <div
        className={`header-content-box ${isDragging ? "dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="header-description-wrapper">
          <p className="header-description">
            Upload a transcript file (.txt or .vtt) and let AI instantly
            summarize it for you.
          </p>
        </div>

        <div className="header-upload-section">
          <button
            className="upload-button"
            onClick={handleUploadClick}
            disabled={isRecording}
          >
            <FiUpload className="upload-icon" />
            <span>Upload File</span>
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.vtt,text/plain,text/vtt"
            onChange={handleFileChange}
            disabled={isRecording}
            style={{ display: "none" }}
          />
        </div>

        {/* ✅ Drag & Drop Overlay - Inside content box */}
        {isDragging && !isRecording && (
          <div className="drag-overlay">
            <div className="drag-content">
              <FiUpload size={48} />
              <p>Drop your transcript file here</p>
              <p className="file-hint">(.txt or .vtt files only)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
