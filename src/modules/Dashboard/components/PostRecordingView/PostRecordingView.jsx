// src/modules/Dashboard/components/PostRecordingView/PostRecordingView.jsx
import React from "react";
import "./PostRecordingView.scss";

const PostRecordingView = ({
  onStartNewRecording,
  onShowTranscript,
  duration,
  wordCount,
}) => {
  return (
    <div className="post-recording-view">
      <div className="post-recording-content">
        {/* Audio Wave Circle (Still) */}
        <div className="audio-circle-still">
          <div className="wave-bars">
            <div className="bar bar-1"></div>
            <div className="bar bar-2"></div>
            <div className="bar bar-3"></div>
            <div className="bar bar-4"></div>
            <div className="bar bar-5"></div>
          </div>
        </div>

        {/* Recording Info */}
        <div className="recording-summary">
          <div className="summary-item">
            <span className="label">Duration:</span>
            <span className="value">{duration}</span>
          </div>
          <div className="summary-item">
            <span className="label">Words:</span>
            <span className="value">{wordCount}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="post-recording-actions">
          <button
            className="action-btn new-recording-btn"
            onClick={onStartNewRecording}
          >
            <span className="btn-icon">🎤</span>
            Start New Recording
          </button>

          <button
            className="action-btn show-transcript-btn"
            onClick={onShowTranscript}
          >
            <span className="btn-icon">📄</span>
            Show Transcript and AI Summary
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostRecordingView;
