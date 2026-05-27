import { io } from "socket.io-client";

// Ensure this matches the FastAPI backend URL exactly
const SOCKET_URL = "http://localhost:8000";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"], // Ensure websocket is preferred
});

socket.on("connect", () => {
  console.log("Connected to WebSocket Server:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("WebSocket connection error:", err);
});

export default socket;
