// src/modules/ActionItems/components/ActionItemDetail/ActionItemDetail.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Spin,
  Typography,
  Tag,
  Space,
  Card,
  Empty,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  CopyOutlined,
  StopOutlined,
  InfoCircleOutlined,
  CheckSquareOutlined,
  ClockCircleFilled,
} from "@ant-design/icons";
import { RecordingService } from "../../../../services/recordingDB";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import useAIPrompt from "../../../../hooks/useAIPrompt";
import "./ActionItemDetail.scss";

const { Title, Text, Paragraph } = Typography;

const ActionItemDetail = ({ recordingId }) => {
  const navigate = useNavigate();

  // State
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionItems, setActionItems] = useState([]);
  const [followUpResponses, setFollowUpResponses] = useState({});
  const [activeActionItemId, setActiveActionItemId] = useState(null);

  // AI Prompt Hook
  const {
    response: aiResponse,
    isGenerating: isGeneratingAI,
    error: aiError,
    generatePrompt,
    stopGeneration,
    resetResponse,
  } = useAIPrompt();

  // Load recording on mount
  useEffect(() => {
    loadRecording();
  }, [recordingId]);

  // Listen for AI response completion
  useEffect(() => {
    if (aiResponse && !isGeneratingAI && activeActionItemId !== null) {
      console.log("✅ AI Response received:", aiResponse.substring(0, 100));

      // Update local state
      setFollowUpResponses((prev) => ({
        ...prev,
        [activeActionItemId]: aiResponse,
      }));

      // Save to database
      saveFollowUpToDatabase(activeActionItemId, aiResponse);

      setActiveActionItemId(null);
      toast.success("✨ Follow-up response generated and saved!");

      // Reset AI response for next generation
      setTimeout(() => resetResponse(), 500);
    }
  }, [aiResponse, isGeneratingAI, activeActionItemId]);

  // Handle AI errors
  useEffect(() => {
    if (aiError && activeActionItemId !== null) {
      console.error("❌ AI Error:", aiError);
      toast.error(`Failed to generate: ${aiError}`);
      setActiveActionItemId(null);
    }
  }, [aiError, activeActionItemId]);

  // ✅ Parse follow-up response into structured sections
  const parseFollowUpResponse = (response) => {
    if (!response) return null;

    const sections = {
      context: "",
      nextSteps: "",
      timeline: "",
      hasStructure: false,
    };

    // Extract Context - AS-IS
    const contextMatch = response.match(
      /Context:(.+?)(?=Next Steps:|Timeline:|$)/is
    );
    if (contextMatch) {
      sections.context = contextMatch[1].trim();
      sections.hasStructure = true;
    }

    // Extract Next Steps - AS-IS
    const stepsMatch = response.match(/Next Steps:(.+?)(?=Timeline:|$)/is);
    if (stepsMatch) {
      sections.nextSteps = stepsMatch[1].trim();
      sections.hasStructure = true;
    }

    // Extract Timeline - AS-IS
    const timelineMatch = response.match(/Timeline:(.+?)$/is);
    if (timelineMatch) {
      sections.timeline = timelineMatch[1].trim();
      sections.hasStructure = true;
    }

    return sections.hasStructure ? sections : null;
  };

  // Save follow-up to database
  const saveFollowUpToDatabase = async (actionItemId, followUpText) => {
    try {
      console.log("💾 Saving follow-up to database...");

      await RecordingService.updateActionItemFollowUp(
        parseInt(recordingId),
        actionItemId,
        followUpText
      );

      console.log("✅ Follow-up saved to database");
    } catch (error) {
      console.error("❌ Error saving follow-up:", error);
      toast.warning("Follow-up generated but failed to save to database");
    }
  };

  // Load recording data
  const loadRecording = async () => {
    setLoading(true);
    try {
      const data = await RecordingService.getRecording(parseInt(recordingId));

      if (!data) {
        toast.error("Recording not found");
        navigate("/action-items");
        return;
      }

      if (!data.summary) {
        toast.error("No AI summary found for this recording");
        navigate("/action-items");
        return;
      }

      setRecording(data);

      // Check if action items exist in database
      if (data.actionItems && data.actionItems.length > 0) {
        console.log("📖 Loading action items from database");
        console.log("📊 Number of items:", data.actionItems.length);

        setActionItems(data.actionItems);

        // Load saved follow-ups
        const savedFollowUps = {};
        data.actionItems.forEach((item) => {
          if (item.followUp) {
            savedFollowUps[item.id] = item.followUp;
          }
        });

        setFollowUpResponses(savedFollowUps);

        console.log(
          "✅ Loaded",
          Object.keys(savedFollowUps).length,
          "saved follow-ups"
        );
      } else {
        // Extract fresh action items from summary
        console.log("🔄 Extracting action items from summary");
        const extractedItems = extractActionItems(data.summary);
        setActionItems(extractedItems);

        // Save extracted action items to database
        await RecordingService.saveActionItems(
          parseInt(recordingId),
          extractedItems
        );
        console.log("✅ Action items extracted and saved to database");
      }

      console.log("📋 Recording loaded:", data.title);
    } catch (error) {
      console.error("Error loading recording:", error);
      toast.error("Failed to load recording");
      navigate("/action-items");
    } finally {
      setLoading(false);
    }
  };

  // Extract action items from AI summary (fallback)
  const extractActionItems = (summary) => {
    if (!summary) return [];

    const lines = summary.split("\n");
    const items = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Match patterns like: "- item", "* item", "1. item", "• item"
      const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
      const numberMatch = trimmed.match(/^\d+\.\s+(.+)$/);

      if (bulletMatch) {
        items.push({
          id: index,
          text: bulletMatch[1].trim(),
        });
      } else if (numberMatch) {
        items.push({
          id: index,
          text: numberMatch[1].trim(),
        });
      }
    });

    // If no bullet points found, split by sentences
    if (items.length === 0) {
      const sentences = summary
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20);

      return sentences.slice(0, 5).map((sentence, index) => ({
        id: index,
        text: sentence,
      }));
    }

    return items;
  };

  // Build smart prompt based on action item
  const buildFollowUpPrompt = (actionItemText) => {
    const lowerText = actionItemText.toLowerCase();

    // Email-related action
    if (lowerText.includes("email") || lowerText.includes("mail")) {
      return `Generate a professional follow-up response for this action item: "${actionItemText}".

Structure your response with these sections:

Context: Briefly explain the context and background of this action item.

Next Steps: List specific actionable steps to complete this task.

Timeline: Provide a realistic timeline for completion.

Make it professional and actionable.`;
    }

    // Meeting-related action
    if (
      lowerText.includes("schedule") ||
      lowerText.includes("meeting") ||
      lowerText.includes("call")
    ) {
      return `Generate a professional follow-up response for this action item: "${actionItemText}".

Structure your response with these sections:

Context: Explain the purpose and background of this meeting/call.

Next Steps: List specific steps to schedule and prepare for this meeting.

Timeline: Suggest timeframes for scheduling and any preparation needed.

Be clear and professional.`;
    }

    // Default generic action
    return `Generate a professional follow-up response for this action item: "${actionItemText}".

Structure your response with these sections:

Context: Explain the background and importance of this action.

Next Steps: List clear, actionable steps to complete this task.

Timeline: Provide estimated timeframes for each step.

Be specific and actionable.`;
  };

  // Generate follow-up response for action item
  const generateFollowUp = async (actionItem) => {
    const itemId = actionItem.id;

    console.log("🤖 Generating follow-up for:", actionItem.text);

    // Set active item
    setActiveActionItemId(itemId);

    try {
      // Build smart prompt
      const prompt = buildFollowUpPrompt(actionItem.text);

      console.log("📤 Sending prompt to AI...");

      // Generate using AI
      await generatePrompt(prompt);
    } catch (error) {
      console.error("Error generating follow-up:", error);
      toast.error("Failed to generate follow-up response");
      setActiveActionItemId(null);
    }
  };

  // Stop follow-up generation
  const handleStopGeneration = () => {
    stopGeneration();
    setActiveActionItemId(null);
    toast.info("Generation stopped");
  };

  // Regenerate follow-up
  const handleRegenerateFollowUp = async (actionItem) => {
    const itemId = actionItem.id;

    console.log("🔄 Regenerating follow-up for:", actionItem.text);

    // Clear existing response from state and database
    setFollowUpResponses((prev) => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });

    try {
      // Delete from database
      await RecordingService.deleteActionItemFollowUp(
        parseInt(recordingId),
        itemId
      );
      console.log("🗑️ Old follow-up deleted from database");

      // Generate new one
      generateFollowUp(actionItem);
    } catch (error) {
      console.error("Error regenerating follow-up:", error);
      toast.error("Failed to regenerate follow-up");
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate("/action-items");
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Copy follow-up to clipboard
  const handleCopyFollowUp = (followUpText) => {
    navigator.clipboard.writeText(followUpText);
    toast.success("📋 Follow-up response copied to clipboard!");
  };

  // Copy transcript
  const handleCopyTranscript = () => {
    if (!recording?.transcript) {
      toast.error("No transcript to copy");
      return;
    }
    navigator.clipboard.writeText(recording.transcript);
    toast.success("📋 Transcript copied to clipboard!");
  };

  // Copy summary
  const handleCopySummary = () => {
    if (!recording?.summary) {
      toast.error("No summary to copy");
      return;
    }
    navigator.clipboard.writeText(recording.summary);
    toast.success("📋 Summary copied to clipboard!");
  };

  // ✅ NEW: Render structured follow-up response
  const renderFollowUpResponse = (response) => {
    const parsed = parseFollowUpResponse(response);

    // If no structure found, show raw text
    if (!parsed) {
      return (
        <div className="follow-up-content raw-text">
          <Text className="follow-up-text">{response}</Text>
        </div>
      );
    }

    // Show structured sections
    return (
      <div className="follow-up-content structured">
        {/* Context Section */}
        {parsed.context && (
          <div className="follow-up-section context-section">
            <div className="section-header">
              <InfoCircleOutlined className="section-icon" />
              <Text strong className="section-title">
                Context
              </Text>
            </div>
            <Paragraph className="section-content">{parsed.context}</Paragraph>
          </div>
        )}

        {/* Next Steps Section */}
        {parsed.nextSteps && (
          <div className="follow-up-section steps-section">
            <div className="section-header">
              <CheckSquareOutlined className="section-icon" />
              <Text strong className="section-title">
                Next Steps
              </Text>
            </div>
            <div className="section-content">
              {/* ✅ Display raw text without parsing */}
              <Paragraph className="steps-text">{parsed.nextSteps}</Paragraph>
            </div>
          </div>
        )}


        {/* Timeline Section */}
        {parsed.timeline && (
          <div className="follow-up-section timeline-section">
            <div className="section-header">
              <ClockCircleFilled className="section-icon" />
              <Text strong className="section-title">
                Timeline
              </Text>
            </div>
            <div className="section-content">
              {/* ✅ Use <pre> to preserve exact formatting */}
              <pre className="timeline-text">{parsed.timeline}</pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="action-item-detail-loading">
        <Spin size="large" tip="Loading recording..." />
      </div>
    );
  }

  if (!recording) {
    return null;
  }

  return (
    <div className="action-item-detail-page">
      {/* Header */}
      <div className="detail-header">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          size="large"
          className="back-btn"
        >
          Back to List
        </Button>

        <div className="recording-info">
          <Title level={2}>{recording.title}</Title>
          <Space size="middle" wrap>
            <Tag color="blue" icon={<ClockCircleOutlined />}>
              {formatDuration(recording.duration)}
            </Tag>
            <Tag color="green">{recording.words} words</Tag>
            <Tag color="purple">
              {dayjs(recording.timestamp).format("MMM DD, YYYY hh:mm A")}
            </Tag>
          </Space>
        </div>
      </div>

      {/* Three Panel Layout */}
      <div className="detail-content">
        {/* Left Panel - Transcript */}
        <div className="content-panel transcript-panel">
          <div className="panel-header">
            <FileTextOutlined />
            <h3>Transcript</h3>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopyTranscript}
            >
              Copy
            </Button>
          </div>
          <div className="panel-body">
            {recording.transcript ? (
              <Text className="transcript-text">{recording.transcript}</Text>
            ) : (
              <Empty description="No transcript available" />
            )}
          </div>
        </div>

        {/* Middle Panel - AI Summary */}
        <div className="content-panel summary-panel">
          <div className="panel-header">
            <CheckCircleOutlined />
            <h3>AI Summary</h3>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopySummary}
            >
              Copy
            </Button>
          </div>
          <div className="panel-body">
            {recording.summary ? (
              <Text className="summary-text">{recording.summary}</Text>
            ) : (
              <Empty description="No summary available" />
            )}
          </div>
        </div>

        {/* Right Panel - Action Items & Follow-Up */}
        <div className="content-panel actions-panel">
          <div className="panel-section">
            <div className="panel-header">
              <CheckCircleOutlined />
              <h3>Action Items</h3>
              <Tag color="blue">{actionItems.length}</Tag>
            </div>
            <div className="panel-body">
              {actionItems.length > 0 ? (
                <div className="action-items-list">
                  {actionItems.map((item) => {
                    const hasFollowUp = followUpResponses[item.id];
                    const isGenerating = activeActionItemId === item.id;

                    return (
                      <Card
                        key={item.id}
                        className="action-item-card"
                        size="small"
                      >
                        <div className="action-item-content">
                          {/* Action Buttons */}
                          <div className="action-buttons">
                            {isGenerating ? (
                              // Stop button during generation
                              <Button
                                danger
                                size="small"
                                icon={<StopOutlined />}
                                onClick={handleStopGeneration}
                                loading={isGeneratingAI}
                              >
                                Stop Generation
                              </Button>
                            ) : hasFollowUp ? (
                              // Regenerate button if follow-up exists
                              <Button
                                type="default"
                                size="small"
                                icon={<ReloadOutlined />}
                                onClick={() => handleRegenerateFollowUp(item)}
                              >
                                Regenerate
                              </Button>
                            ) : (
                              // Generate button if no follow-up
                              <Button
                                type="primary"
                                size="small"
                                icon={<ReloadOutlined />}
                                onClick={() => generateFollowUp(item)}
                              >
                                Generate Follow-Up
                              </Button>
                            )}
                          </div>

                          {/* Loading State */}
                          {isGenerating && isGeneratingAI && (
                            <div className="generating-indicator">
                              <Spin size="small" />
                              <Text type="secondary">
                                Generating response...
                              </Text>
                            </div>
                          )}

                          {/* Follow-Up Response - STRUCTURED */}
                          {hasFollowUp && (
                            <div className="follow-up-section">
                              <div className="follow-up-header">
                                <Text strong>Follow-Up Response</Text>
                                <Button
                                  size="small"
                                  icon={<CopyOutlined />}
                                  onClick={() =>
                                    handleCopyFollowUp(
                                      followUpResponses[item.id]
                                    )
                                  }
                                >
                                  Copy
                                </Button>
                              </div>

                              {/* ✅ NEW: Render structured or raw response */}
                              {renderFollowUpResponse(
                                followUpResponses[item.id]
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Empty
                  description="No action items extracted"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionItemDetail;
