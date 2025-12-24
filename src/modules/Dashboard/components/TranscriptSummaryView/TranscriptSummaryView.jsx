// src/modules/Dashboard/components/TranscriptSummaryView/TranscriptSummaryView.jsx
import React, { useEffect, useRef } from "react";
import { CloseOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import useAISummary from "../../../../hooks/useAISummary";
import { RecordingService } from "../../../../services/recordingDB";
import "./TranscriptSummaryView.scss";
import { useNavigate } from "react-router-dom";

const TranscriptSummaryView = ({
  transcript,
  recordingId, // ✅ NEW prop
  onClose,
  onStartNewRecording,
  recordingTitle = "Transcript 1",
}) => {
  const {
    summary: aiSummary,
    isGenerating,
    error: summaryError,
    generateSummary,
    loadSummary,
    stopGeneration,
    resetSummary,
  } = useAISummary();

  const navigate = useNavigate();

  const transcriptRef = useRef(transcript);
  const recordingIdRef = useRef(recordingId);
  const generationTriggeredRef = useRef(false);

  const handleCheckActionItems = () => {
    if (recordingId) {
      navigate(`/action-items/${recordingId}`);
    } else {
      console.error("No recording ID available");
    }
  };

  useEffect(() => {
    console.log("🔵 TranscriptSummaryView mounted");
    console.log("📊 Recording ID:", recordingId);

    transcriptRef.current = transcript;
    recordingIdRef.current = recordingId;

    if (!transcript?.trim()) {
      console.error("❌ No transcript available");
      toast.error("No transcript available");
      return;
    }

    if (generationTriggeredRef.current) {
      console.log("⚠️ Already triggered");
      return;
    }

    generationTriggeredRef.current = true;

    // ✅ Load from DB first, generate only if needed
    const initializeSummary = async () => {
      if (recordingId) {
        console.log("📖 Checking database for existing summary...");

        try {
          const existingSummary = await loadSummary(recordingId);

          if (existingSummary) {
            console.log("✅ Found existing summary in database");
            toast.success("Summary loaded from database");
            return; // ✅ Don't generate if we already have one
          }
        } catch (error) {
          console.error("❌ Error loading summary:", error);
        }
      }

      // ✅ No existing summary, generate new one
      console.log("🚀 No existing summary found, generating new one...");

      setTimeout(() => {
        toast.info("Generating AI summary...");
        generateSummary(transcript, recordingId);
      }, 100);
    };

    initializeSummary();

    return () => {
      console.log("🔵 TranscriptSummaryView cleanup");
    };
  }, []); // ✅ Empty deps - run once

  useEffect(() => {
    if (summaryError) {
      toast.error(summaryError);
    }
  }, [summaryError]);

  // ✅ Regenerate: Overwrite existing summary in DB
  const handleRegenerate = async () => {
    console.log("🔄 Manual regeneration requested");

    // Confirm if summary already exists
    if (aiSummary) {
      const confirmed = window.confirm(
        "This will overwrite the existing summary. Continue?"
      );
      if (!confirmed) return;
    }

    generationTriggeredRef.current = false;
    resetSummary();

    setTimeout(() => {
      generationTriggeredRef.current = true;
      toast.info("Regenerating AI summary...");
      // ✅ This will overwrite in DB via saveSummary()
      generateSummary(transcriptRef.current, recordingIdRef.current);
    }, 150);
  };

  // ✅ Save is automatic now, just confirm
  const handleSave = () => {
    if (!aiSummary) {
      toast.warning("No summary to save");
      return;
    }

    // Summary is automatically saved to DB after generation
    toast.success("Summary is already saved in database!");
    console.log("💾 Summary already saved for recording:", recordingId);
  };

  // ✅ Export transcript and summary as text file
  const handleExport = () => {
    if (!transcript) {
      toast.error("No transcript to export");
      return;
    }

    const content = `
${recordingTitle}
Generated: ${new Date().toLocaleString()}

=== FINAL TRANSCRIPT ===
${transcript}

=== AI SUMMARY ===
${aiSummary || "No summary generated yet."}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${recordingTitle.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Transcript and summary exported!");
  };

  // ✅ Export using RecordingService (includes all metadata)
  const handleExportFromDB = async () => {
    if (!recordingId) {
      toast.error("Recording ID not found");
      return;
    }

    try {
      const recording = await RecordingService.getRecording(recordingId);

      if (!recording) {
        toast.error("Recording not found in database");
        return;
      }

      RecordingService.exportRecordingAsText(recording);
      toast.success("Recording exported successfully!");
    } catch (error) {
      console.error("❌ Error exporting recording:", error);
      toast.error("Failed to export recording");
    }
  };

  return (
    <div className="transcript-summary-overlay">
      <div className="transcript-summary-container">
        {/* Header */}
        <div className="transcript-header">
          <h2 className="transcript-title">{recordingTitle}</h2>
          <button className="close-btn" onClick={onClose}>
            <CloseOutlined />
          </button>
        </div>

        {/* Content - Split View */}
        <div className="transcript-content">
          {/* Left Side - Final Transcript */}
          <div className="content-panel transcript-panel">
            <h3 className="panel-title">Final Transcript</h3>
            <div className="panel-content">
              {transcript ? (
                <p className="transcript-text">{transcript}</p>
              ) : (
                <p className="empty-message">No transcript available</p>
              )}
            </div>
          </div>

          {/* Right Side - AI Summary */}
          <div className="content-panel summary-panel">
            <h3 className="panel-title">
              AI Summary
              {aiSummary && (
                <span className="summary-badge"> Saved to Database</span>
              )}
            </h3>
            <div className="panel-content">
              {isGenerating ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Generating AI summary...</p>
                  <p className="loading-note">
                    Collecting response from server...
                  </p>
                  <button className="stop-btn" onClick={stopGeneration}>
                    Stop Generation
                  </button>
                </div>
              ) : summaryError ? (
                <div className="error-state">
                  <p className="error-message">❌ {summaryError}</p>
                  <button className="retry-btn" onClick={handleRegenerate}>
                    Retry
                  </button>
                </div>
              ) : aiSummary ? (
                <p className="summary-text">{aiSummary}</p>
              ) : (
                <div className="empty-state">
                  <p className="empty-message">No summary available yet</p>
                  <button className="generate-btn" onClick={handleRegenerate}>
                    Generate Summary
                  </button>
                </div>
              )}
            </div>

            {/* Summary Actions */}
            <div className="summary-actions">
              <button
                className="action-btn regenerate-btn"
                onClick={handleRegenerate}
                disabled={isGenerating}
                title={
                  aiSummary
                    ? "Regenerate (will overwrite existing)"
                    : "Generate new summary"
                }
              >
                🔄 {aiSummary ? "Regenerate" : "Generate"}
              </button>
              <div className="action-buttons-row">
                <button
                  className="action-btn save-btn"
                  onClick={handleSave}
                  disabled={!aiSummary || isGenerating}
                  title="Summary is automatically saved to database"
                >
                  💾 Save
                </button>
                <button
                  className="action-btn export-btn"
                  onClick={handleExport}
                  disabled={isGenerating}
                  title="Export transcript and summary as text file"
                >
                  📤 Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Start New Recording */}
        <div className="transcript-footer">
          <button className="new-recording-btn" onClick={onStartNewRecording}>
            🎤 Start New Recording
          </button>

          {/* NEW: Check Action Items Button */}
          <button className="action-items-btn" onClick={handleCheckActionItems}>
            ✅ Check Action Items
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptSummaryView;
