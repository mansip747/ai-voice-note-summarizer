# 🎙️ Quint - AI Voice Summarizer

> An intelligent voice recording application with real-time transcription, AI-powered summarization, and automated action item extraction.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Node](https://img.shields.io/badge/Node-16.x-green.svg)](https://nodejs.org/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Demo](#demo)

---

## 🎯 Overview <a id="overview"></a>

**Quint** is a modern web application built with React that enables users to record audio, generate real-time transcriptions, and leverage AI to create summaries and extract actionable items. Perfect for meetings, lectures, interviews, and brainstorming sessions.

### Key Capabilities:
- 🎤 **Real-time Voice Recording** with visual feedback
- 📝 **Live Transcription** using Web Speech API
- 🤖 **AI-Powered Summaries** via WebSocket streaming
- ✅ **Action Item Extraction** with smart follow-up generation
- 💾 **Local Storage** using IndexedDB for offline access
- 📤 **Export Functionality** for transcripts and summaries

---

## ✨ Features <a id="features"></a>

### 🎙️ Recording
- Real-time audio visualization
- Live word count and duration tracking
- Pause/Resume functionality
- Audio waveform display

### 📝 Transcription
- Real-time speech-to-text conversion
- Support for multiple audio formats (upload)
- Word-level accuracy tracking
- Editable transcripts

### 🤖 AI Summarization
- WebSocket-based streaming responses
- Automatic summary generation
- Database persistence
- Regeneration capability
- Structured output (Context, Next Steps, Timeline)

### ✅ Action Items
- Automatic extraction from summaries
- AI-generated follow-up responses
- Context-aware suggestions
- Email/meeting template generation
- Copy-to-clipboard functionality

### 💾 Data Management
- IndexedDB for local storage
- Recording metadata tracking
- Search and filter capabilities
- Export as text/audio files

---

## 🛠️ Tech Stack <a id="tech-stack"></a>

### Frontend
- **React 18** - UI framework
- **React Router v6** - Navigation
- **Ant Design** - UI components
- **SCSS** - Styling
- **Dexie.js** - IndexedDB wrapper

### APIs & Services
- **Web Speech API** - Speech recognition
- **MediaRecorder API** - Audio recording
- **WebSocket** - Real-time AI streaming
- **Custom AI Service** - LLM integration

### State Management
- **React Hooks** - Local state
- **Custom Hooks** - Reusable logic
  - `useVoiceRecorder` - Recording management
  - `useAISummary` - Summary generation
  - `useAIPrompt` - Generic AI queries

---

## 📦 Installation <a id="installation"></a>

### Prerequisites
```bash
node >= 16.x
yarn >= 1.22.x
