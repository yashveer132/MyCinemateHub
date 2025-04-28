import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const server = createServer(app);

app.get("/health", (req, res) => {
  res.send("Server is running");
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

const rooms = new Map();
const roomStates = new Map();
const userRooms = new Map();

io.on("connection", (socket) => {

  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
      roomStates.set(roomId, {
        isPlaying: true,
        currentTime: 0,
        videoId: null,
      });
    }
    rooms.get(roomId).add(socket.id);
    userRooms.set(socket.id, roomId);

    const count = rooms.get(roomId).size;
    

    io.to(roomId).emit("users-updated", { count });
  });

  socket.on(
    "play-state-change",
    ({ roomId, isPlaying, currentTime, videoId }) => {
      const state = roomStates.get(roomId);
      if (state) {
        state.isPlaying = isPlaying;
        state.currentTime = currentTime;
        if (videoId) state.videoId = videoId;
      }
      socket.to(roomId).emit("play-state", { isPlaying, currentTime });
    }
  );

  socket.on("sync-time", ({ roomId, currentTime }) => {
    const state = roomStates.get(roomId);
    if (state) {
      state.currentTime = currentTime;
    }
    socket.to(roomId).emit("sync-time", { currentTime });
  });

  socket.on("request-sync", ({ roomId }) => {
    const state = roomStates.get(roomId);
    if (state) {
      socket.emit("play-state", state);
    }
  });

  socket.on("change-video", (data) => {
    socket.to(data.roomId).emit("video-changed", data.videoId);
  });

  socket.on("disconnecting", () => {
    const roomId = userRooms.get(socket.id);
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).delete(socket.id);
      userRooms.delete(socket.id);

      const count = rooms.get(roomId).size;
      io.to(roomId).emit("users-updated", { count });

      if (count === 0) {
        rooms.delete(roomId);
        roomStates.delete(roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
});
