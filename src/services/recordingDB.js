// src/services/recordingDB.js
import Dexie from 'dexie';

// Initialize IndexedDB
const db = new Dexie('VoiceRecordingsDB');

db.version(1).stores({
  recordings: '++id, title, transcript, duration, timestamp, audioBlob'
});

// Recording Service
export const RecordingService = {
  // Add a new recording
  async addRecording(recordingData) {
    try {
      const id = await db.recordings.add({
        title: recordingData.title || `Recording ${Date.now()}`,
        transcript: recordingData.transcript || '',
        duration: recordingData.duration || 0,
        timestamp: recordingData.timestamp || new Date().toISOString(),
        audioBlob: recordingData.audioBlob || null,
        fileType: recordingData.fileType || 'audio/webm',
        words: recordingData.words || 0,
      });
      console.log('✅ Recording saved with ID:', id);
      return id;
    } catch (error) {
      console.error('❌ Error saving recording:', error);
      throw error;
    }
  },

  // Get all recordings (sorted by latest first)
  async getAllRecordings() {
    try {
      const recordings = await db.recordings
        .orderBy('timestamp')
        .reverse()
        .toArray();
      console.log('📚 Retrieved recordings:', recordings.length);
      return recordings;
    } catch (error) {
      console.error('❌ Error fetching recordings:', error);
      return [];
    }
  },

  // Get single recording by ID
  async getRecording(id) {
    try {
      const recording = await db.recordings.get(id);
      return recording;
    } catch (error) {
      console.error('❌ Error fetching recording:', error);
      return null;
    }
  },

  // Update recording
  async updateRecording(id, updates) {
    try {
      await db.recordings.update(id, updates);
      console.log('✅ Recording updated:', id);
    } catch (error) {
      console.error('❌ Error updating recording:', error);
      throw error;
    }
  },

  // Delete recording
  async deleteRecording(id) {
    try {
      await db.recordings.delete(id);
      console.log('🗑️ Recording deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting recording:', error);
      throw error;
    }
  },

  // Clear all recordings
  async clearAll() {
    try {
      await db.recordings.clear();
      console.log('🗑️ All recordings cleared');
    } catch (error) {
      console.error('❌ Error clearing recordings:', error);
      throw error;
    }
  },

  // Download recording as file
  downloadRecording(recording) {
    if (!recording.audioBlob) {
      console.error('❌ No audio data available');
      return;
    }

    const blob = recording.audioBlob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.title.replace(/[^a-z0-9]/gi, '_')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

export default db;

