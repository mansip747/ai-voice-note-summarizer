// src/modules/Dashboard/components/LiveTranscript/LiveTranscript.jsx
import React from "react";
import "./LiveTranscript.scss";

const LiveTranscript = ({ transcript, isRecording, wordCount }) => {
  return (
    <div className="live-transcript">
      <div className="transcript-header">
        <h3>📝 Live Transcript</h3>
        <div className="transcript-meta">
          <span className="word-count">{wordCount} words</span>
        </div>
      </div>

      <div className="transcript-content">
        {transcript ? (
          <p className="transcript-text">{transcript}</p>
        ) : (
          <div className="transcript-placeholder">
            <div className="pulse-dot"></div>
            <p>Start speaking to see live transcription...</p>
          </div>
        )}
      </div>

      {isRecording && (
        <div className="transcript-footer">
          <span className="recording-indicator">
            <span className="recording-dot"></span>
            Listening...
          </span>
        </div>
      )}
    </div>
  );
};

export default LiveTranscript;
