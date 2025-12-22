// src/modules/Settings/Settings.jsx
import React, { useState } from 'react';
import { Select, Switch, Card } from 'antd';
import { 
  AudioOutlined, 
  FileTextOutlined, 
  BulbOutlined, 
  ThunderboltOutlined 
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import './Settings.scss';

const { Option } = Select;

const Settings = () => {
  // Recording Settings
  const [microphone, setMicrophone] = useState('default');
  const [audioQuality, setAudioQuality] = useState('standard');
  const [autoPause, setAutoPause] = useState(true);

  // Transcription Settings
  const [language, setLanguage] = useState('auto');
  const [speakerDetection, setSpeakerDetection] = useState(true);
  const [showSpeakerLabels, setShowSpeakerLabels] = useState(true);

  // AI Summary Settings
  const [summaryStyle, setSummaryStyle] = useState('bullet');
  const [summaryLength, setSummaryLength] = useState('medium');

  // Advanced AI Settings
  const [autoSave, setAutoSave] = useState(true);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [includeTimestamps, setIncludeTimestamps] = useState(true);

  const handleSave = () => {
    toast.success('Settings saved successfully!');
    console.log('Settings:', {
      recording: { microphone, audioQuality, autoPause },
      transcription: { language, speakerDetection, showSpeakerLabels },
      aiSummary: { summaryStyle, summaryLength },
      advanced: { autoSave, exportFormat, includeTimestamps }
    });
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-content">
        {/* Recording Section */}
        <Card className="settings-card">
          <div className="card-header">
            <AudioOutlined className="card-icon" />
            <h2>Recording</h2>
          </div>

          <div className="setting-item">
            <label>Microphone:</label>
            <Select 
              value={microphone} 
              onChange={setMicrophone}
              style={{ width: '100%' }}
            >
              <Option value="default">Default system mic</Option>
              <Option value="external">External microphone</Option>
              <Option value="bluetooth">Bluetooth device</Option>
            </Select>
          </div>

          <div className="setting-item">
            <label>Audio Quality:</label>
            <Select 
              value={audioQuality} 
              onChange={setAudioQuality}
              style={{ width: '100%' }}
            >
              <Option value="low">Low (32 kbps)</Option>
              <Option value="standard">Standard (64 kbps)</Option>
              <Option value="high">High (128 kbps)</Option>
              <Option value="ultra">Ultra (256 kbps)</Option>
            </Select>
          </div>

          <div className="setting-item toggle">
            <label>Auto-pause on silence</label>
            <Switch checked={autoPause} onChange={setAutoPause} />
          </div>
        </Card>

        {/* Transcription Section */}
        <Card className="settings-card">
          <div className="card-header">
            <FileTextOutlined className="card-icon" />
            <h2>Transcription</h2>
          </div>

          <div className="setting-item">
            <label>Language:</label>
            <Select 
              value={language} 
              onChange={setLanguage}
              style={{ width: '100%' }}
            >
              <Option value="auto">Auto-detect</Option>
              <Option value="en">English</Option>
              <Option value="es">Spanish</Option>
              <Option value="fr">French</Option>
              <Option value="de">German</Option>
              <Option value="zh">Chinese</Option>
            </Select>
          </div>

          <div className="setting-item toggle">
            <div className="toggle-label">
              <label>Speaker Detection</label>
              <span className="status-badge">ON</span>
            </div>
            <Switch checked={speakerDetection} onChange={setSpeakerDetection} />
          </div>

          <div className="setting-item toggle">
            <div className="toggle-label">
              <label>Show Speaker Labels</label>
              <span className="status-badge">ON</span>
            </div>
            <Switch checked={showSpeakerLabels} onChange={setShowSpeakerLabels} />
          </div>
        </Card>

        {/* AI Summary Section */}
        <Card className="settings-card">
          <div className="card-header">
            <BulbOutlined className="card-icon" />
            <h2>AI Summary</h2>
          </div>

          <div className="setting-item">
            <label>Default Style:</label>
            <Select 
              value={summaryStyle} 
              onChange={setSummaryStyle}
              style={{ width: '100%' }}
            >
              <Option value="bullet">Bullet Points</Option>
              <Option value="paragraph">Paragraph</Option>
              <Option value="detailed">Detailed</Option>
              <Option value="brief">Brief</Option>
            </Select>
          </div>

          <div className="setting-item">
            <label>Summary Length:</label>
            <Select 
              value={summaryLength} 
              onChange={setSummaryLength}
              style={{ width: '100%' }}
            >
              <Option value="short">Short (1-2 sentences)</Option>
              <Option value="medium">Medium (3-5 sentences)</Option>
              <Option value="long">Long (6-10 sentences)</Option>
            </Select>
          </div>
        </Card>

        {/* Advanced AI Section */}
        <Card className="settings-card">
          <div className="card-header">
            <ThunderboltOutlined className="card-icon" />
            <h2>Advanced AI</h2>
          </div>

          <div className="setting-item toggle">
            <div className="toggle-label">
              <label>Auto-save recordings</label>
              <span className="status-badge">ON</span>
            </div>
            <Switch checked={autoSave} onChange={setAutoSave} />
          </div>

          <div className="setting-item">
            <label>Default Export Format:</label>
            <Select 
              value={exportFormat} 
              onChange={setExportFormat}
              style={{ width: '100%' }}
            >
              <Option value="pdf">PDF</Option>
              <Option value="docx">Word (DOCX)</Option>
              <Option value="txt">Text (TXT)</Option>
              <Option value="json">JSON</Option>
            </Select>
          </div>

          <div className="setting-item toggle">
            <div className="toggle-label">
              <label>Include timestamps</label>
              <span className="status-badge">ON</span>
            </div>
            <Switch checked={includeTimestamps} onChange={setIncludeTimestamps} />
          </div>
        </Card>

        {/* Save Button */}
        <div className="settings-actions">
          <button className="save-btn" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
