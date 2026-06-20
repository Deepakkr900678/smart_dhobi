import { useEffect } from "react";
import socket from "../socket";

/**
 * useSocket — connects socket on mount, disconnects on unmount.
 * @param {Function} onNotification  optional callback for "receive-notification" events
 */
const useSocket = (onNotification) => {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?._id;
    if (!userId) return;

    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("join", userId);

    if (onNotification) {
      socket.on("receive-notification", onNotification);
    }

    return () => {
      if (onNotification) {
        socket.off("receive-notification", onNotification);
      }
    };
  }, [onNotification]);

  return socket;
};

export default useSocket;