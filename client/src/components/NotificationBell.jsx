// import React, { useEffect, useState } from "react";
// import { io } from "socket.io-client";
// import { useNavigate } from "react-router-dom";
// import {
//   fetchNotifications,
//   getCurrentRole,
//   updateNotificationClick,
// } from "../auth/ApiConnect";

// // const socket = io("https://api.smartdhobi.in");
// const socket = io(import.meta.env.VITE_APP_BASE_URL.replace("/api", ""));

// const NotificationBell = ({ userId }) => {
//   const [notifications, setNotifications] = useState([]);
//   const [open, setOpen] = useState(false);
//   const navigate = useNavigate();
//   const currentRole = getCurrentRole();

//   useEffect(() => {
//     if (userId) {
//       socket.emit("join", userId);
//     }
//   }, [userId]);

//   useEffect(() => {
//     socket.on("receive-notification", (notification) => {
//       if (notification?.userId?.toString?.() !== userId?.toString()) {
//         return;
//       }

//       setNotifications((prev) => [notification, ...prev]);
//     });
//     return () => socket.off("receive-notification");
//   }, [userId]);

//   useEffect(() => {
//     if (userId) {
//       getNotifications();
//     }
//   }, [userId]);

//   const getNotifications = async () => {
//     try {
//       const res = await fetchNotifications(userId);
//       setNotifications(res);
//     } catch (err) {
//       console.error("Error fetching notifications:", err);
//     }
//   };

//   const handleNotificationClick = async (noti) => {
//     setOpen(false);

//     try {
//       await updateNotificationClick(noti);
//       setNotifications((prev) => prev.filter((item) => item._id !== noti._id));
//     } catch (err) {
//       return;
//     }

//     if (noti.type === "order" && noti.orderId) {
//       navigate(currentRole === "dhobi" ? "/dhobi/orders" : "/customer/orders");
//     } else if (noti.type === "service") {
//       navigate(`/services/${noti.orderId}`);
//     } else {
//       navigate(
//         currentRole === "admin"
//           ? "/admin/users"
//           : currentRole === "dhobi"
//             ? "/dhobi"
//             : "/customer"
//       );
//     }
//   };

//   return (
//     <div className="relative">
//       <button
//         className="relative text-gray-700 hover:text-black"
//         onClick={() => setOpen(!open)}
//       >
//         🔔
//         {notifications.length > 0 && (
//           <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-full">
//             {notifications.length}
//           </span>
//         )}
//       </button>

//       {open && (
//         <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg z-50 max-h-80 overflow-y-auto">
//           {notifications.length === 0 ? (
//             <div className="p-4 text-gray-500">No notifications</div>
//           ) : (
//             notifications.map((noti, index) => (
//               <button
//                 key={index}
//                 onClick={() => handleNotificationClick(noti)}
//                 className="w-full text-left p-3 border-b hover:bg-gray-100 text-sm text-gray-700"
//               >
//                 {noti.message}
//               </button>
//             ))
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default NotificationBell;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  getCurrentRole,
  updateNotificationClick,
} from "../auth/ApiConnect";
import socket from "../socket/index"; // ← shared singleton, never call io() here

const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen]                   = useState(false);
  const navigate     = useNavigate();
  const currentRole  = getCurrentRole();

  // Join user room once userId is available
  useEffect(() => {
    if (!userId) return;

    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("join", userId);
  }, [userId]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!userId) return;

    const handleIncoming = (notification) => {
      // Guard: only accept notifications meant for this user
      if (notification?.userId?.toString() !== userId?.toString()) return;
      setNotifications((prev) => [notification, ...prev]);
    };

    socket.on("receive-notification", handleIncoming);

    // Cleanup — remove only this handler, not all listeners
    return () => socket.off("receive-notification", handleIncoming);
  }, [userId]);

  // Fetch existing notifications on mount
  useEffect(() => {
    if (!userId) return;
    getNotifications();
  }, [userId]);

  const getNotifications = async () => {
    try {
      const res = await fetchNotifications(userId);
      setNotifications(res);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const handleNotificationClick = async (noti) => {
    setOpen(false);
    try {
      await updateNotificationClick(noti);
      setNotifications((prev) => prev.filter((item) => item._id !== noti._id));
    } catch {
      return;
    }

    if (noti.type === "order" && noti.orderId) {
      navigate(currentRole === "dhobi" ? "/dhobi/orders" : "/customer/orders");
    } else if (noti.type === "service") {
      navigate(`/services/${noti.orderId}`);
    } else {
      navigate(
        currentRole === "admin" ? "/admin/users"
        : currentRole === "dhobi" ? "/dhobi"
        : "/customer"
      );
    }
  };

  return (
    <div className="relative">
      <button
        className="relative text-gray-700 hover:text-black"
        onClick={() => setOpen(!open)}
      >
        🔔
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg z-50 max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-gray-500">No notifications</div>
          ) : (
            notifications.map((noti, index) => (
              <button
                key={noti._id || index}
                onClick={() => handleNotificationClick(noti)}
                className="w-full text-left p-3 border-b hover:bg-gray-100 text-sm text-gray-700"
              >
                {noti.message}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
