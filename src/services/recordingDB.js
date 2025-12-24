// src/services/recordingDB.js
import Dexie from "dexie";
import { toast } from "react-toastify";

// Initialize IndexedDB
const db = new Dexie("VoiceRecordingsDB");

// ✅ Version 4: Add actionItems field
db.version(4)
  .stores({
    recordings:
      "++id, title, transcript, duration, timestamp, audioBlob, summary, source, originalFileName, actionItems",
  })
  .upgrade((tx) => {
    return tx
      .table("recordings")
      .toCollection()
      .modify((recording) => {
        if (!recording.source) {
          recording.source = "recording";
        }
        if (!recording.originalFileName) {
          recording.originalFileName = null;
        }
        // ✅ NEW: Initialize actionItems
        if (!recording.actionItems) {
          recording.actionItems = [];
        }
      });
  });

// Version 3: Keep for backward compatibility
db.version(3)
  .stores({
    recordings:
      "++id, title, transcript, duration, timestamp, audioBlob, summary, source, originalFileName",
  })
  .upgrade((tx) => {
    return tx
      .table("recordings")
      .toCollection()
      .modify((recording) => {
        if (!recording.source) {
          recording.source = "recording";
        }
        if (!recording.originalFileName) {
          recording.originalFileName = null;
        }
      });
  });

// Version 2: Keep for backward compatibility
db.version(2).stores({
  recordings:
    "++id, title, transcript, duration, timestamp, audioBlob, summary",
});

// Version 1: Keep for backward compatibility
db.version(1).stores({
  recordings: "++id, title, transcript, duration, timestamp, audioBlob",
});

// Recording Service
export const RecordingService = {
  // Add a new recording
  async addRecording(recordingData) {
    try {
      const id = await db.recordings.add({
        title: recordingData.title || `Recording ${Date.now()}`,
        transcript: recordingData.transcript || "",
        duration: recordingData.duration || 0,
        timestamp: recordingData.timestamp || new Date().toISOString(),
        audioBlob: recordingData.audioBlob || null,
        fileType: recordingData.fileType || "audio/webm",
        words: recordingData.words || 0,
        summary: null,
        summaryTimestamp: null,
        source: recordingData.source || "recording",
        originalFileName: recordingData.originalFileName || null,
        actionItems: [], // ✅ Initialize as empty array
        actionItemsTimestamp: null,
      });
      console.log("✅ Recording saved with ID:", id);
      return id;
    } catch (error) {
      console.error("❌ Error saving recording:", error);
      throw error;
    }
  },

  // Save summary for a recording
  async saveSummary(recordingId, summaryText) {
    try {
      await db.recordings.update(recordingId, {
        summary: summaryText,
        summaryTimestamp: new Date().toISOString(),
      });
      console.log("✅ Summary saved for recording:", recordingId);
      console.log("📊 Summary length:", summaryText.length);
      return true;
    } catch (error) {
      console.error("❌ Error saving summary:", error);
      throw error;
    }
  },

  // Get summary for a recording
  async getSummary(recordingId) {
    try {
      const recording = await db.recordings.get(recordingId);

      if (!recording) {
        throw new Error(`Recording with ID ${recordingId} not found`);
      }

      if (!recording.summary) {
        console.log("⚠️ No summary found for recording:", recordingId);
        return null;
      }

      console.log("✅ Summary loaded for recording:", recordingId);
      console.log("📊 Summary length:", recording.summary.length);

      return recording.summary;
    } catch (error) {
      console.error("❌ Error reading summary:", error);
      throw error;
    }
  },

  // Delete summary for a recording
  async deleteSummary(recordingId) {
    try {
      await db.recordings.update(recordingId, {
        summary: null,
        summaryTimestamp: null,
      });
      console.log("✅ Summary deleted for recording:", recordingId);
      return true;
    } catch (error) {
      console.error("❌ Error deleting summary:", error);
      throw error;
    }
  },

  // ✅ NEW: Save action items for a recording
  async saveActionItems(recordingId, actionItems) {
    try {
      console.log("💾 Saving action items for recording:", recordingId);
      console.log("📊 Number of items:", actionItems.length);

      await db.recordings.update(recordingId, {
        actionItems: actionItems,
        actionItemsTimestamp: new Date().toISOString(),
      });

      console.log("✅ Action items saved successfully");
      return true;
    } catch (error) {
      console.error("❌ Error saving action items:", error);
      throw error;
    }
  },

  // ✅ NEW: Get action items for a recording
  async getActionItems(recordingId) {
    try {
      const recording = await db.recordings.get(recordingId);

      if (!recording) {
        throw new Error(`Recording with ID ${recordingId} not found`);
      }

      console.log("📖 Action items loaded for recording:", recordingId);
      console.log("📊 Number of items:", recording.actionItems?.length || 0);

      return recording.actionItems || [];
    } catch (error) {
      console.error("❌ Error loading action items:", error);
      throw error;
    }
  },

  // ✅ NEW: Update single action item's follow-up
  async updateActionItemFollowUp(recordingId, actionItemId, followUpText) {
    try {
      console.log("💾 Updating follow-up for action item:", actionItemId);

      const recording = await db.recordings.get(recordingId);

      if (!recording) {
        throw new Error(`Recording with ID ${recordingId} not found`);
      }

      // Get existing action items or create empty array
      const actionItems = recording.actionItems || [];

      // Find and update the specific action item
      const updatedItems = actionItems.map((item) => {
        if (item.id === actionItemId) {
          return {
            ...item,
            followUp: followUpText,
            followUpTimestamp: new Date().toISOString(),
          };
        }
        return item;
      });

      // Save back to database
      await db.recordings.update(recordingId, {
        actionItems: updatedItems,
        actionItemsTimestamp: new Date().toISOString(),
      });

      console.log("✅ Follow-up saved for action item:", actionItemId);
      console.log("📊 Follow-up length:", followUpText.length);
      return true;
    } catch (error) {
      console.error("❌ Error updating action item follow-up:", error);
      throw error;
    }
  },

  // ✅ NEW: Delete follow-up for an action item
  async deleteActionItemFollowUp(recordingId, actionItemId) {
    try {
      console.log("🗑️ Deleting follow-up for action item:", actionItemId);

      const recording = await db.recordings.get(recordingId);

      if (!recording) {
        throw new Error(`Recording with ID ${recordingId} not found`);
      }

      const actionItems = recording.actionItems || [];

      const updatedItems = actionItems.map((item) => {
        if (item.id === actionItemId) {
          const { followUp, followUpTimestamp, ...rest } = item;
          return rest;
        }
        return item;
      });

      await db.recordings.update(recordingId, {
        actionItems: updatedItems,
        actionItemsTimestamp: new Date().toISOString(),
      });

      console.log("✅ Follow-up deleted for action item:", actionItemId);
      return true;
    } catch (error) {
      console.error("❌ Error deleting action item follow-up:", error);
      throw error;
    }
  },

  // Get all recordings (sorted by latest first)
  async getAllRecordings() {
    try {
      const recordings = await db.recordings
        .orderBy("timestamp")
        .reverse()
        .toArray();
      console.log("📚 Retrieved recordings:", recordings.length);
      return recordings;
    } catch (error) {
      console.error("❌ Error fetching recordings:", error);
      return [];
    }
  },

  // Get single recording by ID
  async getRecording(id) {
    try {
      const recording = await db.recordings.get(id);

      if (!recording) {
        console.warn("⚠️ Recording not found:", id);
        return null;
      }

      console.log("✅ Recording retrieved:", id);
      return recording;
    } catch (error) {
      console.error("❌ Error fetching recording:", error);
      throw error;
    }
  },

  // Update recording
  async updateRecording(id, updates) {
    try {
      const recording = await db.recordings.get(id);

      if (!recording) {
        throw new Error(`Recording with ID ${id} not found`);
      }

      const updatedCount = await db.recordings.update(id, updates);

      if (updatedCount === 0) {
        throw new Error("Update failed - no records modified");
      }

      console.log("✅ Recording updated:", id);
      return true;
    } catch (error) {
      console.error("❌ Error updating recording:", error);
      throw error;
    }
  },

  // Delete recording
  async deleteRecording(id) {
    console.log("🗑️ RecordingService.deleteRecording called with ID:", id);
    console.log("ID type:", typeof id);

    try {
      console.log("Checking if recording exists...");
      const recording = await db.recordings.get(id);
      console.log("Recording found:", recording);

      if (!recording) {
        const error = new Error(`Recording with ID ${id} not found`);
        console.error("❌", error.message);
        throw error;
      }

      console.log("Attempting to delete...");
      await db.recordings.delete(id);
      console.log("Delete operation completed");

      console.log("Verifying deletion...");
      const stillExists = await db.recordings.get(id);
      console.log("Still exists?", stillExists);

      if (stillExists) {
        const error = new Error(
          "Recording still exists after deletion attempt"
        );
        console.error("❌", error.message);
        throw error;
      }

      console.log("✅ Recording deleted successfully:", id);
      return true;
    } catch (error) {
      console.error("❌ Error in deleteRecording:", error);
      throw error;
    }
  },

  // Clear all recordings
  async clearAll() {
    try {
      const count = await db.recordings.count();
      await db.recordings.clear();
      console.log(`🗑️ All recordings cleared (${count} items)`);
      return count;
    } catch (error) {
      console.error("❌ Error clearing recordings:", error);
      throw error;
    }
  },

  // Download recording as file
  downloadRecording(recording) {
    if (!recording.audioBlob) {
      throw new Error("No audio data available for this recording");
    }

    try {
      const blob = recording.audioBlob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const extension = recording.fileType?.includes("wav")
        ? "wav"
        : recording.fileType?.includes("mp3")
        ? "mp3"
        : recording.fileType?.includes("ogg")
        ? "ogg"
        : "webm";

      a.download = `${recording.title.replace(
        /[^a-z0-9]/gi,
        "_"
      )}.${extension}`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 100);

      console.log("✅ Download initiated:", a.download);
      return true;
    } catch (error) {
      console.error("❌ Download error:", error);
      throw error;
    }
  },

  // Export recording with transcript and summary as text file
  exportRecordingAsText(recording) {
    try {
      const sourceInfo =
        recording.source === "upload"
          ? `Source: Uploaded File (${recording.originalFileName || "Unknown"})`
          : `Source: Voice Recording`;

      const content = `
${recording.title}
${sourceInfo}
Generated: ${new Date(recording.timestamp).toLocaleString()}
Duration: ${Math.floor(recording.duration / 60)}:${(recording.duration % 60)
        .toString()
        .padStart(2, "0")}
Words: ${recording.words || 0}

=== TRANSCRIPT ===
${recording.transcript || "No transcript available"}

=== AI SUMMARY ===
${recording.summary || "No summary available"}
      `.trim();

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = recording.title.replace(/[^a-z0-9]/gi, "_");
      a.download = `${safeTitle}.txt`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 100);

      console.log("✅ Export completed:", a.download);
      return true;
    } catch (error) {
      console.error("❌ Export error:", error);
      throw error;
    }
  },
};

export default db;
