import { io } from "socket.io-client";

const URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const socket = io(URL, {
  transports: ["websocket"],
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

export default socket;