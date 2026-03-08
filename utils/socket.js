import { Server } from "socket.io";

const userSocketMap = {}; // { userId: socketId }

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    const userId = socket.handshake.query.userId;

    if (!userId) {
      socket.disconnect();
      return;
    }

    // ✅ USER ONLINE
    userSocketMap[userId] = socket.id;

    // 🔥 SEND ONLINE USERS TO ALL CLIENTS
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    /* ================= MESSAGES ================= */

    socket.on("send-message", (msg) => {
      const receiverSocketId = userSocketMap[msg.receiverId];
      if (receiverSocketId) {
        // Include chatId in the emitted message
        io.to(receiverSocketId).emit("receive-message", {
          ...msg,
          chatId: msg.chatId,
        });
      }
    });

    /* ================= TYPING INDICATOR ================= */

    socket.on("typing", ({ chatId, senderId, receiverId, isTyping }) => {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        // Emit typing event with chatId so receiver knows which chat it's for
        io.to(receiverSocketId).emit("user-typing", {
          chatId,
          senderId,
          isTyping,
        });
      }
    });

    /* ================= DISCONNECT ================= */

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);

      delete userSocketMap[userId];

      // 🔥 UPDATE ONLINE USERS
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });
}
