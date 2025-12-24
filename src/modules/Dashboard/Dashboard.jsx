// src/modules/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import AudioVisualizer from "./components/AudioVisualizer";
import Controls from "./components/Controls";
import LiveTranscript from "./components/LiveTranscript";
import PostRecordingView from "./components/PostRecordingView";
import TranscriptSummaryView from "./components/TranscriptSummaryView";
import { RecordingService } from "../../services/recordingDB";
import useVoiceRecorder from "../../hooks/useVoiceRecorder";
import { toast } from "react-toastify";
import "./Dashboard.scss";

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
  const [uploadedTranscript, setUploadedTranscript] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [savedRecordingId, setSavedRecordingId] = useState(null);
  const [showTranscriptView, setShowTranscriptView] = useState(false);
  const [transcriptViewKey, setTranscriptViewKey] = useState(Date.now());

  // Save recording when audioBlob is available
  useEffect(() => {
    if (audioBlob && !isRecording) {
      saveRecording();
    }
  }, [audioBlob, isRecording]);

  // ✅ NEW: Handle file upload for transcript files
  const handleFileUpload = async (file) => {
    console.log("📁 File uploaded:", file.name, file.type);

    // Validate file type
    const fileName = file.name.toLowerCase();
    const isTextFile = fileName.endsWith(".txt") || file.type === "text/plain";
    const isVTTFile = fileName.endsWith(".vtt") || file.type === "text/vtt";

    if (!isTextFile && !isVTTFile) {
      toast.error("Please upload a .txt or .vtt file");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    try {
      toast.info("📖 Reading transcript file...");

      // Read file content
      const fileContent = await file.text();

      if (!fileContent || !fileContent.trim()) {
        toast.error("File is empty");
        return;
      }

      // Parse content based on file type
      let transcriptText = fileContent;

      if (isVTTFile) {
        console.log("🎬 Parsing VTT file...");
        transcriptText = fileContent;
      }

      console.log(
        "📝 Transcript extracted:",
        transcriptText.substring(0, 100) + "..."
      );
      console.log("📊 Transcript length:", transcriptText.length, "characters");

      // Save transcript to IndexedDB
      const recordingData = {
        title: `Uploaded: ${file.name}`,
        transcript: transcriptText,
        duration: 0, // No audio, so duration is 0
        timestamp: new Date().toISOString(),
        audioBlob: null, // No audio file
        fileType: file.type,
        words: getWordCount(transcriptText),
        source: "upload", // Mark as uploaded
        originalFileName: file.name,
      };

      console.log("💾 Saving uploaded transcript to database...");
      const savedId = await RecordingService.addRecording(recordingData);
      console.log("✅ Transcript saved with ID:", savedId);

      // Set state to show transcript view
      setUploadedFile(file);
      setUploadedTranscript(transcriptText);
      setSavedRecordingId(savedId);
      setTranscriptViewKey(Date.now());
      setShowTranscriptView(true);

      toast.success(`✅ ${file.name} uploaded successfully!`);
    } catch (error) {
      console.error("❌ Error reading file:", error);
      toast.error("Failed to read file: " + error.message);
    }
  };

  // Handle start recording
  const handleStartRecording = async () => {
    // Reset states
    setRecordingComplete(false);
    setShowTranscript(false);
    setSavedRecordingId(null);
    setShowTranscriptView(false);
    setUploadedFile(null);
    setUploadedTranscript(null);

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
    console.log("📊 Recording stopped with:", result);
    setRecordingComplete(true);
  };

  // Save recording to IndexedDB
  const saveRecording = async () => {
    console.log("💾 Saving recording to database...");

    if (!audioBlob) {
      console.error("❌ No audio blob available");
      return;
    }

    try {
      const transcriptToSave = finalTranscript || "";

      const recordingData = {
        title: `Recording ${new Date().toLocaleString()}`,
        transcript: transcriptToSave,
        duration: recordingDuration,
        timestamp: new Date().toISOString(),
        audioBlob: audioBlob,
        fileType: audioBlob.type,
        words: getWordCount(transcriptToSave),
        source: "recording", // Mark as recorded
      };

      console.log("📦 Saving recording:", {
        title: recordingData.title,
        transcriptLength: recordingData.transcript.length,
        transcriptPreview: recordingData.transcript.substring(0, 50),
        duration: recordingData.duration,
        words: recordingData.words,
        blobSize: audioBlob.size,
      });

      const savedId = await RecordingService.addRecording(recordingData);
      console.log("✅ Recording saved with ID:", savedId);

      setSavedRecordingId(savedId);
      toast.success("✅ Recording saved successfully!");
    } catch (error) {
      console.error("❌ Error saving recording:", error);
      toast.error("Failed to save recording: " + error.message);
    }
  };

  const handleReturnToDashboard = () => {
    resetRecording();
    setRecordingComplete(false);
    setShowTranscript(false);
    setShowTranscriptView(false);
    setUploadedFile(null);
    setUploadedTranscript(null);
    toast.info("Ready to start a new recording");
  };

  // Handle show transcript - Update key
  const handleShowTranscriptAndSummary = () => {
    const transcriptToShow = finalTranscript || uploadedTranscript;

    if (!transcriptToShow) {
      toast.error("No transcript available");
      return;
    }

    console.log("📄 Opening transcript view with NEW key");
    setTranscriptViewKey(Date.now());
    setShowTranscriptView(true);
  };

  // Handle close transcript view
  const handleCloseTranscriptView = () => {
    setShowTranscriptView(false);
  };

  const hasTranscript = isRecording ? !!liveTranscript : !!finalTranscript;

  // ✅ Determine which transcript to show (recorded or uploaded)
  const displayTranscript = uploadedTranscript || finalTranscript;
  const recordingTitle = uploadedFile
    ? `Uploaded: ${uploadedFile.name}`
    : `Recording ${new Date().toLocaleString()}`;

  return (
    <>
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
                  {isPaused ? "Recording paused" : "Recording in progress..."}
                </span>
              </div>

              <AudioVisualizer
                isRecording={isRecording && !isPaused}
                audioUrl={audioUrl}
                listening={listening && !isPaused}
              />

              <div className="recording-info">
                <div className="duration">
                  {formatDuration(recordingDuration)}
                </div>
                <div className="word-count">
                  {getWordCount(liveTranscript)} words
                </div>
              </div>

              <div className="recording-controls">
                <button
                  className={`control-btn pause-btn ${
                    isPaused ? "resume" : ""
                  }`}
                  onClick={handlePauseResume}
                >
                  <span className="pause-icon">{isPaused ? "▶" : "⏸"}</span>
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <button
                  className="control-btn stop-btn"
                  onClick={handleStopRecording}
                >
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
            onStartNewRecording={handleReturnToDashboard}
            onShowTranscript={handleShowTranscriptAndSummary}
            duration={formatDuration(recordingDuration)}
            wordCount={getWordCount(finalTranscript)}
          />
        )}

        {/* Transcript and AI Summary View */}
        {showTranscriptView && (
          <TranscriptSummaryView
            transcript={displayTranscript}
            recordingId={savedRecordingId}
            onClose={handleCloseTranscriptView}
            onStartNewRecording={handleReturnToDashboard}
            recordingTitle={recordingTitle}
            key={transcriptViewKey}
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
    </>
  );
};

export default Dashboard;
