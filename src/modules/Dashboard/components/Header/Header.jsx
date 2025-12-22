// src/modules/Dashboard/components/Header/Header.jsx
import React, { useRef, useState } from 'react';
import { FiUpload } from 'react-icons/fi';
import './Header.scss';

const Header = ({ onFileUpload, isRecording}) => {
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
    // ✅ Prevent click if recording
    if (isRecording) {
      return;
    }
    fileInputRef.current?.click();
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    // ✅ Prevent drag if recording
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

    // ✅ Prevent drop if recording
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
      className={`dashboard-header ${isDragging ? 'dragging' : ''} ${isRecording ? 'recording-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="header-content">
        <div className="header-text">
          <h1 className="header-title">AI Voice Summarizer</h1>
          <p className="header-description">
            Start Recording anything you want, or upload an audio file and let AI instantly summarize it for you.
          </p>
        </div>

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
          accept=".wav,.mp3,audio/wav,audio/mpeg"
          onChange={handleFileChange}
          disabled={isRecording} 
          style={{ display: 'none' }}
        />
      </div>

      {isDragging && !isRecording && (
        <div className="drag-overlay">
          <div className="drag-content">
            <FiUpload size={48} />
            <p>Drop your audio file here</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
