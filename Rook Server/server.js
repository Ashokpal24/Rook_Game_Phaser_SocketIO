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
let currentActivePlayer = 1;
io.on("connection", (socket) => {
  console.log(`user connected ID: ${socket.id}`);
  playerCount++;
  console.log("connected player count: ", playerCount);

  if (playerCount == 2) {
    io.emit("gameStart");
  }
  if (playerCount < 3) {
    socket.emit("connected", {
      handshakeNum: Math.floor(Math.random() * 100),
      playerNum: playerCount,
    });
  } else {
    socket.disconnect(true);
    console.log(`user disconnected [Full room] ID: ${socket.id}`);
    playerCount--;
    console.log("connected player count: ", playerCount);
  }

  socket.on("nextPlayer", () => {
    currentActivePlayer == 1
      ? (currentActivePlayer = 2)
      : (currentActivePlayer = 1);
    console.log(
      "Active Player: " + currentActivePlayer + " Socket: " + socket.id,
    );
    io.emit("currPlayerChanged", {
      curr: currentActivePlayer,
    });
  });

  socket.on("changedSelect", (data) => {
    io.emit("changedSelect", { ...data });
  });

  socket.on("movePlayer", () => {
    io.emit("movePlayer");
  });

  socket.on("disconnect", () => {
    console.log(`user disconnected ID: ${socket.id}`);
    playerCount--;
    io.emit("gameStop");
    console.log("connected player count: ", playerCount);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
