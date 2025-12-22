// src/modules/Dashboard/components/AudioVisualizer/AudioVisualizer.jsx
import React from 'react';
import './AudioVisualizer.scss';

const AudioVisualizer = ({ isRecording, audioUrl }) => {
  return (
    <div className="audio-visualizer">
      <div className={`visualizer-circle ${isRecording ? 'recording' : ''}`}>
        <div className="wave-container">
          {isRecording ? (
            <>
              <div className="wave wave-1"></div>
              <div className="wave wave-2"></div>
              <div className="wave wave-3"></div>
            </>
          ) : (
            <div className="wave-placeholder">
              <svg viewBox="0 0 100 100" width="100" height="100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#4a90e2" strokeWidth="2" />
                <path d="M 50 30 L 50 70" stroke="#4a90e2" strokeWidth="3" />
                <path d="M 40 40 L 40 60" stroke="#4a90e2" strokeWidth="3" />
                <path d="M 60 40 L 60 60" stroke="#4a90e2" strokeWidth="3" />
              </svg>
            </div>
          )}
        </div>
        
        {!isRecording && !audioUrl && (
          <p className="status-text"></p>
        )}
        {isRecording && (
          <p className="status-text recording-text">Recording...</p>
        )}
        {audioUrl && !isRecording && (
          <p className="status-text">Ready to Process</p>
        )}
      </div>
    </div>
  );
};

export default AudioVisualizer;
