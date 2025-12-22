// src/modules/Dashboard/components/Controls/Controls.jsx
import React from 'react';
import { FaPlay, FaStop } from 'react-icons/fa';
import { MdDescription } from 'react-icons/md';
import './Controls.scss';

const Controls = ({ isRecording, onStart, onStop, onShowTranscript, hasAudio }) => {
  return (
    <div className="audio-controls">
      <button 
        className={`control-btn start-btn ${isRecording ? 'disabled' : ''}`}
        onClick={onStart}
        disabled={isRecording}
      >
        <FaPlay className="control-icon" />
        <span>Start</span>
      </button>

      <button 
        className={`control-btn stop-btn ${!isRecording ? 'disabled' : ''}`}
        onClick={onStop}
        disabled={!isRecording}
      >
        <FaStop className="control-icon" />
        <span>Stop</span>
      </button>

      <button 
        className={`control-btn transcript-btn ${!hasAudio ? 'disabled' : ''}`}
        onClick={onShowTranscript}
        disabled={!hasAudio}
      >
        <MdDescription className="control-icon" />
        <span>Show Transcript</span>
      </button>
    </div>
  );
};

export default Controls;
