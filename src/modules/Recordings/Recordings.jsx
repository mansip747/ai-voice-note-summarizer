// src/modules/Recordings/Recordings.jsx
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Typography,
  Input,
  Popconfirm,
  Tag,
} from "antd";
import {
  PlayCircleOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { RecordingService } from "../../services/recordingDB";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import "./Recordings.scss";

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const Recordings = () => {
  // State
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // Load recordings on mount
  useEffect(() => {
    loadRecordings();
  }, []);

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

  // Format duration (seconds to MM:SS)
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle play recording
  const handlePlay = (record) => {
    if (!record.audioBlob) {
      toast.error("No audio data available");
      return;
    }

    try {
      const url = URL.createObjectURL(record.audioBlob);
      const audio = new Audio(url);

      audio.play();
      toast.info(`▶️ Playing: ${record.title}`);

      // Clean up URL after playback ends
      audio.onended = () => {
        URL.revokeObjectURL(url);
        toast.success("Playback finished");
      };

      // Handle errors
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        toast.error("Error playing audio");
      };
    } catch (error) {
      console.error("Error playing audio:", error);
      toast.error("Failed to play audio");
    }
  };

  // Handle download recording
  const handleDownload = (record) => {
    try {
      RecordingService.downloadRecording(record);
      toast.success("⬇️ Download started");
    } catch (error) {
      toast.error("Failed to download recording");
    }
  };

  // Handle delete recording
  const handleDelete = async (id) => {
    try {
      await RecordingService.deleteRecording(id);
      toast.success("🗑️ Recording deleted");
      loadRecordings(); // Reload the list
    } catch (error) {
      toast.error("Failed to delete recording");
    }
  };

  // Handle view transcript
  const handleViewTranscript = (record) => {
    setSelectedRecording(record);
    setEditedTitle(record.title);
    setIsModalVisible(true);
    setIsEditingTitle(false);
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

  // Table columns configuration
  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: "30%",
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
      width: "20%",
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      sortDirections: ["ascend", "descend", "ascend"],
      defaultSortOrder: "descend", // Latest first by default
      render: (timestamp) => (
        <div>
          <div>{dayjs(timestamp).format("MMM DD, YYYY")}</div>
          <div className="time-text">{dayjs(timestamp).format("hh:mm A")}</div>
        </div>
      ),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      width: "12%",
      sorter: (a, b) => a.duration - b.duration,
      sortDirections: ["ascend", "descend", "ascend"],
      render: (duration) => (
        <Tag color="blue" icon={<ClockCircleOutlined />}>
          {formatDuration(duration)}
        </Tag>
      ),
    },
    {
      title: "Words",
      dataIndex: "words",
      key: "words",
      width: "10%",
      sorter: (a, b) => a.words - b.words,
      sortDirections: ["ascend", "descend", "ascend"],
      render: (words) => <Tag color="green">{words} words</Tag>,
    },
    {
      title: "Transcript Preview",
      dataIndex: "transcript",
      key: "transcript",
      width: "23%",
      ellipsis: true,
      sorter: (a, b) => {
        const textA = a.transcript || "";
        const textB = b.transcript || "";
        return textA.localeCompare(textB);
      },
      sortDirections: ["ascend", "descend", "ascend"],
      render: (text) => (
        <div className="transcript-preview">
          {text
            ? text.substring(0, 80) + (text.length > 80 ? "..." : "")
            : "No transcript"}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "15%",
      fixed: "right",
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="primary"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handlePlay(record)}
            title="Play Recording"
          />
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleViewTranscript(record)}
            title="View Transcript"
          />
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
            title="Download Audio"
          />
          <Popconfirm
            title="Delete this recording?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              title="Delete"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
        scroll={{ x: 1200 }}
      />

      {/* Transcript Modal */}
      <Modal
        title={
          <div className="modal-title">
            {isEditingTitle ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onPressEnter={handleSaveTitle}
                autoFocus
                placeholder="Enter recording title"
              />
            ) : (
              <span>{selectedRecording?.title}</span>
            )}
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                if (isEditingTitle) {
                  handleSaveTitle();
                } else {
                  setIsEditingTitle(true);
                }
              }}
            >
              {isEditingTitle ? "Save" : "Edit"}
            </Button>
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setIsEditingTitle(false);
        }}
        footer={[
          <Button
            key="copy"
            onClick={() => {
              navigator.clipboard.writeText(
                selectedRecording?.transcript || ""
              );
              toast.success("📋 Transcript copied to clipboard!");
            }}
          >
            📋 Copy Transcript
          </Button>,
          <Button key="play" onClick={() => handlePlay(selectedRecording)}>
            ▶️ Play Audio
          </Button>,
          <Button
            key="download"
            type="primary"
            onClick={() => handleDownload(selectedRecording)}
          >
            <DownloadOutlined /> Download Audio
          </Button>,
        ]}
        width={800}
      >
        {selectedRecording && (
          <div className="modal-content">
            {/* Metadata Tags */}
            <div className="modal-meta">
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

            {/* Full Transcript */}
            <div className="transcript-full">
              <Title level={5}>Full Transcript:</Title>
              <TextArea
                value={
                  selectedRecording.transcript || "No transcript available"
                }
                rows={12}
                readOnly
                className="transcript-textarea"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Recordings;
