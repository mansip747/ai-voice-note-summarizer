// src/hooks/useAISummary.js
import { useState, useCallback, useRef } from "react";
import AISummaryService from "../services/aiSummaryService";
import { RecordingService } from "../services/recordingDB";

const useAISummary = () => {
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const summaryBufferRef = useRef("");
  const activeRequestIdRef = useRef(null);

  // Handle incoming WebSocket messages - ONLY collect, don't update state
  const handleMessage = useCallback((chunk, requestId) => {
    if (requestId !== activeRequestIdRef.current) {
      console.log("⚠️ Ignoring message from old request");
      return;
    }

    // ✅ ONLY accumulate in buffer, DON'T call setSummary()
    summaryBufferRef.current += chunk;
    console.log(
      "📥 Chunk received, buffer length:",
      summaryBufferRef.current.length
    );
  }, []);

  // Handle errors
  const handleError = useCallback((error, requestId) => {
    if (requestId !== activeRequestIdRef.current) {
      return;
    }
    console.error("❌ Error:", error);
    setError("Failed to generate summary");
    setIsGenerating(false);
  }, []);

  // Handle completion - Save to DB, then update state
  const handleComplete = useCallback(async (requestId, recordingId) => {
    if (requestId !== activeRequestIdRef.current) {
      console.log("⚠️ Ignoring completion from old request");
      return;
    }

    console.log("✅ handleComplete called");

    const finalSummary = summaryBufferRef.current;
    console.log("📊 Final summary length:", finalSummary.length);
    console.log("📊 Final summary preview:", finalSummary.substring(0, 100));

    try {
      // ✅ STEP 1: Save to database
      if (recordingId && finalSummary) {
        console.log("💾 Saving summary to database...");
        await RecordingService.saveSummary(recordingId, finalSummary);
        console.log("✅ Summary saved to database");
      }

      // ✅ STEP 2: Read from database (ensures consistency)
      const savedSummary = recordingId
        ? await RecordingService.getSummary(recordingId)
        : finalSummary;

      // ✅ STEP 3: Update UI state ONCE
      setSummary(savedSummary || finalSummary);
      setIsGenerating(false);

      console.log("✅ Summary displayed in UI");
    } catch (error) {
      console.error("❌ Error in completion:", error);
      // Even if save fails, show the summary
      setSummary(finalSummary);
      setError("Summary generated but failed to save");
      setIsGenerating(false);
    }
  }, []);

  // Generate summary
  const generateSummary = useCallback(
    async (transcript, recordingId = null) => {
      if (!transcript?.trim()) {
        setError("No transcript");
        return;
      }

      try {
        const requestId = Date.now().toString();
        activeRequestIdRef.current = requestId;

        console.log("🚀 Starting generation");
        console.log("📊 Request ID:", requestId);
        console.log("📊 Recording ID:", recordingId);
        console.log("📊 Transcript length:", transcript.length);

        // ✅ Clear buffer
        summaryBufferRef.current = "";

        // Reset state
        setSummary("");
        setError(null);
        setIsGenerating(true);

        console.log("✅ Buffer reset complete");

        // Connect
        await AISummaryService.connect(
          (chunk) => handleMessage(chunk, requestId),
          (error) => handleError(error, requestId),
          () => handleComplete(requestId, recordingId)
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        console.log("📤 Sending request...");
        AISummaryService.summarize(transcript);
      } catch (error) {
        console.error("❌ Error:", error);
        setError(error.message);
        setIsGenerating(false);
      }
    },
    [handleMessage, handleError, handleComplete]
  );

  // ✅ Load existing summary from database
  const loadSummary = useCallback(async (recordingId) => {
    try {
      console.log("📖 Loading summary for recording:", recordingId);
      setError(null);

      const savedSummary = await RecordingService.getSummary(recordingId);

      if (savedSummary) {
        setSummary(savedSummary);
        console.log("✅ Summary loaded from database");
        return savedSummary;
      } else {
        console.log("ℹ️ No existing summary found");
        return null;
      }
    } catch (error) {
      console.error("❌ Error loading summary:", error);
      setError("Failed to load summary");
      return null;
    }
  }, []);

  // Stop generation
  const stopGeneration = useCallback(() => {
    console.log("⏹️ Generation stopped");
    activeRequestIdRef.current = null;
    setIsGenerating(false);
  }, []);

  // Reset
  const resetSummary = useCallback(() => {
    console.log("🔄 Reset");
    activeRequestIdRef.current = null;
    summaryBufferRef.current = "";
    setSummary("");
    setError(null);
    setIsGenerating(false);
  }, []);

  return {
    summary,
    isGenerating,
    error,
    generateSummary,
    loadSummary,
    stopGeneration,
    resetSummary,
    isConnected: AISummaryService.isConnected(),
  };
};

export default useAISummary;
