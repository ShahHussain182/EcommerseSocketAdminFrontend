// src/lib/socketClient.ts
import { io, Socket } from "socket.io-client";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

const SERVER = API_BASE_URL.replace(/\/api\/v1$/, '') ||"http://localhost:3001"; // e.g. https://api.example.com
let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(SERVER, {
      autoConnect: true,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
      // auth: { token: localStorage.getItem('token') } // optional auth
    });
    // optional debug
    socket.on("connect", () => console.debug("[socket] connected", socket?.id));
    socket.on("disconnect", (reason) => console.debug("[socket] disconnected", reason));
    socket.on("connect_error", (err) => console.warn("[socket] connect_error", err));
  }
  return socket;
}