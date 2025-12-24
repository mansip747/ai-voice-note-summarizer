// src/modules/Recordings/Recordings.jsx
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Typography,
  Input,
  Popconfirm,
  Tag,
  Spin,
} from "antd";
import {
  PlayCircleOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined,
  CloseOutlined,
  CopyOutlined,
  ExportOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { RecordingService } from "../../services/recordingDB";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import useAISummary from "../../hooks/useAISummary";
import "./Recordings.scss";

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const Recordings = () => {
  // State
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // AI Summary hook
  const {
    summary: aiSummary,
    isGenerating,
    error: summaryError,
    generateSummary,
    loadSummary,
    stopGeneration,
    resetSummary,
  } = useAISummary();

  // Load recordings on mount
  useEffect(() => {
    loadRecordings();
  }, []);

  // Load summary when recording is opened
  useEffect(() => {
    if (selectedRecording && isViewOpen) {
      console.log("📖 Loading summary for recording:", selectedRecording.id);
      loadExistingSummary(selectedRecording.id);
    }
  }, [selectedRecording, isViewOpen]);

  // Load all recordings from IndexedDB
  const loadRecordings = async () => {
    setLoading(true);
    try {
      const data = await RecordingService.getAllRecordings();
      setRecordings(data);
    } catch (error) {
      toast.error("Failed to load recordings");
    } finally {
      setLoading(false);
    }
  };

  // Load existing summary from database
  const loadExistingSummary = async (recordingId) => {
    try {
      await loadSummary(recordingId);
    } catch (error) {
      console.error("Error loading summary:", error);
    }
  };

  // Format duration (seconds to MM:SS)
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle open recording (new full-screen view)
  const handleOpenRecording = (record) => {
    console.log("📂 Opening recording:", record.id);
    setSelectedRecording(record);
    setEditedTitle(record.title);
    setIsViewOpen(true);
    setIsEditingTitle(false);
    resetSummary(); // Clear previous summary
  };

  // Handle close view
  const handleCloseView = () => {
    setIsViewOpen(false);
    setSelectedRecording(null);
    setIsEditingTitle(false);
    resetSummary();
  };

  // Handle play recording
  const handlePlay = () => {
    if (!selectedRecording?.audioBlob) {
      toast.error("No audio data available");
      return;
    }

    try {
      const url = URL.createObjectURL(selectedRecording.audioBlob);
      const audio = new Audio(url);

      audio.play();
      toast.info(`▶️ Playing: ${selectedRecording.title}`);

      audio.onended = () => {
        URL.revokeObjectURL(url);
        toast.success("Playback finished");
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        toast.error("Error playing audio");
      };
    } catch (error) {
      console.error("Error playing audio:", error);
      toast.error("Failed to play audio");
    }
  };

  // Handle copy transcript
  const handleCopyTranscript = () => {
    if (!selectedRecording?.transcript) {
      toast.error("No transcript to copy");
      return;
    }

    navigator.clipboard.writeText(selectedRecording.transcript);
    toast.success("📋 Transcript copied to clipboard!");
  };

  // Handle copy ai summary
  const handleCopyAiSummary = () => {
    if (!selectedRecording?.transcript) {
      toast.error("No Summary to copy");
      return;
    }

    navigator.clipboard.writeText(aiSummary);
    toast.success("📋 AI Summary copied to clipboard!");
  };

  // Handle download recording
  const handleDownload = () => {
    try {
      RecordingService.downloadRecording(selectedRecording);
      toast.success("⬇️ Download started");
    } catch (error) {
      toast.error("Failed to download recording");
      console.log(error);
    }
  };

  // Handle export as text
  const handleExport = () => {
    if (!selectedRecording) {
      toast.error("No recording selected");
      return;
    }

    try {
      RecordingService.exportRecordingAsText(selectedRecording);
      toast.success("📤 Recording exported!");
    } catch (error) {
      toast.error("Failed to export recording");
    }
  };

  // Handle delete recording
  const handleDelete = async () => {
    console.log("=== DELETE OPERATION START ===");
    console.log("1. selectedRecording:", selectedRecording);
    console.log("2. selectedRecording.id:", selectedRecording?.id);
    console.log("3. Type of ID:", typeof selectedRecording?.id);

    if (!selectedRecording?.id) {
      console.error("❌ No recording ID!");
      toast.error("Invalid recording ID");
      return;
    }

    const recordingId = selectedRecording.id;
    console.log("4. Recording ID to delete:", recordingId);

    try {
      // Step 1: Check if recording exists
      console.log("5. Fetching recording from DB...");
      const recordingBefore = await RecordingService.getRecording(recordingId);
      console.log("6. Recording found:", recordingBefore);

      if (!recordingBefore) {
        console.error("❌ Recording not found in DB!");
        toast.error("Recording not found");
        handleCloseView();
        await loadRecordings();
        return;
      }

      // Step 2: Delete
      console.log("7. Calling deleteRecording...");
      const result = await RecordingService.deleteRecording(recordingId);
      console.log("8. Delete result:", result);

      // Step 3: Verify deletion
      console.log("9. Verifying deletion...");
      const recordingAfter = await RecordingService.getRecording(recordingId);
      console.log("10. Recording after delete:", recordingAfter);

      if (recordingAfter) {
        console.error("❌ Recording still exists after delete!");
        toast.error("Delete failed - recording still exists");
        return;
      }

      // Success
      console.log("✅ Delete successful!");
      toast.success(
        `Recording "${selectedRecording.title}" deleted successfully`
      );

      // Close view
      handleCloseView();

      // Reload recordings
      await loadRecordings();
      console.log("=== DELETE OPERATION COMPLETE ===");
    } catch (error) {
      console.error("=== DELETE ERROR ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      toast.error(`Delete failed: ${error.message}`);

      // Try to recover by reloading
      handleCloseView();
      await loadRecordings();
    }
  };

  // Handle save title
  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    try {
      await RecordingService.updateRecording(selectedRecording.id, {
        title: editedTitle,
      });
      toast.success("✅ Title updated");
      setIsEditingTitle(false);
      loadRecordings();
      setSelectedRecording({ ...selectedRecording, title: editedTitle });
    } catch (error) {
      toast.error("Failed to update title");
    }
  };

  // Handle regenerate summary
  const handleRegenerateSummary = () => {
    if (!selectedRecording?.transcript) {
      toast.error("No transcript available");
      return;
    }

    const confirmed = window.confirm(
      "This will regenerate the AI summary. Continue?"
    );

    if (confirmed) {
      resetSummary();
      toast.info("Regenerating AI summary...");
      generateSummary(selectedRecording.transcript, selectedRecording.id);
    }
  };

  // Handle generate summary (if none exists)
  const handleGenerateSummary = () => {
    if (!selectedRecording?.transcript) {
      toast.error("No transcript available");
      return;
    }

    toast.info("Generating AI summary...");
    generateSummary(selectedRecording.transcript, selectedRecording.id);
  };

  // Table columns - Only show "Open" button
  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: "35%",
      sorter: (a, b) => a.title.localeCompare(b.title),
      sortDirections: ["ascend", "descend", "ascend"],
      render: (text, record) => (
        <div className="title-cell">
          <strong>{text}</strong>
          <div className="meta-info">
            <Tag color="blue" icon={<ClockCircleOutlined />}>
              {formatDuration(record.duration)}
            </Tag>
            <Tag color="green">{record.words} words</Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Date & Time",
      dataIndex: "timestamp",
      key: "timestamp",
      width: "25%",
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      sortDirections: ["ascend", "descend", "ascend"],
      defaultSortOrder: "descend",
      render: (timestamp) => (
        <div>
          <div>{dayjs(timestamp).format("MMM DD, YYYY")}</div>
          <div className="time-text">{dayjs(timestamp).format("hh:mm A")}</div>
        </div>
      ),
    },
    {
      title: "Transcript Preview",
      dataIndex: "transcript",
      key: "transcript",
      width: "30%",
      ellipsis: true,
      render: (text) => (
        <div className="transcript-preview">
          {text
            ? text.substring(0, 100) + (text.length > 100 ? "..." : "")
            : "No transcript"}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: "10%",
      fixed: "right",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<FolderOpenOutlined />}
          onClick={() => handleOpenRecording(record)}
          size="middle"
        >
          Open
        </Button>
      ),
    },
  ];

  // Render full-screen recording view
  const renderRecordingView = () => {
    if (!selectedRecording) return null;

    return (
      <div className="recording-view-overlay">
        <div className="recording-view-container">
          {/* Header */}
          <div className="recording-header">
            <div className="title-section">
              {isEditingTitle ? (
                <div className="title-edit">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onPressEnter={handleSaveTitle}
                    autoFocus
                    placeholder="Enter recording title"
                    size="large"
                  />
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveTitle}
                    size="large"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <div className="title-display">
                  <h1>{selectedRecording.title}</h1>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => setIsEditingTitle(true)}
                  >
                    Edit Title
                  </Button>
                </div>
              )}
              <div className="recording-meta">
                <Tag color="blue" icon={<ClockCircleOutlined />}>
                  {formatDuration(selectedRecording.duration)}
                </Tag>
                <Tag color="green">{selectedRecording.words} words</Tag>
                <Tag color="purple">
                  {dayjs(selectedRecording.timestamp).format(
                    "MMM DD, YYYY hh:mm A"
                  )}
                </Tag>
              </div>
            </div>
            <Button
              className="close-btn"
              icon={<CloseOutlined />}
              onClick={handleCloseView}
              size="large"
            />
          </div>

          {/* Content - Two Panels */}
          <div className="recording-content">
            {/* Left Panel - Final Transcript */}
            <div className="content-panel transcript-panel">
              <h3 className="panel-title">Final Transcript</h3>
              <div className="panel-content">
                {selectedRecording.transcript ? (
                  <p className="transcript-text">
                    {selectedRecording.transcript}
                  </p>
                ) : (
                  <p className="empty-message">No transcript available</p>
                )}
              </div>
            </div>

            {/* Right Panel - AI Summary */}
            <div className="content-panel summary-panel">
              <h3 className="panel-title">
                AI Summary
                {aiSummary && !isGenerating && (
                  <span className="summary-badge">✓ Saved</span>
                )}
              </h3>
              <div className="panel-content">
                {isGenerating ? (
                  <div className="loading-state">
                    <Spin size="large" />
                    <p>Generating AI summary...</p>
                    <p className="loading-note">
                      Collecting response from server...
                    </p>
                    <Button danger onClick={stopGeneration}>
                      Stop Generation
                    </Button>
                  </div>
                ) : summaryError ? (
                  <div className="error-state">
                    <p className="error-message">❌ {summaryError}</p>
                    <Button type="primary" onClick={handleRegenerateSummary}>
                      Retry
                    </Button>
                  </div>
                ) : aiSummary ? (
                  <p className="summary-text">{aiSummary}</p>
                ) : (
                  <div className="empty-state">
                    <p className="empty-message">No summary available yet</p>
                    <Button type="primary" onClick={handleGenerateSummary}>
                      Generate Summary
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons - Below Panels */}
          <div className="recording-actions">
            <Space size="middle" wrap>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handlePlay}
                size="large"
              >
                Play Audio
              </Button>
              <Button
                icon={<CopyOutlined />}
                onClick={handleCopyTranscript}
                size="large"
              >
                Copy Transcript
              </Button>
              <Button
                icon={<CopyOutlined />}
                onClick={handleCopyAiSummary}
                size="large"
              >
                Copy AI Summary
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                size="large"
              >
                Download Audio
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={handleExport}
                size="large"
              >
                Export Text
              </Button>
              {aiSummary && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRegenerateSummary}
                  disabled={isGenerating}
                  size="large"
                >
                  Regenerate Summary
                </Button>
              )}
              <Popconfirm
                title="Delete this recording?"
                description="This action cannot be undone."
                onClick={handleDelete}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} size="large">
                  Delete
                </Button>
              </Popconfirm>
            </Space>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="recordings-page">
      {/* Header Section */}
      <div className="recordings-header">
        <div>
          <Title level={2}>📼 Past Recordings</Title>
          <Paragraph>
            All your recorded audio sessions with transcripts
          </Paragraph>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-value">{recordings.length}</div>
            <div className="stat-label">Total Recordings</div>
          </div>
        </div>
      </div>

      {/* Recordings Table */}
      <Table
        columns={columns}
        dataSource={recordings}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} recordings`,
          pageSizeOptions: ["5", "10", "20", "50"],
        }}
        showSorterTooltip={{
          title: "Click to sort",
        }}
        sortDirections={["ascend", "descend", "ascend"]}
        locale={{
          emptyText: (
            <div className="empty-state">
              <PlayCircleOutlined style={{ fontSize: 48, color: "#ccc" }} />
              <p>No recordings yet</p>
              <p className="empty-hint">Start recording from Home</p>
            </div>
          ),
        }}
        scroll={{ x: 1000 }}
      />

      {/* Full-Screen Recording View */}
      {isViewOpen && renderRecordingView()}
    </div>
  );
};

export default Recordings;
