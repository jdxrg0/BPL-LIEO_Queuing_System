let io;

module.exports = {
  init: (serverIo) => {
    io = serverIo;
    return io;
  },
  getIo: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  }
};
