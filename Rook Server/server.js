const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

let playerCount = 0;
io.on("connection", (socket) => {
  console.log(`user connected ID: ${socket.id}`);
  socket.emit("connected", { handshakeNum: Math.floor(Math.random() * 100) });
  playerCount++;
  console.log("connected player count: ", playerCount);

  socket.on("disconnect", () => {
    console.log(`user disconnected ID: ${socket.id}`);
    playerCount--;
    console.log("connected player count: ", playerCount);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
