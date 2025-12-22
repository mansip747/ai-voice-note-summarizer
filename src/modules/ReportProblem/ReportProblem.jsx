// src/modules/ReportProblem/ReportProblem.jsx
import React, { useState } from 'react';
import { Select, Input, Upload, Button } from 'antd';
import { UploadOutlined, WarningOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import './ReportProblem.scss';

const { Option } = Select;
const { TextArea } = Input;

const ReportProblem = () => {
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [fileList, setFileList] = useState([]);

  const issueTypes = [
    'Audio Recording Issue',
    'Transcription Error',
    'App Crash',
    'Login Problem',
    'Export/Save Issue',
    'UI/Display Problem',
    'Performance Issue',
    'Other',
  ];

  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
  };

  const handleSubmit = () => {
    if (!issueType) {
      toast.error('Please select an issue type');
      return;
    }

    if (!description.trim()) {
      toast.error('Please describe the problem');
      return;
    }

    console.log('Problem reported:', {
      issueType,
      description,
      attachments: fileList,
    });

    toast.success('Problem reported successfully! We will investigate and get back to you.');

    // Reset form
    setIssueType('');
    setDescription('');
    setFileList([]);
  };

  return (
    <div className="report-problem-page">
      <div className="report-container">
        <div className="report-header">
          <WarningOutlined className="report-icon" />
          <h1>Report a Problem</h1>
          <p>Help us fix issues by providing detailed information</p>
        </div>

        <div className="report-form">
          <div className="form-section">
            <div className="form-item">
              <label>Issue Type <span className="required">*</span></label>
              <Select
                placeholder="Select Issue..."
                value={issueType}
                onChange={setIssueType}
                style={{ width: '100%' }}
                size="large"
              >
                {issueTypes.map((type) => (
                  <Option key={type} value={type}>
                    {type}
                  </Option>
                ))}
              </Select>
            </div>

            <div className="form-item">
              <label>
                Describe the problem <span className="required">*</span>
              </label>
              <TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide as much detail as possible:
- What were you doing when the problem occurred?
- What did you expect to happen?
- What actually happened?
- Can you reproduce the issue?"
                rows={8}
                maxLength={1000}
                showCount
              />
            </div>

            <div className="form-item">
              <label>
                Attach recording or screenshot <span className="optional">(optional)</span>
              </label>
              <Upload
                fileList={fileList}
                onChange={handleFileChange}
                beforeUpload={() => false}
                accept="audio/*,image/*"
                maxCount={3}
              >
                <Button icon={<UploadOutlined />} size="large">
                  Choose File
                </Button>
              </Upload>
              <p className="upload-hint">
                Supported formats: Audio files, Images (PNG, JPG). Max 3 files, 10MB each.
              </p>
            </div>

            <button className="submit-btn" onClick={handleSubmit}>
              Report Issue
            </button>
          </div>

          <div className="info-card">
            <h3>💡 Before Reporting</h3>
            <ul>
              <li>✓ Check if the app is up to date</li>
              <li>✓ Try refreshing the page</li>
              <li>✓ Check your internet connection</li>
              <li>✓ Clear browser cache if needed</li>
            </ul>

            <div className="quick-links">
              <h4>Quick Links</h4>
              <a href="#" onClick={() => toast.info('Opening FAQ...')}>
                📖 FAQ
              </a>
              <a href="#" onClick={() => toast.info('Opening documentation...')}>
                📚 Documentation
              </a>
              <a href="#" onClick={() => toast.info('Opening contact support...')}>
                📧 Contact Support
              </a>
            </div>
          </div>
        </div>

        <div className="report-footer">
          <p>
            <strong>Privacy Note:</strong> Any files you upload will be used solely for
            troubleshooting purposes and will be deleted after 30 days.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportProblem;
