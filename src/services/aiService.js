// src/services/aiService.js
import { API_CONFIG } from "../config/api";

export class AIService {
  constructor() {
    this.ws = null;
    this.sessionId = null;
    this.projectId = API_CONFIG.PROJECT_ID;
    this.accessToken = API_CONFIG.ACCESS_TOKEN;
    this.onCompleteCallback = null;
  }

  // Generate a session ID
  generateSessionId() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
      .replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      })
      .replace(/-/g, "");
  }

  // Build WebSocket URL with access token
  buildWebSocketUrl() {
    const baseUrl = API_CONFIG.WS_URL.replace(/\/$/, ""); // Remove trailing slash
    const token = this.accessToken;

    if (!token) {
      throw new Error("Access token is missing");
    }

    const url = `${baseUrl}?access_token=${token}`;

    console.log(
      "🔗 WebSocket URL (first 80 chars):",
      url.substring(0, 80) + "..."
    );
    return url;
  }

  // Connect to WebSocket (only if not already connected)
  connect(onMessage, onError, onComplete) {
    return new Promise((resolve, reject) => {
      // If already connected, reuse connection
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log("♻️ Reusing existing WebSocket connection");
        this.onCompleteCallback = onComplete;
        resolve();
        return;
      }

      // If connecting, wait for it
      if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
        console.log("⏳ WebSocket already connecting, waiting...");
        this.ws.addEventListener(
          "open",
          () => {
            this.onCompleteCallback = onComplete;
            resolve();
          },
          { once: true }
        );
        return;
      }

      // Validate configuration
      if (!this.accessToken) {
        const error = new Error(
          "❌ Access token not configured. Please check .env file."
        );
        console.error(error.message);
        reject(error);
        return;
      }

      if (!API_CONFIG.WS_URL) {
        const error = new Error(
          "❌ WebSocket URL not configured. Please check .env file."
        );
        console.error(error.message);
        reject(error);
        return;
      }

      this.sessionId = this.generateSessionId();
      this.onCompleteCallback = onComplete;

      try {
        const wsUrl = this.buildWebSocketUrl();

        console.log("🔌 Attempting to connect to WebSocket...");
        console.log("📋 Session ID:", this.sessionId);
        console.log("📋 Project ID:", this.projectId);
        console.log("🔑 Token length:", this.accessToken.length);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("✅ WebSocket connected successfully");
          console.log("📊 ReadyState:", this.ws.readyState);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            if (!event.data || event.data.trim() === "") {
              return;
            }

            console.log("📨 Raw:", event.data);

            let data;
            try {
              data = JSON.parse(event.data);
            } catch (parseError) {
              data = { response: event.data };
            }

            if (data.response !== undefined && data.response !== null) {
              const response = String(data.response);

              // Check for <eos>
              if (data.response.includes(`<EOS>`)) {
                console.log("🏁 <eos> detected");

                // close socket connection
                this.ws.close();

                // Send final chunk WITHOUT <eos>
                const cleaned = response.replace(/<eos>/gi, "").trim();
                if (cleaned) {
                  console.log("📤 Sending final chunk:", cleaned);
                  onMessage(cleaned);
                }

                console.log("🎯 Calling completion callback");
                if (this.onCompleteCallback) {
                  this.onCompleteCallback();
                }
                return;
              }

              // Send normal chunk
              if (response.trim()) {
                onMessage(response);
              }
            }
          } catch (error) {
            console.error("❌ Handler error:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("❌ WebSocket error:", error);
          console.log("📊 ReadyState at error:", this.ws?.readyState);
          onError(error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log("🔌 WebSocket disconnected");
          console.log("📊 Close code:", event.code);
          console.log("📊 Close reason:", event.reason);
          console.log("📊 Was clean:", event.wasClean);

          const closeCodes = {
            1000: "Normal closure",
            1001: "Going away",
            1002: "Protocol error",
            1003: "Unsupported data",
            1006: "Abnormal closure (no close frame)",
            1007: "Invalid frame payload data",
            1008: "Policy violation",
            1009: "Message too big",
            1010: "Missing extension",
            1011: "Internal server error",
            1015: "TLS handshake failure",
          };

          console.log(
            "📊 Close code meaning:",
            closeCodes[event.code] || "Unknown"
          );

          // Reset connection reference
          this.ws = null;

          if (event.code === 1006 && !event.wasClean) {
            console.error(
              "❌ Connection closed abnormally - likely authentication issue"
            );
            onError(new Error("Authentication failed or connection rejected"));
          }
        };
      } catch (error) {
        console.error("❌ Error creating WebSocket:", error);
        reject(error);
      }
    });
  }

  // ✅ GENERIC QUERY METHOD - Accepts any prompt
  query(prompt) {
    if (!this.ws) {
      throw new Error("WebSocket not initialized");
    }

    if (this.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`WebSocket not ready. State: ${this.ws.readyState}`);
    }

    // Generate new session ID for each query
    this.sessionId = this.generateSessionId();

    const payload = {
      action: "queryV2",
      session_id: this.sessionId,
      project_id: this.projectId,
      query: prompt, // ✅ Accept any prompt directly
    };

    console.log("📤 Sending AI query");
    console.log("📋 New Session ID:", this.sessionId);
    console.log("📊 Query length:", prompt.length, "characters");
    console.log("📋 Prompt preview:", prompt.substring(0, 100) + "...");

    this.ws.send(JSON.stringify(payload));
  }

  // Check if WebSocket is connected
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  // Get connection state
  getState() {
    if (!this.ws) return "NOT_INITIALIZED";

    const states = {
      [WebSocket.CONNECTING]: "CONNECTING",
      [WebSocket.OPEN]: "OPEN",
      [WebSocket.CLOSING]: "CLOSING",
      [WebSocket.CLOSED]: "CLOSED",
    };

    return states[this.ws.readyState] || "UNKNOWN";
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.ws) {
      console.log("🔌 Disconnecting WebSocket");
      this.ws.close();
      this.ws = null;
    }
  }
}

export default new AIService();
