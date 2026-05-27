import { useContext } from "react";
import { SocketContext } from "../context/SocketContext";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

let socket = null;

export function useSocket() {
  if (!socket) {
    socket = io("http://localhost:8000", {
      transports: ["websocket"],
    });
  }
  return socket;
}
