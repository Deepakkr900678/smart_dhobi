const { Server } = require("socket.io");
const Notification = require("./models/notificationModel");

let ioInstance;
const connectedUsers = {};

function initSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  ioInstance.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join", (userId) => {
      connectedUsers[userId] = socket.id;
      socket.join(userId.toString());
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined with socket ${socket.id}`);
    });

    socket.on("send-notification", async ({ receiverId, message }) => {
      const notification = new Notification({
        userId: receiverId,
        message,
      });
      await notification.save();

      const receiverSocketId = connectedUsers[receiverId];
      if (receiverSocketId) {
        ioInstance.to(receiverSocketId).emit("receive-notification", notification);
      }
    });

    socket.on("disconnect", () => {
      for (let userId in connectedUsers) {
        if (connectedUsers[userId] === socket.id) {
          delete connectedUsers[userId];
          break;
        }
      }
      console.log("Socket disconnected:", socket.id);
    });
  });
}

function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
}

module.exports = { initSocket, getIO, connectedUsers };
