// src/hooks/useAIPrompt.js
import { useState, useCallback, useRef } from "react";
import AIService from "../services/aiService";

const useAIPrompt = () => {
  const [response, setResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const responseBufferRef = useRef("");
  const activeRequestIdRef = useRef(null);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((chunk, requestId) => {
    if (requestId !== activeRequestIdRef.current) {
      console.log("⚠️ Ignoring message from old request");
      return;
    }

    responseBufferRef.current += chunk;
    console.log(
      "📥 Chunk received, buffer length:",
      responseBufferRef.current.length
    );
  }, []);

  // Handle errors
  const handleError = useCallback((error, requestId) => {
    if (requestId !== activeRequestIdRef.current) {
      return;
    }
    console.error("❌ Error:", error);
    setError("Failed to generate response");
    setIsGenerating(false);
  }, []);

  // Handle completion
  const handleComplete = useCallback(async (requestId) => {
    if (requestId !== activeRequestIdRef.current) {
      console.log("⚠️ Ignoring completion from old request");
      return;
    }

    console.log("✅ handleComplete called");

    const finalResponse = responseBufferRef.current;
    console.log("📊 Final response length:", finalResponse.length);
    console.log("📊 Final response preview:", finalResponse.substring(0, 100));

    try {
      setResponse(finalResponse);
      setIsGenerating(false);
      console.log("✅ Response displayed in UI");
    } catch (error) {
      console.error("❌ Error in completion:", error);
      setResponse(finalResponse);
      setError("Response generated with errors");
      setIsGenerating(false);
    }
  }, []);

  // Generate response from any prompt
  const generatePrompt = useCallback(
    async (prompt) => {
      if (!prompt?.trim()) {
        setError("No prompt provided");
        return;
      }

      try {
        const requestId = Date.now().toString();
        activeRequestIdRef.current = requestId;

        console.log("🚀 Starting AI prompt generation");
        console.log("📊 Request ID:", requestId);
        console.log("📊 Prompt:", prompt.substring(0, 100) + "...");

        // Clear buffer
        responseBufferRef.current = "";

        // Reset state
        setResponse("");
        setError(null);
        setIsGenerating(true);

        console.log("✅ Buffer reset complete");

        // Connect to WebSocket
        await AIService.connect(
          (chunk) => handleMessage(chunk, requestId),
          (error) => handleError(error, requestId),
          () => handleComplete(requestId)
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        console.log("📤 Sending prompt to AI...");
        AIService.query(prompt); // ✅ Use generic query method
      } catch (error) {
        console.error("❌ Error:", error);
        setError(error.message);
        setIsGenerating(false);
      }
    },
    [handleMessage, handleError, handleComplete]
  );

  // Stop generation
  const stopGeneration = useCallback(() => {
    console.log("⏹️ Generation stopped");
    activeRequestIdRef.current = null;
    setIsGenerating(false);
  }, []);

  // Reset
  const resetResponse = useCallback(() => {
    console.log("🔄 Reset");
    activeRequestIdRef.current = null;
    responseBufferRef.current = "";
    setResponse("");
    setError(null);
    setIsGenerating(false);
  }, []);

  return {
    response,
    isGenerating,
    error,
    generatePrompt,
    stopGeneration,
    resetResponse,
    isConnected: AIService.isConnected(),
  };
};

export default useAIPrompt;
