import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) return;

    const s = io(import.meta.env.VITE_API_URL, {
      auth: {
        token: localStorage.getItem("token")
      }
    });

    setSocket(s);

    //  LISTENERS INSIDE EFFECT
    s.on("job_accepted", (data) => {
      console.log("Job accepted:", data);
      alert(`Job accepted by user: ${data.worker_id}`);
    });

    s.on("job_closed", (data) => {
      console.log("Job closed:", data);
      alert("This job is no longer available");
    });

    return () => {
      s.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  return useContext(SocketContext);
};