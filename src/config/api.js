// src/config/api.js
export const API_CONFIG = {
  WS_URL: import.meta.env.VITE_WS_URL,
  ACCESS_TOKEN: import.meta.env.VITE_ACCESS_TOKEN,
  PROJECT_ID: import.meta.env.VITE_PROJECT_ID,
};

// Validate required environment variables
if (!API_CONFIG.ACCESS_TOKEN) {
  console.error("❌ VITE_ACCESS_TOKEN is not set in .env file");
}

if (!API_CONFIG.WS_URL) {
  console.error("❌ VITE_WS_URL is not set in .env file");
}
