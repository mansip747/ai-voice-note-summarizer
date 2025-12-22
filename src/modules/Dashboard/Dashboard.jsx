// src/modules/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AudioVisualizer from './components/AudioVisualizer';
import Controls from './components/Controls';
import LiveTranscript from './components/LiveTranscript';
import PostRecordingView from './components/PostRecordingView';
import TranscriptSummaryView from './components/TranscriptSummaryView'; // ← NEW IMPORT
import { RecordingService } from '../../services/recordingDB';
import useVoiceRecorder from '../../hooks/useVoiceRecorder';
import { toast } from 'react-toastify';
import './Dashboard.scss';

const Dashboard = () => {
  // Use the custom hook
  const {
    isRecording,
    isPaused,
    transcript,
    liveTranscript,
    finalTranscript,
    recordingDuration,
    audioBlob,
    listening,
    browserSupportsSpeechRecognition,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    formatDuration,
    getWordCount,
  } = useVoiceRecorder();

  // Local state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [savedRecordingId, setSavedRecordingId] = useState(null);
  const [showTranscriptView, setShowTranscriptView] = useState(false); // ← NEW STATE

  // Save recording when audioBlob is available
  useEffect(() => {
    if (audioBlob && !isRecording) {
      saveRecording();
    }
  }, [audioBlob, isRecording]);

  // Handle file upload
  const handleFileUpload = (file) => {
    const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a WAV or MP3 file');
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 50MB');
      return;
    }

    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setUploadedFile(file);

    toast.success(`File uploaded: ${file.name}`);
    toast.info('Transcription for uploaded files coming soon!');
  };

  // Handle start recording
  const handleStartRecording = async () => {
    // Reset states
    setRecordingComplete(false);
    setShowTranscript(false);
    setSavedRecordingId(null);
    setShowTranscriptView(false); // ← RESET TRANSCRIPT VIEW

    const result = await startRecording();
    if (result.success) {
      setShowTranscript(true);
    }
  };

  // Handle pause/resume
  const handlePauseResume = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  // Handle stop recording
  const handleStopRecording = () => {
    const result = stopRecording();
    console.log('📊 Recording stopped with:', result);
    setRecordingComplete(true);
  };

  // Save recording to IndexedDB
  const saveRecording = async () => {
    console.log('💾 Saving recording to database...');

    if (!audioBlob) {
      console.error('❌ No audio blob available');
      return;
    }

    try {
      const transcriptToSave = finalTranscript || '';
      
      const recordingData = {
        title: `Recording ${new Date().toLocaleString()}`,
        transcript: transcriptToSave,
        duration: recordingDuration,
        timestamp: new Date().toISOString(),
        audioBlob: audioBlob,
        fileType: audioBlob.type,
        words: getWordCount(transcriptToSave),
      };

      console.log('📦 Saving recording:', {
        title: recordingData.title,
        transcriptLength: recordingData.transcript.length,
        transcriptPreview: recordingData.transcript.substring(0, 50),
        duration: recordingData.duration,
        words: recordingData.words,
        blobSize: audioBlob.size,
      });

      const savedId = await RecordingService.addRecording(recordingData);
      console.log('✅ Recording saved with ID:', savedId);

      setSavedRecordingId(savedId);
      toast.success('✅ Recording saved successfully!');
    } catch (error) {
      console.error('❌ Error saving recording:', error);
      toast.error('Failed to save recording: ' + error.message);
    }
  };

  // Handle start new recording from post-recording view
  const handleStartNewRecording = () => {
    resetRecording();
    setRecordingComplete(false);
    setShowTranscript(false);
    setShowTranscriptView(false); // ← CLOSE TRANSCRIPT VIEW
    handleStartRecording();
  };

  // Handle show transcript and summary - UPDATED
  const handleShowTranscriptAndSummary = () => {
    if (!finalTranscript) {
      toast.error('No transcript available');
      return;
    }
    setShowTranscriptView(true); // ← SHOW TRANSCRIPT VIEW
  };

  // Handle close transcript view - NEW FUNCTION
  const handleCloseTranscriptView = () => {
    setShowTranscriptView(false);
  };

  const hasTranscript = isRecording ? !!liveTranscript : !!finalTranscript;

  return (
    <div className="dashboard">
      {/* Header - Always visible (unless transcript view is open) */}
      {!showTranscriptView && (
        <Header onFileUpload={handleFileUpload} isRecording={isRecording} />
      )}

      {/* Initial Screen - Show when NOT recording and NOT complete */}
      {!isRecording && !recordingComplete && !showTranscriptView && (
        <div className="dashboard-initial">
          <AudioVisualizer
            isRecording={false}
            audioUrl={audioUrl}
            listening={listening}
          />

          <Controls
            isRecording={false}
            onStart={handleStartRecording}
            onStop={handleStopRecording}
            onShowTranscript={() => setShowTranscript(!showTranscript)}
            hasAudio={hasTranscript || !!audioUrl}
            showingTranscript={showTranscript}
          />
        </div>
      )}

      {/* Recording Screen - Split View */}
      {isRecording && !showTranscriptView && (
        <div className="dashboard-recording">
          {/* Left Side - Live Transcript */}
          <div className="recording-left">
            <LiveTranscript
              transcript={liveTranscript}
              isRecording={isRecording}
              isPaused={isPaused}
              wordCount={getWordCount(liveTranscript)}
            />
          </div>

          {/* Right Side - Audio Visualizer + Controls */}
          <div className="recording-right">
            <div className="recording-status-badge">
              <span className="status-dot"></span>
              <span>
                {isPaused ? 'Recording paused' : 'Recording in progress...'}
              </span>
            </div>

            <AudioVisualizer
              isRecording={isRecording && !isPaused}
              audioUrl={audioUrl}
              listening={listening && !isPaused}
            />

            <div className="recording-info">
              <div className="duration">{formatDuration(recordingDuration)}</div>
              <div className="word-count">{getWordCount(liveTranscript)} words</div>
            </div>

            <div className="recording-controls">
              <button 
                className={`control-btn pause-btn ${isPaused ? 'resume' : ''}`}
                onClick={handlePauseResume}
              >
                <span className="pause-icon">{isPaused ? '▶' : '⏸'}</span>
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button className="control-btn stop-btn" onClick={handleStopRecording}>
                <span className="stop-icon">⏹</span>
                Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Recording Screen - Show after stopping */}
      {!isRecording && recordingComplete && !showTranscriptView && (
        <PostRecordingView
          onStartNewRecording={handleStartNewRecording}
          onShowTranscript={handleShowTranscriptAndSummary}
          duration={formatDuration(recordingDuration)}
          wordCount={getWordCount(finalTranscript)}
        />
      )}

      {/* Transcript and AI Summary View - NEW */}
      {showTranscriptView && (
        <TranscriptSummaryView
          transcript={finalTranscript}
          onClose={handleCloseTranscriptView}
          onStartNewRecording={handleStartNewRecording}
          recordingTitle={`Recording ${new Date().toLocaleString()}`}
        />
      )}

      {/* Browser Support Warning */}
      {!browserSupportsSpeechRecognition && !showTranscriptView && (
        <div className="warning-box">
          <h4>⚠️ Browser Not Supported</h4>
          <p>Please use Chrome, Edge, or Safari for speech recognition.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

