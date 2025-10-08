const { Server } = require('socket.io');

let ioInstance = null;

function initIo(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "https://altheas-crochet-project.vercel.app"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    },
  });
  return ioInstance;
}

function setIo(io) {
  ioInstance = io;
}

function getIo() {
  return ioInstance;
}

module.exports = { initIo, setIo, getIo };
