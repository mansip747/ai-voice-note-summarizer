// src/modules/ActionItems/ActionItems.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Button, Typography, Tag, Spin, Empty } from "antd";
import {
  FolderOpenOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { RecordingService } from "../../services/recordingDB";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import ActionItemDetail from "./components/ActionItemDetail";
import "./ActionItems.scss";

const { Title, Paragraph } = Typography;

const ActionItems = () => {
  const { id } = useParams(); // Get recording ID from URL
  const navigate = useNavigate();

  // State
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load recordings on mount (only if in list view)
  useEffect(() => {
    if (!id) {
      loadRecordings();
    }
  }, [id]);

  // Load all recordings that have AI summaries
  const loadRecordings = async () => {
    setLoading(true);
    try {
      const allRecordings = await RecordingService.getAllRecordings();

      // Filter only recordings that have AI summaries
      const recordingsWithSummaries = allRecordings.filter(
        (recording) => recording.summary && recording.summary.trim() !== ""
      );

      console.log(
        `📊 Total recordings: ${allRecordings.length}, With summaries: ${recordingsWithSummaries.length}`
      );

      setRecordings(recordingsWithSummaries);
    } catch (error) {
      console.error("Error loading recordings:", error);
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

  // Handle open recording detail
  const handleOpenRecording = (recordingId) => {
    console.log("📂 Opening action items for recording:", recordingId);
    navigate(`/action-items/${recordingId}`);
  };

  // If ID exists in URL, show detail view
  if (id) {
    return <ActionItemDetail recordingId={id} />;
  }

  // Otherwise, show list view
  // Table columns
  const columns = [
    {
      title: "Recording Title",
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
      title: "Summary Preview",
      dataIndex: "summary",
      key: "summary",
      width: "30%",
      ellipsis: true,
      render: (text) => (
        <div className="summary-preview">
          <Tag color="purple" icon={<FileTextOutlined />}>
            AI Summary Available
          </Tag>
          <div className="summary-text">
            {text
              ? text.substring(0, 80) + (text.length > 80 ? "..." : "")
              : "No summary"}
          </div>
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
          onClick={() => handleOpenRecording(record.id)}
          size="middle"
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <div className="action-items-page">
      {/* Header Section */}
      <div className="action-items-header">
        <div>
          <Title level={2}>✅ Action Items</Title>
          <Paragraph>
            Recordings with AI-generated summaries and action items
          </Paragraph>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-value">{recordings.length}</div>
            <div className="stat-label">Available Recordings</div>
          </div>
        </div>
      </div>

      {/* Recordings Table */}
      {loading ? (
        <div className="loading-container">
          <Spin size="large" tip="Loading recordings..." />
        </div>
      ) : recordings.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <p>No recordings with AI summaries found</p>
              <p className="empty-hint">
                Record something from Home and generate an AI summary first
              </p>
            </div>
          }
        />
      ) : (
        <Table
          columns={columns}
          dataSource={recordings}
          rowKey="id"
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
          scroll={{ x: 1000 }}
        />
      )}
    </div>
  );
};

export default ActionItems;
