// src/modules/Dashboard/components/TranscriptSummaryView/TranscriptSummaryView.jsx
import React, { useState } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import './TranscriptSummaryView.scss';

const TranscriptSummaryView = ({ 
  transcript, 
  onClose, 
  onStartNewRecording,
  recordingTitle = "Transcript 1"
}) => {
  const [aiSummary, setAiSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate AI Summary (placeholder - will integrate with actual AI later)
  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    toast.info('Generating AI summary...');

    // Simulate AI processing
    setTimeout(() => {
      // Simple extractive summary (first 3 sentences)
      const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [];
      const summary = sentences.slice(0, 3).join(' ').trim();
      
      setAiSummary(summary || 'No summary available. The transcript might be too short.');
      setIsGenerating(false);
      toast.success('AI summary generated!');
    }, 2000);
  };

  // Regenerate summary
  const handleRegenerate = () => {
    handleGenerateSummary();
  };

  // Save transcript and summary
  const handleSave = () => {
    const data = {
      title: recordingTitle,
      transcript: transcript,
      summary: aiSummary,
      timestamp: new Date().toISOString(),
    };

    console.log('💾 Saving:', data);
    toast.success('Transcript and summary saved!');
    
    // TODO: Save to database or local storage
  };

  // Export as file
  const handleExport = () => {
    const content = `
${recordingTitle}
Generated: ${new Date().toLocaleString()}

=== FINAL TRANSCRIPT ===
${transcript}

=== AI SUMMARY ===
${aiSummary || 'No summary generated yet.'}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recordingTitle.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Transcript exported!');
  };

  // Auto-generate summary on mount
  React.useEffect(() => {
    if (transcript && !aiSummary) {
      handleGenerateSummary();
    }
  }, []);

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
            <h3 className="panel-title">AI Summary</h3>
            <div className="panel-content">
              {isGenerating ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Generating AI summary...</p>
                </div>
              ) : aiSummary ? (
                <p className="summary-text">{aiSummary}</p>
              ) : (
                <p className="empty-message">Click "Regenerate" to create a summary</p>
              )}
            </div>

            {/* Summary Actions */}
            <div className="summary-actions">
              <button 
                className="action-btn regenerate-btn"
                onClick={handleRegenerate}
                disabled={isGenerating}
              >
                🔄 Regenerate
              </button>
              <div className="action-buttons-row">
                <button 
                  className="action-btn save-btn"
                  onClick={handleSave}
                >
                  💾 Save
                </button>
                <button 
                  className="action-btn export-btn"
                  onClick={handleExport}
                >
                  📤 Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Start New Recording */}
        <div className="transcript-footer">
          <button 
            className="new-recording-btn"
            onClick={onStartNewRecording}
          >
            🎤 Start New Recording
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptSummaryView;

