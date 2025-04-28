const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);

    io.to(roomId).emit("user-joined", Array.from(rooms.get(roomId)));
  });

  socket.on("play-state-change", ({ videoId, isPlaying, currentTime }) => {
    socket.to(videoId).emit("play-state", { isPlaying, currentTime });
  });

  socket.on("change-video", (newVideoId) => {
    const roomId = Array.from(socket.rooms)[1];
    io.to(roomId).emit("video-changed", newVideoId);
  });

  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(socket.id);
        io.to(roomId).emit("user-left", Array.from(rooms.get(roomId)));
      }
    }
  });
});

http.listen(3001, () => {
});
