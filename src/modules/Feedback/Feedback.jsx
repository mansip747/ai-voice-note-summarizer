// src/modules/Feedback/Feedback.jsx
import React, { useState } from 'react';
import { Input, Rate } from 'antd';
import { SmileOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import './Feedback.scss';

const { TextArea } = Input;

const Feedback = () => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    if (!feedback.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    console.log('Feedback submitted:', { rating, feedback });
    toast.success('Thank you for your feedback!');
    
    // Reset form
    setRating(0);
    setFeedback('');
  };

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        <div className="feedback-header">
          <SmileOutlined className="feedback-icon" />
          <h1>Help & Feedback</h1>
          <p>We'd love to hear from you!</p>
        </div>

        <div className="feedback-form">
          <div className="form-section">
            <h2>Send Feedback</h2>
            
            <div className="rating-section">
              <label>How would you rate your experience?</label>
              <Rate value={rating} onChange={setRating} />
            </div>

            <div className="textarea-section">
              <label>Tell us how we can improve...</label>
              <TextArea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts, suggestions, or report issues..."
                rows={6}
                maxLength={500}
                showCount
              />
            </div>

            <button className="submit-btn" onClick={handleSubmit}>
              Submit Feedback
            </button>
          </div>

          <div className="feedback-info">
            <h3>📧 Other Ways to Reach Us</h3>
            <ul>
              <li>
                <strong>Email:</strong> support@voicesummarizer.com
              </li>
              <li>
                <strong>Response Time:</strong> Within 24 hours
              </li>
              <li>
                <strong>Community:</strong> Join our Discord server
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
